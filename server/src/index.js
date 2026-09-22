require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/rooms");
const { connectRedis } = require("./redis");
const { setupWebSocket, handleRedisEvent } = require("./websocket");

const app = express();
const PORT = process.env.PORT || 5000;
const SERVER_NAME = process.env.SERVER_NAME || "server-local";

// middleware
app.use(cors());
app.use(express.json());

// simple route to check that the server is running
// it also shows which server copy answered the request
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", server: SERVER_NAME });
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

// we create the HTTP server ourselves so that Express and
// the WebSocket server can share the same port
const server = http.createServer(app);
setupWebSocket(server);

// connect to the database and Redis first, then start the server
async function start() {
  await connectDB();
  await connectRedis(handleRedisEvent);

  server.listen(PORT, () => {
    console.log(SERVER_NAME + " running on port " + PORT);
  });
}

start();
