const { WebSocketServer } = require("ws");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Room = require("./models/Room");
const Message = require("./models/Message");
const { publishEvent } = require("./redis");

// name of this server copy, used to show which copy handled a message
const SERVER_NAME = process.env.SERVER_NAME || "server-local";

// keeps track of which sockets are in which room ON THIS SERVER COPY
// users connected to the other copy are not in this object
// example: { "roomId1": Set(socketA, socketB), "roomId2": Set(socketC) }
const roomSockets = {};

// send data to every socket in a room that is connected to this server copy
function broadcastToRoom(roomId, data) {
  const sockets = roomSockets[roomId];
  if (!sockets) {
    return;
  }

  const json = JSON.stringify(data);

  sockets.forEach((socket) => {
    // readyState 1 means the connection is open
    if (socket.readyState === 1) {
      socket.send(json);
    }
  });
}

// remove a socket from the room it is currently in
function leaveRoom(socket) {
  const roomId = socket.roomId;
  if (!roomId || !roomSockets[roomId]) {
    return;
  }

  roomSockets[roomId].delete(socket);

  // delete the room entry when nobody is left in it
  if (roomSockets[roomId].size === 0) {
    delete roomSockets[roomId];
  }

  socket.roomId = null;

  publishEvent({
    type: "system",
    roomId: roomId,
    text: socket.username + " left the room",
  }).catch((error) => {
    console.log("Redis publish error:", error.message);
  });
}

// add a socket to a room
async function joinRoom(socket, roomId) {
  // make sure the room really exists in the database
  if (!mongoose.isValidObjectId(roomId)) {
    socket.send(JSON.stringify({ type: "error", message: "Invalid room" }));
    return;
  }

  const room = await Room.findById(roomId);
  if (!room) {
    socket.send(JSON.stringify({ type: "error", message: "Room not found" }));
    return;
  }

  // a user can only be in one room at a time
  leaveRoom(socket);

  if (!roomSockets[roomId]) {
    roomSockets[roomId] = new Set();
  }
  roomSockets[roomId].add(socket);
  socket.roomId = roomId;

  socket.send(JSON.stringify({ type: "joined", roomId: roomId }));

  await publishEvent({
    type: "system",
    roomId: roomId,
    text: socket.username + " joined the room",
  });
}

// save a chat message and publish it to Redis
async function handleChatMessage(socket, text) {
  if (!socket.roomId) {
    socket.send(JSON.stringify({ type: "error", message: "Join a room first" }));
    return;
  }

  if (typeof text !== "string" || text.trim() === "") {
    return;
  }

  // save to MongoDB so it shows up in the history later
  const savedMessage = await Message.create({
    room: socket.roomId,
    username: socket.username,
    text: text.trim().slice(0, 500),
  });

  // we do NOT send the message to the sockets directly here.
  // we publish it to Redis, and every server copy (this one too)
  // receives it in handleRedisEvent and sends it to its own sockets.
  await publishEvent({
    type: "message",
    roomId: socket.roomId,
    _id: savedMessage._id,
    username: savedMessage.username,
    text: savedMessage.text,
    createdAt: savedMessage.createdAt,
    server: SERVER_NAME,
  });
}

// called for every event that arrives from Redis
function handleRedisEvent(event) {
  broadcastToRoom(event.roomId, event);
}

// attach the WebSocket server to our existing HTTP server
function setupWebSocket(server) {
  const wss = new WebSocketServer({ server: server, path: "/ws" });

  wss.on("connection", (socket, req) => {
    // the client sends the JWT token in the URL: /ws?token=...
    const params = new URL(req.url, "http://localhost").searchParams;
    const token = params.get("token");

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.username = decoded.username;
    } catch (error) {
      socket.close(4001, "Invalid token");
      return;
    }

    socket.roomId = null;
    console.log(socket.username + " connected to " + SERVER_NAME);

    // tell the client which server copy it is connected to
    socket.send(JSON.stringify({ type: "connected", server: SERVER_NAME }));

    socket.on("message", async (rawData) => {
      try {
        const data = JSON.parse(rawData.toString());

        if (data.type === "join") {
          await joinRoom(socket, data.roomId);
        } else if (data.type === "message") {
          await handleChatMessage(socket, data.text);
        }
      } catch (error) {
        console.log("WebSocket message error:", error.message);
      }
    });

    socket.on("close", () => {
      leaveRoom(socket);
      console.log(socket.username + " disconnected");
    });
  });
}

module.exports = { setupWebSocket, handleRedisEvent };
