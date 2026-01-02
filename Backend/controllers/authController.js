// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { uploadToCloudinary } = require("../utils/cloudinary"); // adjust path


// Check if user exists by email or username
exports.checkUser = async (req, res) => {
  try {
    const { field, value } = req.query;
    
    if (!field || !value) {
      return res.status(400).json({ message: 'Field and value are required' });
    }

    if (field !== 'email' && field !== 'username') {
      return res.status(400).json({ message: 'Invalid field. Must be "email" or "username"' });
    }

    const query = { [field]: field === 'email' ? value.toLowerCase() : value };
    const user = await User.findOne(query).select('_id').lean();
    
    res.status(200).json({ exists: !!user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

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
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Return the user data in the expected format
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
    };

    res.json({
      success: true,
      message: "Login successful",
      token,
      data: userResponse
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

exports.logout = async (req, res) => {
  // For stateless JWT, client deletes token. If using refresh tokens, revoke them here.
  res.json({ message: "Logged out" });
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ 
      success: true,
      data: user,
      message: 'User profile retrieved successfully' 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};


exports.updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload file to Cloudinary in user's folder
    const cloudinaryUrl = await uploadToCloudinary(req.file.path, userId);

    // Update user in DB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: cloudinaryUrl },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      avatar: cloudinaryUrl,
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// controllers/authController.js - updateProfile function
exports.updateProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Get all possible fields from request body
    const {
      name,
      email,
      bio,
      location,
      website,
      github,
      linkedin,
      skills
    } = req.body || {};

    // Create update object with only provided fields
    const updateData = {};
    
    if (name) updateData.fullName = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.user.id }
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      updateData.email = email.toLowerCase();
    }
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (github !== undefined) updateData.github = github;
    if (linkedin !== undefined) updateData.linkedin = linkedin;
    if (skills !== undefined) {
      // If skills is a string, split it into an array
      updateData.skills = typeof skills === 'string' ? skills.split(',').map(skill => skill.trim()) : skills;
    }

    // Handle file upload if a file was provided
    if (req.file) {
      // Construct the URL to the uploaded file
      const fileUrl = `/uploads/${req.file.filename}`;
      updateData.avatar = fileUrl;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error during profile update',
      error: error.message 
    });
  }
};
