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
    github: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    website: { type: String, trim: true },
    location: { type: String, trim: true },
    bio: { type: String, trim: true },
avatar: { type: String },           // Cloudinary secure_url
avatarPublicId: { type: String },   // Cloudinary public_id (for delete)

    plan: {
      type: String,
      enum: ["Trial", "Basic", "Premium"],
      default: "Trial",
    },
    isProfessional: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { 
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        // Remove sensitive information when converting to JSON
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model("User", userSchema);
