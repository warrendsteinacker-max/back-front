// import mongoose from 'mongoose';
// import jwt from 'jsonwebtoken';
// import bcrypt from 'bcryptjs';

// // Define User Schema inside the file to keep it to one "fn server"
// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
//   password: { type: String, required: true }
// });

// const User = mongoose.models.User || mongoose.model('User', userSchema);

// // DB Connection Utility
// const connectDB = async () => {
//   if (mongoose.connections[0].readyState) return;
//   await mongoose.connect(process.env.MONGODB_URI);
// };
// ///////////////
// export default async function handler(req, res) {
//   // 1. Handle CORS manually for Electron
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

//   if (req.method === 'OPTIONS') return res.status(200).end();

//   await connectDB();

//   // 2. The Logic
//   if (req.method === 'POST') {
//     const { username, password, type } = req.body; // 'type' tells us if it's login or register

//     try {
//       if (type === 'register') {
//         const hashedPassword = await bcrypt.hash(password, 10);
//         const newUser = await User.create({ username, password: hashedPassword });
//         return res.status(201).json({ message: 'User created' });
//       }

//       if (type === 'login') {
//         const user = await User.findOne({ username });
//         if (!user) return res.status(401).json({ error: 'User not found' });

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) return res.status(401).json({ error: 'Wrong password' });

//         const token = jwt.sign(
//           { id: user._id, username: user.username },
//           process.env.JWT_SECRET,
//           { expiresIn: '7d' }
//         );

//         return res.status(200).json({ token, success: true });
//       }
//     } catch (error) {
//       return res.status(500).json({ error: error.message });
//     }
//   }

//   res.status(405).send('Method Not Allowed');
// }





/////Still have to figure out how to config amny emails into this
////
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import webpush from 'web-push';

// 1. Configure Web Push with your free VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:test@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// 2. Updated User Schema to hold the native browser subscription object
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  pushSubscription: { type: Object, default: null } // Stores the native browser endpoint JSON
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

///////////////
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  if (req.method === 'POST') {
    const { username, password, type, pushSubscription, notificationPayload } = req.body;

    try {
      // REGISTER
      if (type === 'register') {
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, password: hashedPassword, pushSubscription: pushSubscription || null });
        return res.status(201).json({ message: 'User created' });
      }

      // LOGIN (Updates their active browser push registration data)
      if (type === 'login') {
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Wrong password' });

        // If frontend passes a fresh browser subscription object, save it to MongoDB
        if (pushSubscription) {
          user.pushSubscription = pushSubscription;
          await user.save();
        }

        const token = jwt.sign(
          { id: user._id, username: user.username },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.status(200).json({ token, success: true });
      }

      // BROADCAST NATIVE NOTIFICATION TO ALL USERS FOR FREE
      if (type === 'sendNotification') {
        // Grab all users who have registered a web push subscription object
        const users = await User.find({ pushSubscription: { $ne: null } }).select('pushSubscription');
        
        if (users.length === 0) {
          return res.status(200).json({ message: 'No browser subscriptions found.' });
        }

        const payload = JSON.stringify({
          title: notificationPayload?.title || 'System Alert',
          body: notificationPayload?.body || 'New server message received.',
        });

        // Map over users and trigger the async push directly to browser networks
        const pushPromises = users.map(user => {
          return webpush.sendNotification(user.pushSubscription, payload)
            .catch(err => {
              // Clean up dead subscriptions if a user uninstalls the app or blocks alerts
              if (err.statusCode === 410 || err.statusCode === 404) {
                user.pushSubscription = null;
                return user.save();
              }
              console.error('Error hitting browser push endpoint:', err);
            });
        });

        await Promise.all(pushPromises);
        
        return res.status(200).json({ success: true, message: 'Notifications fired directly to browsers.' });
      }

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  res.status(405).send('Method Not Allowed');
}