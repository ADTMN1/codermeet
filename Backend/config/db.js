// config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (err) {
    process.exit(1);
  }
};

mongoose.connection.on("error", () => {
  // Silently handle MongoDB connection errors
});

module.exports = connectDB;
