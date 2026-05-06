const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const connectDB = require('./db/connect');
const Chat = require('./models/Chat');
const User = require('./models/User');

// ── Constants ──────────────────────────────────────────────
const MAX_TITLE_LENGTH = 60;
const TITLE_TRUNCATE_AT = 57;

// ── App ────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// ── Rate limiters ──────────────────────────────────────────
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' }
});

const historyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' }
});

// ── Auth Routes ────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── Helper: verify JWT and return user document ────────────
const getUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('No token provided');
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findOne({ email: decoded.email });
  if (!user) throw new Error('User not found');
  return user;
};

// ── POST /api/chat ─────────────────────────────────────────
app.post('/api/chat', chatLimiter, async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  if (sessionId !== undefined && sessionId !== null) {
    if (typeof sessionId !== 'string' || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID.' });
    }
  }

  let user;
  try {
    user = await getUser(req);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }

  try {
    const response = await axios.post(
      process.env.OLLAMA_URL || 'http://localhost:11434/api/generate',
      { model: process.env.OLLAMA_MODEL || 'mistral', prompt: message, stream: false },
      { timeout: 120000 }
    );

    const reply = response.data.response;

    let chat;
    if (sessionId) {
      chat = await Chat.findOne({
        _id: new mongoose.Types.ObjectId(sessionId),
        user: user._id
      });
    }

    if (chat) {
      chat.messages.push({ role: 'user', content: message });
      chat.messages.push({ role: 'assistant', content: reply });
      chat.updatedAt = new Date();
      await chat.save();
    } else {
      const chars = [...message];
      const title =
        chars.length > MAX_TITLE_LENGTH
          ? chars.slice(0, TITLE_TRUNCATE_AT).join('') + '...'
          : message;
      chat = await Chat.create({
        user: user._id,
        title,
        messages: [
          { role: 'user', content: message },
          { role: 'assistant', content: reply }
        ]
      });
    }

    res.json({ reply, sessionId: chat._id });
  } catch (err) {
    console.error('Chat error:', err.message);
    if (['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'].includes(err.code)) {
      return res.status(503).json({
        error: 'AI service unavailable. Make sure Ollama is running with: ollama serve'
      });
    }
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// ── GET /api/history ───────────────────────────────────────
app.get('/api/history', historyLimiter, async (req, res) => {
  let user;
  try { user = await getUser(req); } catch (err) {
    return res.status(401).json({ error: err.message });
  }
  try {
    const sessions = await Chat.find({ user: user._id })
      .select('title createdAt updatedAt messages')
      .sort({ updatedAt: -1 });
    res.json(sessions.map(s => ({
      _id: s._id,
      title: s.title,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      messageCount: s.messages.length
    })));
  } catch (err) {
    console.error('History fetch error:', err.message);
    res.status(500).json({ error: 'Error fetching history' });
  }
});

// ── GET /api/history/:id ───────────────────────────────────
app.get('/api/history/:id', historyLimiter, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid session ID.' });
  }
  let user;
  try { user = await getUser(req); } catch (err) {
    return res.status(401).json({ error: err.message });
  }
  try {
    const chat = await Chat.findOne({ _id: req.params.id, user: user._id });
    if (!chat) return res.status(404).json({ error: 'Session not found' });
    res.json(chat);
  } catch (err) {
    console.error('Session fetch error:', err.message);
    res.status(500).json({ error: 'Error fetching session' });
  }
});

// ── DELETE /api/history/:id ────────────────────────────────
app.delete('/api/history/:id', historyLimiter, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid session ID.' });
  }
  let user;
  try { user = await getUser(req); } catch (err) {
    return res.status(401).json({ error: err.message });
  }
  try {
    const result = await Chat.findOneAndDelete({ _id: req.params.id, user: user._id });
    if (!result) return res.status(404).json({ error: 'Session not found' });
    res.json({ message: 'Session deleted' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Error deleting session' });
  }
});

// ── Start Server ───────────────────────────────────────────
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`✅ API running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

