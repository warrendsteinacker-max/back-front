import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import webpush from 'web-push';
import nodemailer from 'nodemailer';

// 1. User Schema configuration
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true }, 
  pushSubscription: { type: Object, default: null } 
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

  // Test the ping route completely isolated from configurations
  if (req.method === 'POST' && req.body?.type === 'ping') {
    return res.status(200).json({ 
      status: "Success!", 
      message: "Your Vercel server is alive and communicating perfectly!" 
    });
  }

  if (req.method === 'POST') {
    try {
      await connectDB();

      const { username, password, email, type, pushSubscription, notificationPayload } = req.body;

      // REGISTER ROUTE
      if (type === 'register') {
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, email, password: hashedPassword, pushSubscription: pushSubscription || null });
        return res.status(201).json({ message: 'User created' });
      }

      // LOGIN ROUTE
      if (type === 'login') {
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Wrong password' });

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

      // BROADCAST NOTIFICATIONS
      if (type === 'sendNotification') {
        // Safe contextual initialization for Web Push
        try {
          webpush.setVapidDetails(
            process.env.VAPID_SUBJECT || 'mailto:test@example.com',
            process.env.VAPID_PUBLIC_KEY || '',
            process.env.VAPID_PRIVATE_KEY || ''
          );
        } catch (vapidErr) {
          console.error("WebPush initialization failed:", vapidErr.message);
          return res.status(500).json({ error: "Server WebPush configuration missing keys." });
        }

        // Safe contextual initialization for Nodemailer
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,       
          port: parseInt(process.env.EMAIL_PORT || '465'), 
          secure: process.env.EMAIL_SECURE === 'true',     
          auth: {
            user: process.env.EMAIL_USER,     
            pass: process.env.EMAIL_PASS,     
          },
        });

        const users = await User.find({}).select('email pushSubscription');
        
        if (users.length === 0) {
          return res.status(200).json({ message: 'No users found to notify.' });
        }

        const titleText = notificationPayload?.title || 'System Alert';
        const bodyText = notificationPayload?.body || 'New server message received.';
        const payload = JSON.stringify({ title: titleText, body: bodyText });

        const notificationPromises = [];

        users.forEach(user => {
          if (user.pushSubscription) {
            const pushPromise = webpush.sendNotification(user.pushSubscription, payload)
              .catch(async (err) => {
                if (err.statusCode === 410 || err.statusCode === 404) {
                  await User.findByIdAndUpdate(user._id, { pushSubscription: null });
                }
                console.error(`Push failed for user ${user._id}:`, err.message);
              });
            notificationPromises.push(pushPromise);
          }

          if (user.email) {
            const emailPromise = transporter.sendMail({
              from: `"Server Notification" <${process.env.EMAIL_USER}>`,
              to: user.email,
              subject: titleText,
              text: bodyText,
              html: `<p><strong>${titleText}</strong></p><p>${bodyText}</p>`
            }).catch(err => {
              console.error(`Email failed to send to ${user.email}:`, err.message);
            });
            notificationPromises.push(emailPromise);
          }
        });

        await Promise.allSettled(notificationPromises);
        return res.status(200).json({ success: true, message: 'Dispatched push and email notifications to all users.' });
      }

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(405).send('Method Not Allowed');
  }
}




///








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




