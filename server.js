const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

io.on("connection", socket => {
  console.log("User connected:", socket.id);

  socket.on("chat", data => {
    socket.broadcast.emit("chat", data);
  });

  socket.on("move", data => {
    socket.broadcast.emit("move", { ...data, id: socket.id });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
