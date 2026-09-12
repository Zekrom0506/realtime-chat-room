const mongoose = require("mongoose");

// connect to MongoDB using the URL from the .env file
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
