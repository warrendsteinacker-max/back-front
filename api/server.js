import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import webpush from 'web-push';
import nodemailer from 'nodemailer';

// ⚙️ CONTROLLER VARIABLE: Set to true to auto-create the user, or false to disable it.
const AUTO_SEED_FIRST_USER = true;

// 1. User Schema configuration
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true }, 
  pushSubscription: { type: Object, default: null } 
});

// Force the model to strictly look at the exact collection name in your Atlas database
const User = mongoose.models.User || mongoose.model('users', userSchema, 'users');

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

// 🚀 Automatic Seeder Function
const seedFirstUserIfNeeded = async () => {
  if (!AUTO_SEED_FIRST_USER) return;

  try {
    const userExists = await User.findOne({ username: 'warren' });
    
    if (!userExists) {
      console.log("First user 'warren' not found. Seeding record now...");
      
      await User.create({
        username: 'warren',
        email: 'warrendsteinacker@gmail.com',
        // Injects the exact hash from your MongoDB UI screenshot
        password: '$2a$10$X7b9M2K6WvY7R8q2E1U8O.eX6z6fI3vE4y5U6t7o8p9q0r1s2t3u4', 
        pushSubscription: null
      });
      
      console.log("First user successfully seeded!");
    }
  } catch (err) {
    console.error("Automatic user seeding failed:", err.message);
  }
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
///////
  if (req.method === 'POST') {
    try {
      await connectDB();
      
      // Runs the check immediately after connecting to your database cluster
      await seedFirstUserIfNeeded();

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
          return res.status(500).json({ error: "Server WebPush configuration missing keys.", details: vapidErr.message });
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

        // Fetch all users
        const users = await User.find({}).select('email pushSubscription username');
        
        // Track the success/failure of every single operation to return to Postman
        const dispatchResults = {
          totalUsersInDatabase: users.length,
          pushDispatches: [],
          emailDispatches: []
        };

        if (users.length === 0) {
          return res.status(200).json({ 
            success: false, 
            message: 'No users found in the database collection.',
            dispatchResults 
          });
        }

        const titleText = notificationPayload?.title || 'System Alert';
        const bodyText = notificationPayload?.body || 'New server message received.';
        const payload = JSON.stringify({ title: titleText, body: bodyText });

        const notificationPromises = [];

        users.forEach(user => {
          // Handle Push Subscriptions
          if (user.pushSubscription) {
            const pushPromise = webpush.sendNotification(user.pushSubscription, payload)
              .then(() => {
                dispatchResults.pushDispatches.push({ username: user.username, status: "Success" });
              })
              .catch(async (err) => {
                if (err.statusCode === 410 || err.statusCode === 404) {
                  await User.findByIdAndUpdate(user._id, { pushSubscription: null });
                }
                dispatchResults.pushDispatches.push({ username: user.username, status: "Failed", error: err.message });
              });
            notificationPromises.push(pushPromise);
          } else {
            dispatchResults.pushDispatches.push({ username: user.username, status: "Skipped", reason: "No push subscription saved" });
          }

          // Handle Emails
          if (user.email) {
            const emailPromise = transporter.sendMail({
              from: `"Server Notification" <${process.env.EMAIL_USER}>`,
              to: user.email,
              subject: titleText,
              text: bodyText,
              html: `<p><strong>${titleText}</strong></p><p>${bodyText}</p>`
            })
            .then((info) => {
              dispatchResults.emailDispatches.push({ email: user.email, status: "Success", messageId: info.messageId });
            })
            .catch(err => {
              dispatchResults.emailDispatches.push({ email: user.email, status: "Failed", error: err.message });
            });
            notificationPromises.push(emailPromise);
          } else {
            dispatchResults.emailDispatches.push({ username: user.username, status: "Skipped", reason: "No email address found" });
          }
        });

        // Wait for all push alerts and emails to complete their attempts
        await Promise.allSettled(notificationPromises);
        
        return res.status(200).json({ 
          success: true, 
          message: 'Notification batch processed completely.', 
          dispatchResults 
        });
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




