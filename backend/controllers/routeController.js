const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Stop = require('../models/Stop');
const StudentAssignment = require('../models/StudentAssignment');
const { DEFAULT_SEG_SEC } = require('../config/constants');

const normalizeStopsPayload = (stops = []) =>
  stops
    .map((stop, index) => ({
      name: stop.name?.trim() || `Stop ${index + 1}`,
      lat: Number(stop.lat ?? stop.latitude),
      lng: Number(stop.lng ?? stop.longitude),
      seq: stop.seq ?? stop.sequence ?? index
    }))
    .filter((stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng))
    .sort((a, b) => a.seq - b.seq);

const buildStopDocument = (routeId, stop, index) => ({
  route: routeId,
  name: stop.name,
  latitude: stop.lat,
  longitude: stop.lng,
  sequence: Number.isFinite(stop.seq) ? stop.seq : index,
  averageTravelMinutes: Number.isFinite(stop.averageTravelMinutes) ? stop.averageTravelMinutes : 2
});

const syncStopsForRoute = async (routeId, stops) => {
  if (!Array.isArray(stops) || stops.length === 0) {
    return;
  }

  const existingStops = await Stop.find({ route: routeId }).sort({ sequence: 1 });
  if (!existingStops.length) {
    await Stop.insertMany(stops.map((stop, index) => buildStopDocument(routeId, stop, index)));
    return;
  }

  const existingBySequence = new Map(existingStops.map((stop) => [stop.sequence, stop]));
  for (let index = 0; index < stops.length; index += 1) {
    const stop = stops[index];
    const sequence = Number.isFinite(stop.seq) ? stop.seq : index;
    const payload = buildStopDocument(routeId, stop, sequence);
    const existing = existingBySequence.get(sequence);
    if (existing) {
      existingBySequence.delete(sequence);
      await Stop.findByIdAndUpdate(existing._id, payload, { runValidators: true });
    } else {
      await Stop.create(payload);
    }
  }

  if (existingBySequence.size) {
    const removedStops = Array.from(existingBySequence.values());
    const removedIds = removedStops.map((stop) => stop._id);
    await StudentAssignment.deleteMany({ stop: { $in: removedIds } });
    await Stop.deleteMany({ _id: { $in: removedIds } });
  }
};

const buildSegStats = (stops = []) =>
  Array(Math.max(stops.length - 1, 0))
    .fill(null)
    .map(() => ({ avgSec: DEFAULT_SEG_SEC, samples: 1 }));

const createRoute = async (req, res) => {
  try {
    const { name, geojson, stops } = req.body;
    if (!name || !Array.isArray(stops) || stops.length === 0) {
      return res.status(400).json({ message: 'Route name and at least one stop are required' });
    }

    const normalizedStops = normalizeStopsPayload(stops);

    const route = await Route.create({
      name,
      geojson: geojson || null,
      stops: normalizedStops,
      segStats: buildSegStats(normalizedStops)
    });

    await syncStopsForRoute(route._id, normalizedStops);

    res.status(201).json(route);
  } catch (error) {
    console.error('createRoute error', error);
    res.status(500).json({ message: 'Failed to create route', error: error.message });
  }
};

const getRoutes = async (_req, res) => {
  const routes = await Route.find().sort({ createdAt: -1 });
  res.json(routes);
};

const updateRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    if (req.body.name !== undefined) {
      route.name = req.body.name.trim();
    }

    if (req.body.geojson !== undefined) {
      route.geojson = req.body.geojson;
    }

    if (Array.isArray(req.body.stops)) {
      const normalizedStops = normalizeStopsPayload(req.body.stops);
      route.stops = normalizedStops;
      const segments = Math.max(normalizedStops.length - 1, 0);
      const nextSegStats = [];
      for (let idx = 0; idx < segments; idx += 1) {
        nextSegStats[idx] = route.segStats?.[idx] || { avgSec: DEFAULT_SEG_SEC, samples: 1 };
      }
      route.segStats = nextSegStats;
      await syncStopsForRoute(route._id, normalizedStops);
    }

    await route.save();
    res.json(route);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteRoute = async (req, res) => {
  const route = await Route.findById(req.params.id);
  if (!route) {
    return res.status(404).json({ message: 'Route not found' });
  }

  // Clean up associated stops and student assignments BEFORE deleting the route
  const routeStops = await Stop.find({ route: route._id }, '_id');
  if (routeStops.length) {
    const stopIds = routeStops.map((stop) => stop._id);
    await StudentAssignment.deleteMany({ stop: { $in: stopIds } });
    await Stop.deleteMany({ _id: { $in: stopIds } });
  }
  await Bus.updateMany({ route: route._id }, { route: null });

  await Route.findByIdAndDelete(route._id);

  res.json({ message: 'Route removed' });
};

const importDemoRoutes = async (req, res) => {
  try {
    const apiKey = process.env.VITE_ROUTES_API_KEY || 'JLBd7FbkcW5dPG2xbuIAIhmvbIEr1qH6';
    const demoRoutes = [
      { name: '[API] Delhi Central to Noida Sector 62', source: { lat: 28.6139, lng: 77.2090 }, dest: { lat: 28.6276, lng: 77.3724 } },
      { name: '[API] Gurgaon Cyber City to Airport T3', source: { lat: 28.4900, lng: 77.0886 }, dest: { lat: 28.5562, lng: 77.1000 } },
      { name: '[API] Connaught Place to South Ex', source: { lat: 28.6304, lng: 77.2177 }, dest: { lat: 28.5684, lng: 77.2197 } },
      { name: '[API] Dwarka Sector 21 to Janakpuri', source: { lat: 28.5523, lng: 77.0583 }, dest: { lat: 28.6219, lng: 77.0878 } },
      { name: '[API] Vasant Kunj to Saket Mall', source: { lat: 28.5293, lng: 77.1533 }, dest: { lat: 28.5286, lng: 77.2193 } },
      { name: '[API] Pitampura to Rohini Sector 15', source: { lat: 28.7031, lng: 77.1323 }, dest: { lat: 28.7366, lng: 77.1130 } },
      { name: '[API] Karol Bagh to Kashmiri Gate', source: { lat: 28.6538, lng: 77.1912 }, dest: { lat: 28.6675, lng: 77.2285 } },
      { name: '[API] Lajpat Nagar to Hauz Khas', source: { lat: 28.5677, lng: 77.2433 }, dest: { lat: 28.5494, lng: 77.2001 } }
    ];

    const imported = [];
    for (const route of demoRoutes) {
      let latlngs = [];
      try {
        // Try TomTom API first
        const tomtomUrl = `https://api.tomtom.com/routing/1/calculateRoute/${route.source.lat},${route.source.lng}:${route.dest.lat},${route.dest.lng}/json?key=${apiKey}`;
        const axios = require('axios');
        const apiRes = await axios.get(tomtomUrl);
        const data = apiRes.data;
        if (data.routes && data.routes.length > 0) {
          latlngs = data.routes[0].legs.flatMap(leg => leg.points.map(p => [p.latitude, p.longitude]));
        } else {
          throw new Error('TomTom returned no routes');
        }
      } catch (e) {
        console.warn('API fetch failed, falling back to OSRM:', e.message);
        const axios = require('axios');
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${route.source.lng},${route.source.lat};${route.dest.lng},${route.dest.lat}?geometries=geojson&overview=full`;
        const apiRes = await axios.get(osrmUrl);
        const data = apiRes.data;
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          latlngs = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        }
      }

      if (latlngs.length > 0) {
        const geojson = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: latlngs.map(([lat, lng]) => [lng, lat])
          }
        };

        const stops = [
          { name: 'Start', lat: route.source.lat, lng: route.source.lng, seq: 0 },
          { name: 'End', lat: route.dest.lat, lng: route.dest.lng, seq: 1 }
        ];

        const newRoute = await Route.create({
          name: route.name,
          geojson,
          stops,
          segStats: buildSegStats(stops)
        });
        await syncStopsForRoute(newRoute._id, stops);
        imported.push(newRoute);
      }
    }

    res.status(201).json({ message: 'Routes imported successfully', imported });
  } catch (error) {
    console.error('importDemoRoutes error', error);
    res.status(500).json({ message: 'Failed to import routes', error: error.message });
  }
};

module.exports = { createRoute, getRoutes, updateRoute, deleteRoute, importDemoRoutes };
