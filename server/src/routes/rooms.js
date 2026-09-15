const express = require("express");
const Room = require("../models/Room");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// all room routes need a logged in user
router.use(requireAuth);

// GET /api/rooms - list all rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: 1 });
    res.json(rooms);
  } catch (error) {
    console.log("Get rooms error:", error.message);
    res.status(500).json({ message: "Could not load rooms" });
  }
});

// POST /api/rooms - create a new room
router.post("/", async (req, res) => {
  try {
    const name = req.body.name;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Room name is required" });
    }

    const existingRoom = await Room.findOne({ name: name.trim() });
    if (existingRoom) {
      return res.status(400).json({ message: "A room with this name already exists" });
    }

    const room = await Room.create({
      name: name.trim(),
      createdBy: req.user.username,
    });

    res.status(201).json(room);
  } catch (error) {
    console.log("Create room error:", error.message);
    res.status(500).json({ message: "Could not create room" });
  }
});

module.exports = router;
