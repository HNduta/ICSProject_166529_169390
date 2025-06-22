// server.cjs
const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3',
      prompt: userMessage,
      stream: false
    });

    res.json({ reply: response.data.response.trim() });
  } catch (error) {
    console.error('Ollama Error:', error.message);
    res.status(500).json({ reply: "⚠️ Sorry, something went wrong talking to the model." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

