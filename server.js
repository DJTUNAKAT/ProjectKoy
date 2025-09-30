const socket = io();

// Ask player for their name when they join
let playerName = prompt("Enter your name:", "Player") || "Player";

// Random color for each player’s bubble
const playerColor = "#" + Math.floor(Math.random()*16777215).toString(16);

const chatContainer = document.getElementById("chatContainer");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("send");

// Function to add a chat bubble
function addMessage(name, msg, self=false, color=null) {
  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  bubble.classList.add(self ? "self" : "other");
  bubble.style.background = color || (self ? "#0b93f6" : "#fff");
  bubble.innerHTML = `<strong>${name}:</strong> ${msg}`;
  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Send chat
sendBtn.addEventListener("click", () => {
  if(messageInput.value.trim() === "") return;
  socket.emit("chat", { name: playerName, message: messageInput.value, color: playerColor });
  addMessage(playerName, messageInput.value, true, playerColor);
  messageInput.value = "";
});

messageInput.addEventListener("keypress", e => {
  if(e.key === "Enter") sendBtn.click();
});

// Receive chat from server
socket.on("chat", data => {
  if(data.name === playerName) return; // Already added for self
  addMessage(data.name, data.message, false, data.color);
});

// Phaser minimal setup for character movement
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

function preload() {
  this.load.image("player", "https://labs.phaser.io/assets/sprites/phaser-dude.png");
}

function create() {
  player = this.add.sprite(400, 200, "player");
  cursors = this.input.keyboard.createCursorKeys();

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
