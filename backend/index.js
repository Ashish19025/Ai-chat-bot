const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// 🔌 Connect MongoDB
const connectDB = require('./db/connect');
connectDB();

// 🧠 Models
const Chat = require('./models/Chat');
const User = require('./models/User');

// 🚀 Initialize Express
const app = express();
app.use(cors());
app.use(express.json()); // ✅ Required to access req.body

// 💬 POST /api/chat - Chat with LLM
app.post('/api/chat', async (req, res) => {
  const { message, email } = req.body;

  if (!message || !email) {
    return res.status(400).json({ error: "Message and email are required." });
  }

  try {
    // 🧾 Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, name: email.split('@')[0] });
    }

    // 🔁 Send message to Mistral via Ollama
    const response = await axios.post(
      'http://localhost:11434/api/chat',
      {
        model: 'mistral',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: message },
        ]
      },
      { responseType: 'stream' }
    );

    // 🧵 Handle streaming response
    let reply = '';
    response.data.on('data', async (chunk) => {
      const lines = chunk.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        const data = JSON.parse(line);
        if (data.done) {
          // 💾 Save chat to DB
          await Chat.create({
            user: user._id,
            messages: [
              { role: 'user', content: message },
              { role: 'assistant', content: reply }
            ]
          });

          return res.json({ reply });
        }
        reply += data.message?.content || '';
      }
    });

  } catch (err) {
    console.error('❌ Chat error:', err.message);
    return res.status(500).json({ error: 'Failed to connect to Ollama or DB.' });
  }
});

// 📚 GET /api/history/:email - Get user's chat history
app.get('/api/history/:email', async (req, res) => {
  const { email } = req.params;

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

// 🟢 Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ API running at http://localhost:${PORT}`);
});