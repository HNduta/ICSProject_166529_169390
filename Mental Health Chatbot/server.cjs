const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json()); // for parsing JSON
app.use(express.static(path.join(__dirname, 'public'))); // serve static files

// POST route to handle chat messages
app.post('/api/chat', (req, res) => {
  const userMessage = req.body.message;

  // Basic chatbot logic (can be replaced with OpenAI, Rasa, etc.)
  let reply = "I'm here to listen. Can you tell me more?";

  if (userMessage.toLowerCase().includes("anxious")) {
    reply = "I'm sorry you're feeling anxious. Would you like a breathing exercise?";
  } else if (userMessage.toLowerCase().includes("happy")) {
    reply = "That's great to hear! 😊 What made your day better?";
  } else if (userMessage.toLowerCase().includes("help")) {
    reply = "If you're in distress, please reach out to Befrienders Kenya at 0722 178 177.";
  }

  res.json({ reply });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
