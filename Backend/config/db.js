// config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

mongoose.connection.on("error", (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on("connected", () => {
  console.log('MongoDB connected successfully');
});

module.exports = connectDB;
