const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// SIGNUP - only email & password
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  console.log("📨 Signup attempt:", email);

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword
    });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);
    return res.status(201).json({ token });
  } catch (err) {
    console.error("❌ Signup error:", err.message);
    return res.status(500).json({ error: "Signup failed" });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("🔑 Login attempt:", email);

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);
    return res.json({ token });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    return res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
