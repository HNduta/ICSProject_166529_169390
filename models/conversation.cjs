const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: String, // 'user' or 'bot'
  text: String,
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  userId: String,
  messages: [messageSchema]
});

module.exports = mongoose.model('Conversation', conversationSchema);
