const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const User = require('../models/User');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Stop = require('../models/Stop');
const StudentAssignment = require('../models/StudentAssignment');

const seedGovData = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seed for GovTracker...');

    // 1. Create Admin
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        username: 'ad1',
        password: await bcrypt.hash('ad1', 10),
        role: 'admin',
        name: 'Transit Admin',
        firstLogin: false
      });
      console.log('✅ Created Admin (ad1/ad1)');
    }

    // 2. Create Route
    let route = await Route.findOne({ name: 'City Center Express' });
    if (!route) {
      route = await Route.create({
        name: 'City Center Express',
        stops: [
          { name: 'Central Station', lat: 28.6139, lng: 77.2090, seq: 0 },
          { name: 'City Hall', lat: 28.6150, lng: 77.2100, seq: 1 },
          { name: 'Tech Park', lat: 28.6180, lng: 77.2150, seq: 2 }
        ],
        geojson: {
          type: 'LineString',
          coordinates: [
            [77.2090, 28.6139],
            [77.2100, 28.6150],
            [77.2150, 28.6180]
          ]
        }
      });
      console.log('✅ Created Route: City Center Express');

      // Create standalone stops
      for (const s of route.stops) {
        await Stop.create({
          name: s.name,
          latitude: s.lat,
          longitude: s.lng,
          sequence: s.seq,
          route: route._id
        });
      }
    }

    // 3. Create Driver
    let driver = await User.findOne({ username: 'driver1' });
    if (!driver) {
      driver = await User.create({
        username: 'driver1',
        password: await bcrypt.hash('12345', 10),
        role: 'driver',
        name: 'John Doe',
        firstLogin: false
      });
      console.log('✅ Created Driver (driver1/12345)');
    }

    // 4. Create Bus
    let bus = await Bus.findOne({ name: 'GovBus 101' });
    if (!bus) {
      bus = await Bus.create({
        name: 'GovBus 101',
        numberPlate: 'GOV-2026',
        capacity: 50,
        driver: driver._id,
        route: route._id,
        isActive: true
      });
      console.log('✅ Created Bus (GovBus 101)');
      
      driver.driverMeta = { bus: bus._id };
      await driver.save();
    }

    // 5. Create Passenger (Divyansh)
    let passenger = await User.findOne({ username: 'divyansh' });
    if (!passenger) {
      passenger = await User.create({
        username: 'divyansh',
        password: await bcrypt.hash('12345', 10),
        role: 'student', // Keeping 'student' in db for backend compatibility
        name: 'Divyansh Goel',
        email: 'trackmate15@gmail.com',
        firstLogin: false
      });
      console.log('✅ Created Passenger (divyansh/12345)');
    } else {
      passenger.password = await bcrypt.hash('12345', 10);
      passenger.email = 'trackmate15@gmail.com';
      await passenger.save();
      console.log('✅ Updated Passenger (divyansh/12345)');
    }

    // 6. Assign Passenger to Bus
    let assignment = await StudentAssignment.findOne({ student: passenger._id });
    if (!assignment) {
      await StudentAssignment.create({
        student: passenger._id,
        bus: bus._id,
        stop: route.stops[1]._id, // Assign to 'City Hall' stop
        notificationPreferences: {
          enabled: true,
          proximityMinutes: 5,
          proximityMeters: 500,
          arrivalAlert: true
        }
      });
      console.log('✅ Assigned Divyansh to GovBus 101 at City Hall');
    }

    console.log('🎉 Seeding Complete! The system is ready to test.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedGovData();
