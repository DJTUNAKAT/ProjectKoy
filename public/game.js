const socket = io();

// Ask for name
let playerName = prompt("Enter your name:", "Player") || "Player";
const playerColor = "#" + Math.floor(Math.random()*16777215).toString(16);

const chatContainer = document.getElementById("chatContainer");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("send");
const imageInput = document.getElementById("imageInput");

// Array to store sound file URLs
let notificationSounds = [];

// Fetch all sounds dynamically from server
fetch("/sounds/list")
  .then(res => res.json())
  .then(files => {
    notificationSounds = files.map(f => "sounds/" + f);
    // Preload all sounds by creating Audio objects
    notificationSounds = notificationSounds.map(f => new Audio(f));
  });

// Play random sound function
function playRandomSound() {
  if(notificationSounds.length === 0) return;
  const randIndex = Math.floor(Math.random() * notificationSounds.length);
  notificationSounds[randIndex].play().catch(err => console.log(err));
}

// Add message to chat
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

  // Play sound only for received messages, not your own
  if(!self) playRandomSound();
}

// Send chat
sendBtn.addEventListener("click", () => {
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
    socket.emit("chat", { name: playerName, message: msg, color: playerColor });
    addMessage(playerName, msg, true, playerColor);
    messageInput.value = "";
  }
});

// Spacebar sends
messageInput.addEventListener("keypress", e => {
  if(e.key === "Enter") sendBtn.click();
});

// Receive chat
socket.on("chat", data => {
  if(data.name === playerName) return;
  addMessage(data.name, data.message || "", false, data.color, data.image || null);
});
