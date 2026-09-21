const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Stop = require('../models/Stop');

const seed = async () => {
  await connectDB();

  // 1. Ensure admin exists
  const adminExists = await User.findOne({ username: 'admin' });
  if (!adminExists) {
    const hashedAdmin = await bcrypt.hash('admin', 10);
    await User.create({
      username: 'admin',
      password: hashedAdmin,
      role: 'admin',
      name: 'Super Admin',
      email: 'admin@govtracker.com',
      firstLogin: false
    });
    console.log('✅ Admin account seeded: admin / admin');
  }

  // 2. Ensure a driver exists
  let driver = await User.findOne({ username: 'driver1' });
  if (!driver) {
    const hashedDriver = await bcrypt.hash('driver1', 10);
    driver = await User.create({
      username: 'driver1',
      password: hashedDriver,
      role: 'driver',
      name: 'Rajesh Kumar',
      email: 'driver1@govtracker.com',
      firstLogin: false
    });
    console.log('✅ Driver account seeded: driver1 / driver1');
  }

  // 3. Ensure a route exists
  let route = await Route.findOne({ name: 'Central Route A' });
  if (!route) {
    route = await Route.create({
      name: 'Central Route A',
      stops: [
        { name: 'Connaught Place', lat: 28.6304, lng: 77.2177, seq: 1 },
        { name: 'India Gate', lat: 28.6129, lng: 77.2295, seq: 2 }
      ]
    });
    console.log('✅ Route seeded: Central Route A');
  }

  // 4. Ensure a bus exists
  let bus = await Bus.findOne({ numberPlate: 'DL-1PA-1234' });
  if (!bus) {
    bus = await Bus.create({
      name: 'DTC 101',
      numberPlate: 'DL-1PA-1234',
      capacity: 50,
      driver: driver._id,
      route: route._id,
      isActive: true,
      lastKnownLocation: {
        lat: 28.6304,
        lng: 77.2177,
        updatedAt: new Date()
      }
    });
    console.log('✅ Bus seeded: DTC 101 (DL-1PA-1234)');
  }

  console.log('🎉 Test data seeding completed.');
};

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
