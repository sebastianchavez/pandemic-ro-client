const { io } = require("socket.io-client");
const socket = io("http://localhost:3002");

let socketId
  
socket.on("disconnect", () => {
    socketId = socket.id;
});

socket.on("connect", () => {
    socketId = socket.id;
    console.log(socketId); // x8WIv7-mJelg7on_ALbx
});

module.exports = {
    sendDataIsConnected: (device) => {
        socket.emit('isConnected', {...device, socketId})
    }
}