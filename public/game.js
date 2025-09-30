const socket = io();

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: { preload, create, update }
};

let player;
let cursors;
let otherPlayers = {};

function preload() {
  this.load.image("player", "https://labs.phaser.io/assets/sprites/phaser-dude.png");
}

function create() {
  player = this.add.sprite(400, 300, "player");
  cursors = this.input.keyboard.createCursorKeys();

  // Listen for other players moving
  socket.on("move", (data) => {
    if (data.id === socket.id) return;
    if (!otherPlayers[data.id]) {
      otherPlayers[data.id] = this.add.sprite(data.x, data.y, "player");
    } else {
      otherPlayers[data.id].x = data.x;
      otherPlayers[data.id].y = data.y;
    }
  });

  // Listen for chat messages
  const chatDiv = document.getElementById("chat");
  socket.on("chat", (data) => {
    const msg = document.createElement("div");
    msg.textContent = `${data.id.substring(0,4)}: ${data.message}`;
    chatDiv.appendChild(msg);
    chatDiv.scrollTop = chatDiv.scrollHeight;
  });

  // Send chat
  document.getElementById("send").addEventListener("click", () => {
    const input = document.getElementById("message");
    if (input.value.trim() === "") return;
    socket.emit("chat", input.value);
    input.value = "";
  });

  document.getElementById("message").addEventListener("keypress", (e) => {
    if (e.key === "Enter") document.getElementById("send").click();
  });
}

function update() {
  let moved = false;
  if (cursors.left.isDown) { player.x -= 2; moved = true; }
  if (cursors.right.isDown) { player.x += 2; moved = true; }
  if (cursors.up.isDown) { player.y -= 2; moved = true; }
  if (cursors.down.isDown) { player.y += 2; moved = true; }

  if (moved) socket.emit("move", { x: player.x, y: player.y });
}

new Phaser.Game(config);
