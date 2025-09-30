const socket = io();

// Ask player for name
let playerName = prompt("Enter your name:", "Player") || "Player";
const playerColor = "#" + Math.floor(Math.random()*16777215).toString(16);

const chatContainer = document.getElementById("chatContainer");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("send");
const languageSelect = document.getElementById("languageSelect");
const imageInput = document.getElementById("imageInput");

// Translate function using LibreTranslate API
async function translate(msg, lang) {
  if(lang === "none") return msg;

  try {
    const res = await fetch("https://libretranslate.com/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: msg,
        source: "en",
        target: lang
      })
    });
    const data = await res.json();
    return data.translatedText;
  } catch(err) {
    console.error("Translation failed:", err);
    return msg; // fallback to original
  }
}

// Add message to chat container
function addMessage(name, msg, self=false, color=null, image=null) {
  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  bubble.classList.add(self ? "self" : "other");
  bubble.style.background = color || (self ? "#0b93f6" : "#fff");
  if(image) {
    bubble.innerHTML = `<strong>${name}:</strong><br><img src="${image}" style="max-width:200px;border-radius:10px">`;
  } else {
    bubble.innerHTML = `<strong>${name}:</strong> ${msg}`;
  }
  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Send chat
sendBtn.addEventListener("click", async () => {
  const messageText = messageInput.value.trim();
  if(!messageText && !imageInput.files[0]) return;

  // Handle image sending
  if(imageInput.files[0]) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit("chat", { name: playerName, image: reader.result, color: playerColor });
      addMessage(playerName, "", true, playerColor, reader.result);
      imageInput.value = "";
    };
    reader.readAsDataURL(imageInput.files[0]);
  }

  if(messageText) {
    const translatedMsg = await translate(messageText, languageSelect.value);
    socket.emit("chat", { name: playerName, message: translatedMsg, color: playerColor });
    addMessage(playerName, translatedMsg, true, playerColor);
    messageInput.value = "";
  }
});

messageInput.addEventListener("keypress", e => {
  if(e.key === "Enter") sendBtn.click();
});

// Receive chat
socket.on("chat", data => {
  if(data.name === playerName) return;
  addMessage(data.name, data.message || "", false, data.color, data.image);
});

// Phaser setup
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 400,
  parent: null,
  backgroundColor: "#e5e5ea",
  scene: { preload, create, update }
};

let player;
let cursors;
let otherPlayers = {};
let game;

function preload() {
  this.load.image("player", "https://labs.phaser.io/assets/sprites/phaser-dude.png");
}

function create() {
  player = this.add.sprite(400, 200, "player");
  cursors = this.input.keyboard.createCursorKeys();
  game = this;

  // Prevent Phaser from stealing spacebar when typing
  messageInput.addEventListener("focus", () => { game.input.keyboard.enabled = false; });
  messageInput.addEventListener("blur", () => { game.input.keyboard.enabled = true; });

  socket.on("move", data => {
    if(data.id === socket.id) return;
    if(!otherPlayers[data.id]) {
      otherPlayers[data.id] = this.add.sprite(data.x, data.y, "player");
    } else {
      otherPlayers[data.id].x = data.x;
      otherPlayers[data.id].y = data.y;
    }
  });
}

function update() {
  let moved = false;
  if(cursors.left.isDown) { player.x -= 2; moved = true; }
  if(cursors.right.isDown) { player.x += 2; moved = true; }
  if(cursors.up.isDown) { player.y -= 2; moved = true; }
  if(cursors.down.isDown) { player.y += 2; moved = true; }

  if(moved) socket.emit("move", { x: player.x, y: player.y });
}

new Phaser.Game(config);
