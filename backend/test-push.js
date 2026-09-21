const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const webPush = require('web-push');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BAtGiwcOhuOVlxgLFG2wuAc6HD8XEYqTEunc00Ve4rAXV4yoV9VjQQsCYmcOdrepF5RWPRZ9HQS4iDYw60rscvg';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'Y8d_NCnJYQwnqm3a-wn7LEbK5SEwf7rKLoDSCeVjlwE';
webPush.setVapidDetails('mailto:admin@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({ 'pushSubscription': { $exists: true, $ne: null } });
  console.log('Users with push subscriptions:', users.length);
  if (users.length > 0) {
    for (const user of users) {
      console.log('Testing push to user:', user.username);
      try {
        await webPush.sendNotification(user.pushSubscription, JSON.stringify({
          title: '🤖 Agent Test Notification',
          body: 'This is a test from your AI assistant to verify Web Push is working!'
        }));
        console.log('✅ Push sent successfully to', user.username);
      } catch (e) {
        console.error('❌ Push failed for', user.username, ':', e.message);
      }
    }
  } else {
    console.log('No users found with a push subscription.');
  }
  process.exit(0);
}
test();
