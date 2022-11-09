const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 3001

app.get('/', (req, res) => {
    res.send('Hello World!')
})

io.on('connection', (socket) => {
    console.log('a user connected, ', socket.id);
    socket.on("setUserToMain", (arg) => {
        console.log("got setUserToMain, ", socket.id)
        socket.broadcast.emit("changeToMain", arg);
    });
});

server.listen(port, () => {
    console.log('listening on *:3001');
});