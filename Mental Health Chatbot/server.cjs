const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');
const bcrypt = require('bcrypt');
const User = require('./models/user.cjs');
const Conversation = require('./models/conversation.cjs');

const app = express();
const PORT = 3000;

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/chatbotDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✳️ User Signup Route
app.post('/api/signup', async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: 'User already exists' });

    const user = new User({ fullName, email, password });
    await user.save();

    res.status(201).json({ message: 'Signup successful' });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
});



// ✳️ User Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

    res.json({ message: 'Login successful', userId: user._id });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Login error', error: err.message });
  }
});

// 💬 Chat message route
app.post('/api/chat', async (req, res) => {
  const { message, userId = "default-user" } = req.body;

  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3',
      prompt: message,
      stream: false,
    });

    const botReply = response.data.response.trim();

    let convo = await Conversation.findOne({ userId });
    if (!convo) convo = new Conversation({ userId, messages: [] });

    convo.messages.push({ sender: 'user', text: message });
    convo.messages.push({ sender: 'bot', text: botReply });
    await convo.save();

    res.json({ reply: botReply });
  } catch (err) {
    res.status(500).json({ reply: "⚠️ Something went wrong talking to the model." });
  }
});

// 🗃 Get chat history
app.get('/api/chat/history/:userId', async (req, res) => {
  const convo = await Conversation.findOne({ userId: req.params.userId });
  res.json(convo?.messages || []);
});

// 📝 Edit message
app.put('/api/chat/message/:id', async (req, res) => {
  const { newText } = req.body;
  try {
    await Conversation.updateOne({ "messages._id": req.params.id }, {
      $set: { "messages.$.text": newText }
    });
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ message: "Edit failed" });
  }
});

// ❌ Delete message
app.delete('/api/chat/message/:id', async (req, res) => {
  try {
    await Conversation.updateOne({}, { $pull: { messages: { _id: req.params.id } } });
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
