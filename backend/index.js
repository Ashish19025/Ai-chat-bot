const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware & Routes
const auth = require('./middleware/auth');
const authRoutes = require('./routes/authRoutes');

// DB Connect
const connectDB = require('./db/connect');

// Models
const Chat = require('./models/Chat');
const User = require('./models/User');

// Init Express App
const app = express();
app.use(cors());
app.use(express.json());

// ------------------------
// 🛡️ Auth Routes
// ------------------------
app.use('/api/auth', authRoutes);

// ------------------------
// 💬 POST /api/chat
// ------------------------

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  console.log('🔍 Token received:', token);
  console.log('🔍 JWT_SECRET:', process.env.JWT_SECRET);
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔍 Decoded token:', decoded);
  } catch (err) {
    console.log('🔍 Token verification error:', err.message);
    return res.status(401).json({ error: "Invalid token" });
  }

  const email = decoded.email;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    // Find user
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Send to Ollama
    const response = await axios.post(
      'http://localhost:11434/api/generate',
      {
        model: 'mistral',
        prompt: message,
        stream: false
      }
    );

    const reply = response.data.response;

    // Save chat
    await Chat.create({
      user: user._id,
      messages: [
        { role: 'user', content: message },
        { role: 'assistant', content: reply }
      ]
    });

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});
// ------------------------
// 📚 GET /api/history - Get chat history for authenticated user
// ------------------------
app.get('/api/history', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const email = decoded.email;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.json([]);

    const history = await Chat.find({ user: user._id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    console.error('❌ History fetch error:', err.message);
    res.status(500).json({ error: 'Error fetching chat history' });
  }
});

// ------------------------
// 🟢 Start Server
// ------------------------
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`✅ API running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // 💥 Stop process if DB fails
  });
