// widget.js
document.addEventListener("DOMContentLoaded", () => {
  // Container
  const widget = document.createElement("div");
  widget.id = "wilya-chatbox";
  document.body.insertBefore(widget, document.body.firstChild);

  // Header
  const header = document.createElement("div");
  header.className = "w-header";
  header.textContent = "Wilya • Workforce Assistant";
  widget.appendChild(header);

  // Chat area
  const chat = document.createElement("div");
  chat.className = "w-chat";
  widget.appendChild(chat);

  // Input area
  const inputWrap = document.createElement("div");
  inputWrap.className = "w-input";
  widget.appendChild(inputWrap);

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Ask about skills-based scheduling, OT, coverage…";
  inputWrap.appendChild(input);

  const send = document.createElement("button");
  send.className = "w-send";
  send.textContent = "Send";
  inputWrap.appendChild(send);

  // Helper
  function addMessage(text, sender = "system") {
    const msg = document.createElement("div");
    msg.className = `bubble ${sender}`;
    msg.textContent = text;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
  }

  // Greeting
  addMessage("👋 Welcome to Wilya. This is a demo chat—reply with anything to see a branded response.");

  // Handlers
  function handleSend() {
    const val = input.value.trim();
    if (!val) return;
    addMessage(val, "user");
    input.value = "";
    setTimeout(() => {
      addMessage("Hello from Wilya — your message was received. (This is a placeholder reply.)");
    }, 400);
  }

  send.addEventListener("click", handleSend);
  input.addEventListener("keypress", (e) => { if (e.key === "Enter") handleSend(); });
});
