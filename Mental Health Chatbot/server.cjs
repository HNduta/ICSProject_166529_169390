const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/chatbotDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Load Conversation model
const Conversation = require('./models/Conversation');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Handle chat messages and save them
app.post('/api/chat', async (req, res) => {
  const { message, userId = "default-user" } = req.body;

  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3',
      prompt: message,
      stream: false,
    });

    const botReply = response.data.response.trim();

    // Save both user and bot messages in DB
    let convo = await Conversation.findOne({ userId });
    if (!convo) convo = new Conversation({ userId, messages: [] });

    convo.messages.push({ sender: 'user', text: message });
    convo.messages.push({ sender: 'bot', text: botReply });
    await convo.save();

    res.json({ reply: botReply });
  } catch (error) {
    console.error('Ollama Error:', error.message);
    res.status(500).json({ reply: "⚠️ Sorry, something went wrong talking to the model." });
  }
});

// Fetch full chat history
app.get('/api/chat/history/:userId', async (req, res) => {
  const convo = await Conversation.findOne({ userId: req.params.userId });
  res.json(convo?.messages || []);
});

// Edit a specific message
app.put('/api/chat/message/:id', async (req, res) => {
  const { newText } = req.body;
  const { id } = req.params;

  try {
    await Conversation.updateOne(
      { "messages._id": id },
      { $set: { "messages.$.text": newText } }
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('Edit error:', err.message);
    res.status(500).send("Error editing message");
  }
});

// Delete a specific message
app.delete('/api/chat/message/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await Conversation.updateOne(
      {},
      { $pull: { messages: { _id: id } } }
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).send("Error deleting message");
  }
});

// Serve chat.html by default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
