// config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Use MONGO_URI for Atlas connection
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/codermeet');
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB connected successfully");
});

module.exports = connectDB;
