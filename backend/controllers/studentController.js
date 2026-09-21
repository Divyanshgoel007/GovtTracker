const Stop = require('../models/Stop');
const Trip = require('../models/Trip');
const StudentAssignment = require('../models/StudentAssignment');
const { getCachedTripState } = require('../inMemory/activeTrips');
const Route = require('../models/Route');

// Improved fallback: works with both stopId and sequence number
const fallbackEtaMs = async ({ trip, targetStopId, targetStopSeq }) => {
  if (!trip) return { etaMs: null, allEtas: {} };

  // Try to get stops from route's embedded stops first (more reliable)
  const route = await Route.findById(trip.route);
  let orderedStops = [];

  if (route?.stops?.length > 0) {
    // Use embedded stops from route (sorted by seq)
    orderedStops = [...route.stops].sort((a, b) => (a.seq || 0) - (b.seq || 0));
  } else {
    // Fallback to physical Stop collection
    orderedStops = await Stop.find({ route: trip.route }).sort({ sequence: 1 });
  }

  if (!orderedStops.length) return { etaMs: null, allEtas: {} };

  const currentIndex = Math.max(trip.currentStopIndex || 0, 0);

  // Find target stop by sequence (primary) or by _id (fallback)
  let targetIndex = -1;
  if (targetStopSeq != null) {
    targetIndex = orderedStops.findIndex((stop) =>
      String(stop.seq ?? stop.sequence) === String(targetStopSeq)
    );
  }
  if (targetIndex === -1 && targetStopId) {
    targetIndex = orderedStops.findIndex((stop) =>
      String(stop._id) === String(targetStopId)
    );
  }

  const allEtas = {};
  let currentAccumulatedMs = 0;
  let etaMs = null;

  for (let idx = currentIndex; idx < orderedStops.length; idx += 1) {
    const stop = orderedStops[idx];
    const seqStr = String(stop.seq ?? stop.sequence);
    
    // Accumulate time for stops AFTER the current index
    if (idx > currentIndex) {
      const prevStop = orderedStops[idx - 1];
      const minutes = prevStop?.averageTravelMinutes || Number(process.env.DEFAULT_ETA_MINUTES) || 2;
      currentAccumulatedMs += minutes * 60 * 1000;
    }
    
    allEtas[seqStr] = currentAccumulatedMs;
    
    if (idx === targetIndex) {
      etaMs = currentAccumulatedMs;
    }
  }

  if (targetIndex !== -1 && targetIndex <= currentIndex) {
    etaMs = null;
  }

  return { etaMs, allEtas };
};

const StopEvent = require('../models/StopEvent'); // Required

const getAssignment = async (req, res) => {
  const assignment = await StudentAssignment.findOne({ student: req.user._id })
    .populate('bus', 'name numberPlate lastKnownLocation')
    .populate('stop');

  if (!assignment) {
    return res.json(null);
  }

  // Fetch recent events for the active trip of this bus
  let recentEvents = [];
  const activeTrip = await Trip.findOne({ bus: assignment.bus._id, status: 'ONGOING' });

  if (activeTrip) {
    recentEvents = await StopEvent.find({ trip: activeTrip._id })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();
  }

  const response = assignment.toObject();
  response.recentEvents = recentEvents;

  res.json(response);
};

const getEta = async (req, res) => {
  const assignment = await StudentAssignment.findOne({ student: req.user._id })
    .populate('stop')
    .populate('bus');
  if (!assignment) {
    return res.status(404).json({ message: 'No assignment found' });
  }

  const trip = await Trip.findOne({ bus: assignment.bus._id, status: 'ONGOING' }).populate('route');
  if (!trip) {
    return res.json({ etaMs: null, source: 'no-trip' });
  }

  const targetStopId = assignment.stop?._id?.toString();
  // Get sequence from both possible field names
  const targetStopSeq = assignment.stop?.sequence ?? assignment.stop?.seq;
  const targetStopSeqStr = targetStopSeq != null ? String(targetStopSeq) : null;

  const activeState = getCachedTripState(trip._id);

  // Try to find ETA in cache - check by sequence FIRST (our primary key now)
  let liveEta = null;

  if (activeState?.etaCache) {
    // Priority 1: Match by sequence (our standardized key)
    if (targetStopSeqStr && typeof activeState.etaCache[targetStopSeqStr] === 'number') {
      liveEta = activeState.etaCache[targetStopSeqStr];
    }
    // Priority 2: Match by MongoDB _id (legacy support)
    if (typeof liveEta !== 'number' && targetStopId && typeof activeState.etaCache[targetStopId] === 'number') {
      liveEta = activeState.etaCache[targetStopId];
    }
    // Priority 3: Search through all entries for a match
    if (typeof liveEta !== 'number') {
      const cacheEntries = Object.entries(activeState.etaCache);
      for (const [key, value] of cacheEntries) {
        if (typeof value === 'number' && (key === targetStopSeqStr || key === targetStopId)) {
          liveEta = value;
          break;
        }
      }
    }
  }

  if (typeof liveEta === 'number') {
    return res.json({
      etaMs: Math.max(0, Math.round(liveEta)),
      etaMinutes: Math.ceil(liveEta / 60000),
      source: 'live',
      allEtas: activeState?.etaCache || {}
    });
  }

  // Fallback calculation with both ID and sequence
  const fallbackResult = await fallbackEtaMs({ trip, targetStopId, targetStopSeq });
  return res.json({
    etaMs: fallbackResult.etaMs,
    etaMinutes: fallbackResult.etaMs != null ? Math.ceil(fallbackResult.etaMs / 60000) : null,
    source: 'fallback',
    allEtas: fallbackResult.allEtas || {}
  });
};

const registerNotificationToken = async (req, res) => {
  const { token } = req.body;
  const assignment = await StudentAssignment.findOneAndUpdate(
    { student: req.user._id },
    { notificationToken: token },
    { new: true }
  );
  res.json(assignment);
};

const getLiveTrip = async (req, res) => {
  const assignment = await StudentAssignment.findOne({ student: req.user._id });
  if (!assignment) {
    return res.json(null); // No assignment yet — not an error
  }

  const trip = await Trip.findOne({ bus: assignment.bus, status: 'ONGOING' })
    .populate('bus', 'name lastKnownLocation')
    .populate('driver', 'name phone')
    .populate('route'); // This fetches the full route with stops array

  if (!trip) {
    return res.json(null);
  }

  const response = trip.toObject();
  const stops = response.route?.stops || [];
  const idx = response.currentStopIndex || 0;

  response.currentStop = stops[idx] || null;
  response.nextStop = stops[idx + 1] || null;
  response.progress = {
    totalStops: stops.length,
    completedStops: idx,
    percentage: stops.length ? Math.round((idx / stops.length) * 100) : 0
  };

  res.json(response);
};

// Update notification preferences
const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { enabled, proximityMinutes, proximityMeters, arrivalAlert } = req.body;

    let assignment = await StudentAssignment.findOne({ student: userId });
    if (!assignment) {
      return res.status(400).json({ message: 'No bus assignment yet. Please select a bus in your profile first.' });
    }

    // Initialize preferences if not exists
    if (!assignment.notificationPreferences) {
      assignment.notificationPreferences = {};
    }

    // Update only provided fields
    if (typeof enabled === 'boolean') {
      assignment.notificationPreferences.enabled = enabled;
    }
    if (typeof proximityMinutes === 'number' && proximityMinutes >= 1 && proximityMinutes <= 30) {
      assignment.notificationPreferences.proximityMinutes = proximityMinutes;
    }
    if (typeof proximityMeters === 'number' && proximityMeters >= 100 && proximityMeters <= 2000) {
      assignment.notificationPreferences.proximityMeters = proximityMeters;
    }
    if (typeof arrivalAlert === 'boolean') {
      assignment.notificationPreferences.arrivalAlert = arrivalAlert;
    }

    await assignment.save();

    res.json({
      message: 'Preferences updated',
      preferences: assignment.notificationPreferences
    });
  } catch (error) {
    console.error('updateNotificationPreferences error:', error);
    res.status(500).json({ message: 'Failed to update preferences', error: error.message });
  }
};

// Get current notification preferences
const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const assignment = await StudentAssignment.findOne({ student: userId });

    // Return defaults when no assignment exists yet (new students)
    const prefs = assignment?.notificationPreferences || {
      enabled: true,
      proximityMinutes: 5,
      proximityMeters: 500,
      arrivalAlert: true
    };

    res.json(prefs);
  } catch (error) {
    console.error('getNotificationPreferences error:', error);
    res.status(500).json({ message: 'Failed to get preferences', error: error.message });
  }
};

// Update student's own assignment (bus/stop)
const Bus = require('../models/Bus');

const updateMyAssignment = async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { busId, stopSeq } = req.body;

    if (!busId) {
      return res.status(400).json({ message: 'Bus is required' });
    }

    // Get bus with route info
    const bus = await Bus.findById(busId).populate('route');
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    // Find or create assignment
    let assignment = await StudentAssignment.findOne({ student: userId });

    if (!assignment) {
      // Create new assignment
      assignment = new StudentAssignment({
        student: userId,
        bus: busId,
        stop: null
      });
    } else {
      assignment.bus = busId;
    }

    // Set stop by sequence if provided - must look up from Stop collection
    if (stopSeq != null && bus.route) {
      // Look up the actual Stop document from the Stop collection
      const stopDoc = await Stop.findOne({
        route: bus.route._id,
        sequence: stopSeq
      });
      if (stopDoc) {
        assignment.stop = stopDoc._id;
      } else {
        // Fallback: try to match by name in route's embedded stops
        const embeddedStop = bus.route.stops?.find(s => s.seq === stopSeq);
        if (embeddedStop) {
          // Create a Stop document if it doesn't exist
          const newStop = await Stop.findOneAndUpdate(
            { route: bus.route._id, sequence: stopSeq },
            {
              route: bus.route._id,
              name: embeddedStop.name,
              latitude: embeddedStop.lat,
              longitude: embeddedStop.lng,
              sequence: stopSeq,
              averageTravelMinutes: 2
            },
            { upsert: true, new: true }
          );
          assignment.stop = newStop._id;
        }
      }
    }

    await assignment.save();

    // Populate for response
    await assignment.populate('bus', 'name numberPlate');
    await assignment.populate('stop');

    res.json({
      message: 'Assignment updated',
      assignment: {
        bus: assignment.bus,
        stop: assignment.stop
      }
    });
  } catch (error) {
    console.error('updateMyAssignment error:', error);
    res.status(500).json({ message: 'Failed to update assignment', error: error.message });
  }
};

// Get buses with routes for student selection
const getBusesWithRoutes = async (req, res) => {
  try {
    const buses = await Bus.find()
      .populate({
        path: 'route',
        select: 'name stops',
        populate: { path: 'stops', select: 'name seq sequence' }
      })
      .select('name numberPlate route');

    // Find all currently active trips to mark which buses are running
    const activeTrips = await Trip.find({ status: 'ONGOING' }).select('bus');
    const activeBusIds = new Set(activeTrips.map(t => t.bus.toString()));

    // Format response with stops and active status
    const result = buses.map(bus => ({
      _id: bus._id,
      name: bus.name,
      numberPlate: bus.numberPlate,
      active: activeBusIds.has(bus._id.toString()),
      route: bus.route ? {
        _id: bus.route._id,
        name: bus.route.name,
        stops: (bus.route.stops || []).map(s => ({
          _id: s._id,
          name: s.name,
          seq: s.seq ?? s.sequence
        })).sort((a, b) => a.seq - b.seq)
      } : null
    }));

    // Optionally sort so active buses are at the top
    result.sort((a, b) => (b.active === a.active) ? 0 : b.active ? 1 : -1);

    res.json(result);
  } catch (error) {
    console.error('getBusesWithRoutes error:', error);
    res.status(500).json({ message: 'Failed to get buses', error: error.message });
  }
};

module.exports = {
  getAssignment,
  getEta,
  registerNotificationToken,
  getLiveTrip,
  updateNotificationPreferences,
  getNotificationPreferences,
  updateMyAssignment,
  getBusesWithRoutes
};
