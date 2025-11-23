// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    primaryLanguage: { type: String, trim: true },
    skills: { type: [String], default: [] },
    githubUrl: { type: String, trim: true },
    bio: { type: String, trim: true },
    plan: {
      type: String,
      enum: ["Trial", "Basic", "Premium"],
      default: "Trial",
    },
    isProfessional: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
