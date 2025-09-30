const socket = io();

// Ask for name
let playerName = prompt("Enter your name:", "Player") || "Player";
const playerColor = "#" + Math.floor(Math.random()*16777215).toString(16);

const chatContainer = document.getElementById("chatContainer");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("send");
const languageSelect = document.getElementById("languageSelect");
const imageInput = document.getElementById("imageInput");

// TRANSLATOR FIX
async function translate(msg, lang) {
  if(lang === "none") return msg;
  try {
    const res = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: msg, source: "en", target: lang, format: "text" })
    });
    const data = await res.json();
    return data.translatedText || msg;
  } catch(e) {
    console.error("Translation error:", e);
    return msg;
  }
}

// ADD MESSAGE
function addMessage(name, msg, self=false, color=null, image=null) {
  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  bubble.classList.add(self ? "self" : "other");
  bubble.style.background = color || (self ? "#0b93f6" : "#2c2c2e");
  bubble.style.color = "#fff";

  if(image) {
    bubble.innerHTML = `<strong>${name}:</strong><br><img src="${image}" style="max-width:200px;border-radius:10px">`;
  } else {
    bubble.innerHTML = `<strong>${name}:</strong> ${msg}`;
  }

  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// SEND CHAT
sendBtn.addEventListener("click", async () => {
  const msg = messageInput.value.trim();
  if(!msg && !imageInput.files[0]) return;

  if(imageInput.files[0]) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit("chat", { name: playerName, image: reader.result, color: playerColor });
      addMessage(playerName, "", true, playerColor, reader.result);
      imageInput.value = "";
    };
    reader.readAsDataURL(imageInput.files[0]);
  }

  if(msg) {
    const translated = await translate(msg, languageSelect.value);
    socket.emit("chat", { name: playerName, message: translated, color: playerColor });
    addMessage(playerName, translated, true, playerColor);
    messageInput.value = "";
  }
});

// SPACEBAR FIX
messageInput.addEventListener("keypress", e => {
  if(e.key === "Enter") sendBtn.click();
});

// RECEIVE CHAT
socket.on("chat", data => {
  if(data.name === playerName) return;
  addMessage(data.name, data.message || "", false, data.color, data.image || null);
});

// PHASER FULLSCREEN
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight - document.getElementById("controls").offsetHeight - document.getElementById("chatContainer").offsetHeight,
  backgroundColor: "#1c1c1e",
  parent: null,
  scene: { preload, create, update }
};

let player, cursors, otherPlayers = {}, game;

function preload() {
  this.load.image("player", "https://labs.phaser.io/assets/sprites/phaser-dude.png");
}

function create() {
  player = this.add.sprite(400, 200, "player");
  cursors = this.input.keyboard.createCursorKeys();
  game = this;

  messageInput.addEventListener("focus", () => { game.input.keyboard.enabled = false; });
  messageInput.addEventListener("blur", () => { game.input.keyboard.enabled = true; });

  socket.on("move", data => {
    if(data.id === socket.id) return;
    if(!otherPlayers[data.id]) otherPlayers[data.id] = this.add.sprite(data.x, data.y, "player");
    else { otherPlayers[data.id].x = data.x; otherPlayers[data.id].y = data.y; }
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

// RESIZE PHASER ON WINDOW RESIZE
window.addEventListener("resize", () => {
  game.scale.resize(window.innerWidth, window.innerHeight - document.getElementById("controls").offsetHeight - document.getElementById("chatContainer").offsetHeight);
});
