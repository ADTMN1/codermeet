const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const INVALID_CREDENTIALS = "Invalid credentials";

// Register a new user
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

    if (!password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "Password and confirm password are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    // Check uniqueness
    const [emailExists, usernameExists] = await Promise.all([
      User.findOne({ email: email.toLowerCase() }).lean(),
      User.findOne({ username: username.toLowerCase() }).lean(),
    ]);
    if (emailExists || usernameExists) {
      return res.status(400).json({ success: false, message: "User with provided credentials already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
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

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        plan: user.plan,
        isProfessional: user.isProfessional,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ success: false, message: INVALID_CREDENTIALS });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    const userResponse = {
      id: user._id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      bio: user.bio,
      location: user.location,
      website: user.website,
      github: user.github,
      linkedin: user.linkedin,
      skills: user.skills,
      plan: user.plan,
      isProfessional: user.isProfessional,
      role: user.role, // Add role field
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: userResponse,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Logout user (stateless JWT)
exports.logout = async (req, res) => {
  res.status(200).json({ success: true, message: "Logged out successfully" });
};
