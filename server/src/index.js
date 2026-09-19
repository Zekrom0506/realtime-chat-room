require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/rooms");
const { setupWebSocket } = require("./websocket");

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// simple route to check that the server is running
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

// we create the HTTP server ourselves so that Express and
// the WebSocket server can share the same port
const server = http.createServer(app);
setupWebSocket(server);

// connect to the database first, then start the server
async function start() {
  await connectDB();

  server.listen(PORT, () => {
    console.log("Server running on port " + PORT);
  });
}

start();
