const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');

const seed = async () => {
  await connectDB();

  const existing = await User.findOne({ username: 'divyansh' });
  if (existing) {
    console.log('User divyansh already exists. Updating password and email...');
    existing.password = await bcrypt.hash('12345', 10);
    existing.email = 'trackmate15@gmail.com';
    await existing.save();
    return;
  }

  const hashedPassword = await bcrypt.hash('12345', 10);
  await User.create({
    username: 'divyansh',
    password: hashedPassword,
    role: 'student',
    name: 'Divyansh',
    email: 'trackmate15@gmail.com',
    firstLogin: false
  });

  console.log('✅ User seeded: divyansh / 12345');
};

seed()
  .then(() => {
    console.log('Seeding completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
