// config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  } catch (err) {
    process.exit(1);
  }
};

mongoose.connection.on("error", (err) => {
  // MongoDB connection error
});

mongoose.connection.on("connected", () => {
  // MongoDB connected successfully
});

module.exports = connectDB;
