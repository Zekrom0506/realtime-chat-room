const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// create a JWT token that the client sends back on every request
function createToken(user) {
  const payload = { id: user._id, username: user.username };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // check if the username is already taken
    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    // hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: username.trim(),
      password: hashedPassword,
    });

    const token = createToken(user);
    res.status(201).json({ token: token, username: user.username });
  } catch (error) {
    console.log("Register error:", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // compare the typed password with the saved hash
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const token = createToken(user);
    res.json({ token: token, username: user.username });
  } catch (error) {
    console.log("Login error:", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
