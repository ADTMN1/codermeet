// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// constant for unified invalid credentials message
const INVALID_CREDENTIALS = "Invalid credentials";

exports.register = async (req, res) => {
  try {
    const {
      fullName,
      username,
      email,
      password,
      confirmPassword,
      primaryLanguage,
      skills,
      githubUrl,
      bio,
      plan,
    } = req.body;

    // Required fields already validated by express-validator, but double-check
    if (!password || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "Password and confirm password are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check uniqueness: email and username
    const [emailExists, usernameExists] = await Promise.all([
      User.findOne({ email }).lean(),
      User.findOne({ username: username.toLowerCase() }).lean(),
    ]);

    if (emailExists || usernameExists) {
      // Avoid revealing which one matched
      return res
        .status(400)
        .json({ message: "User with provided credentials already exists" });
    }

    // Password policy (extra)
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const hashedPassword = await bcrypt.hash(password, 12); // 12 rounds

    const isProfessional = plan !== "Trial";

    const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      primaryLanguage,
      skills,
      githubUrl,
      bio,
      plan,
      isProfessional,
    });

    // respond with minimal info, do not include token here automatically (optional)
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        plan: user.plan,
        isProfessional: user.isProfessional,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // always return same message to avoid enumeration
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        plan: user.plan,
        isProfessional: user.isProfessional,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.logout = async (req, res) => {
  // For stateless JWT, client deletes token. If using refresh tokens, revoke them here.
  res.json({ message: "Logged out" });
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
