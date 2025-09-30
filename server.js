const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Broadcast player movements
  socket.on("move", (data) => {
    io.emit("move", { id: socket.id, x: data.x, y: data.y });
  });

  // Broadcast chat messages
  socket.on("chat", (msg) => {
    io.emit("chat", { id: socket.id, message: msg });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

http.listen(3000, () => console.log("Server running on port 3000"));
