const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await User.find();
  let count = 0;
  for(const u of users) {
    if (u.pushSubscription) {
      count++;
      console.log(u.username, u.pushSubscription.endpoint.substring(0, 50) + '...');
    }
  }
  console.log('Total valid subs:', count);
  process.exit(0);
});
