const express = require("express");
const path = require("path");

const app = express();
const port = 3000;

// Serve static files from "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Optional: Set a default route (redirect to index.html or login.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API endpoint
app.use(express.json());

app.post("/api/chat", (req, res) => {
  const userMessage = req.body.message;
  // You can replace this with your AI logic later
  res.json({ reply: `Tuliabot received: ${userMessage}` });
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
