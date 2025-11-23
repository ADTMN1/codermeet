// config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    // Avoid printing the full URI to logs
    console.log("✅ MongoDB connected successfully!");
    console.log(` Host: ${mongoose.connection.host}`);
    console.log(` Database: ${mongoose.connection.name}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err.message);
});

module.exports = connectDB;
