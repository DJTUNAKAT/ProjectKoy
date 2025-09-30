const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Route to dynamically get all sounds
app.get("/sounds/list", (req, res) => {
  const soundsDir = path.join(__dirname, "public/sounds");
  fs.readdir(soundsDir, (err, files) => {
    if(err) return res.status(500).send([]);
    const soundFiles = files.filter(f => f.endsWith(".mp3") || f.endsWith(".wav"));
    res.json(soundFiles);
  });
});

// Socket.io handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Chat message
  socket.on("chat", (data) => {
    io.emit("chat", data); // send to all including sender
  });

  // Player movement
  socket.on("move", (data) => {
    data.id = socket.id;
    socket.broadcast.emit("move", data); // send to others
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
