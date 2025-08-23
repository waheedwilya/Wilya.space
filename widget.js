// widget.js

document.addEventListener("DOMContentLoaded", () => {
  // Create container
  const widget = document.createElement("div");
  widget.id = "wilya-chatbox";
  widget.style.position = "relative"; // sits in normal flow
  widget.style.margin = "20px auto";  // center horizontally
  widget.style.width = "600px";
  widget.style.height = "350px";
  widget.style.border = "1px solid #ccc";
  widget.style.borderRadius = "12px";
  widget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
  widget.style.backgroundColor = "#fff";
  widget.style.display = "flex";
  widget.style.flexDirection = "column";
  widget.style.fontFamily = "Arial, sans-serif";
  document.body.insertBefore(widget, document.body.firstChild); // place at top

  // Title bar
  const header = document.createElement("div");
  header.innerText = "💬 Wilya Chat";
  header.style.backgroundColor = "#007bff";
  header.style.color = "#fff";
  header.style.padding = "12px";
  header.style.borderTopLeftRadius = "12px";
  header.style.borderTopRightRadius = "12px";
  header.style.fontWeight = "bold";
  header.style.textAlign = "center";
  widget.appendChild(header);

  // Chat window
  const chatWindow = document.createElement("div");
  chatWindow.style.flex = "1";
  chatWindow.style.padding = "10px";
  chatWindow.style.overflowY = "auto";
  widget.appendChild(chatWindow);

  // Input area
  const inputArea = document.createElement("div");
  inputArea.style.display = "flex";
  inputArea.style.borderTop = "1px solid #eee";
  widget.appendChild(inputArea);

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Type a message…";
  input.style.flex = "1";
  input.style.border = "none";
  input.style.padding = "10px";
  input.style.outline = "none";
  inputArea.appendChild(input);

  const sendBtn = document.createElement("button");
  sendBtn.innerText = "Send";
  sendBtn.style.border = "none";
  sendBtn.style.padding = "10px 16px";
  sendBtn.style.backgroundColor = "#007bff";
  sendBtn.style.color = "#fff";
  sendBtn.style.cursor = "pointer";
  sendBtn.style.borderRadius = "0 0 12px 0";
  inputArea.appendChild(sendBtn);

  // Helper: add a message bubble
  function addMessage(text, sender = "system") {
    const msg = document.createElement("div");
    msg.innerText = text;
    msg.style.margin = "6px 0";
    msg.style.padding = "8px 12px";
    msg.style.borderRadius = "12px";
    msg.style.maxWidth = "80%";
    msg.style.wordWrap = "break-word";
    if (sender === "user") {
      msg.style.alignSelf = "flex-end";
      msg.style.backgroundColor = "#007bff";
      msg.style.color = "#fff";
    } else {
      msg.style.alignSelf = "flex-start";
      msg.style.backgroundColor = "#f1f1f1";
    }
    chatWindow.appendChild(msg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // Greet the user
  addMessage("👋 Hello! Welcome to Wilya chatbox.");

  // Send handler
  sendBtn.addEventListener("click", () => {
    if (input.value.trim() === "") return;
    addMessage(input.value, "user");
    input.value = "";

    // Simple bot reply
    setTimeout(() => {
      addMessage("Hello World! You typed something.");
    }, 500);
  });

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendBtn.click();
  });
});
