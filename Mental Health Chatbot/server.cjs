const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/chat", (req, res) => {
  const userMessage = req.body.message;
  console.log("User message:", userMessage);

  res.json({
    reply: `You said: "${userMessage}". I'm here for you 💙`,
  });
});

app.listen(3000, () => {
  console.log("✅ Server running at http://localhost:3000");
});
