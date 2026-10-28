
const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing from .env");
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB error name:", error.name);
    console.error("MongoDB error message:", error.message);
    console.error(
      "MongoDB error reason:",
      error.reason?.message || "No additional reason provided"
    );

    throw error;
  }
}

module.exports = connectDB;
