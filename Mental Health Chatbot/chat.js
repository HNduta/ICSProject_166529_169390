document.getElementById("send-btn").addEventListener("click", sendMessage);

async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  displayUserMessage(message);
  input.value = "";

  // Show a placeholder "Typing..."
  displayBotMessage("Tuliabot is typing...");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    updateLastBotMessage(data.reply);
  } catch (err) {
    updateLastBotMessage("Oops! Something went wrong. Try again.");
  }
}

function displayUserMessage(msg) {
  const chat = document.querySelector("main");
  const bubble = document.createElement("div");
  bubble.className = "self-end bg-blue-600 text-white p-3 rounded-xl shadow max-w-[75%]";
  bubble.textContent = msg;
  chat.appendChild(bubble);
  chat.scrollTop = chat.scrollHeight;
}

function displayBotMessage(msg) {
  const chat = document.querySelector("main");
  const bubble = document.createElement("div");
  bubble.className = "bg-white text-gray-800 p-3 rounded-xl shadow w-fit max-w-[75%]";
  bubble.textContent = msg;
  chat.appendChild(bubble);
  chat.scrollTop = chat.scrollHeight;
}

function updateLastBotMessage(newText) {
  const chat = document.querySelector("main");
  const last = chat.querySelector("div:last-child");
  if (last && last.className.includes("text-gray-800")) {
    last.textContent = newText;
  }
}
