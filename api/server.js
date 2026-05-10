import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Define User Schema inside the file to keep it to one "fn server"
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// DB Connection Utility
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

export default async function handler(req, res) {
  // 1. Handle CORS manually for Electron
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  // 2. The Logic
  if (req.method === 'POST') {
    const { username, password, type } = req.body; // 'type' tells us if it's login or register

    try {
      if (type === 'register') {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ username, password: hashedPassword });
        return res.status(201).json({ message: 'User created' });
      }

      if (type === 'login') {
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Wrong password' });

        const token = jwt.sign(
          { id: user._id, username: user.username },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.status(200).json({ token, success: true });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  res.status(405).send('Method Not Allowed');
}