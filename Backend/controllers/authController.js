const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const INVALID_CREDENTIALS = "Invalid credentials";

// Validate JWT secret
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Check user availability (email or username)
exports.checkUserAvailability = async (req, res) => {
  try {
    const { field, value } = req.query;

    if (!field || !value) {
      return res.status(400).json({ 
        success: false, 
        message: "Field and value are required" 
      });
    }

    if (!['email', 'username'].includes(field)) {
      return res.status(400).json({ 
        success: false, 
        message: "Field must be either 'email' or 'username'" 
      });
    }

    // Sanitize and validate input
    const sanitizedValue = value.toString().trim().substring(0, 100);
    
    const query = field === 'email' 
      ? { email: sanitizedValue.toLowerCase() }
      : { username: sanitizedValue.toLowerCase() };

    const existingUser = await User.findOne(query).lean();

    res.status(200).json({
      success: true,
      available: !existingUser,
      message: existingUser 
        ? `${field} is already taken` 
        : `${field} is available`
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error checking user availability:', err.message);
    }
    res.status(500).json({ 
      success: false, 
      message: "Server error while checking availability" 
    });
  }
};


// Check GitHub URL availability
exports.checkGithubAvailability = async (req, res) => {
  try {
    const { githubUrl } = req.query;

    if (!githubUrl) {
      return res.status(400).json({ 
        success: false, 
        message: "GitHub URL is required" 
      });
    }

    // Validate and sanitize GitHub URL
    const sanitizedUrl = githubUrl.toString().trim().substring(0, 200);
    
    // Basic GitHub URL validation
    if (!sanitizedUrl.includes('github.com')) {
      return res.status(400).json({
        success: false,
        message: "Invalid GitHub URL format"
      });
    }

    // Normalize GitHub URL (remove http/https and www)
    const normalizedUrl = sanitizedUrl.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '');

    const existingUser = await User.findOne({ 
      github: { $regex: normalizedUrl, $options: 'i' }
    }).lean();

    res.status(200).json({
      success: true,
      available: !existingUser,
      message: existingUser 
        ? "This GitHub URL is already associated with another account" 
        : "GitHub URL is available"
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error checking GitHub availability:', err.message);
    }
    res.status(500).json({ 
      success: false, 
      message: "Server error while checking GitHub availability" 
    });
  }
};

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

    // Input validation and sanitization
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Valid full name is required (min 2 characters)" });
    }
    
    if (!username || typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({ success: false, message: "Valid username is required (3-20 characters, alphanumeric and underscore only)" });
    }
    
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }
    
    if (!password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "Password and confirm password are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    // Validate plan field
    if (!plan || typeof plan !== 'string') {
      return res.status(400).json({ success: false, message: "Plan is required" });
    }
    
    const validPlans = ["Trial", "Basic", "Premium"];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ success: false, message: `Invalid plan. Must be one of: ${validPlans.join(', ')}` });
    }

    // Validate primaryLanguage
    if (primaryLanguage && typeof primaryLanguage !== 'string') {
      return res.status(400).json({ success: false, message: "Primary language must be a string" });
    }

    // Validate skills if provided
    if (skills && !Array.isArray(skills)) {
      return res.status(400).json({ success: false, message: "Skills must be an array" });
    }

    // Validate githubUrl if provided
    if (githubUrl && typeof githubUrl !== 'string') {
      return res.status(400).json({ success: false, message: "GitHub URL must be a string" });
    }

    // Sanitize inputs
    const sanitizedFullName = fullName.trim().substring(0, 50);
    const sanitizedUsername = username.trim().substring(0, 20);
    const sanitizedEmail = email.trim().toLowerCase().substring(0, 100);
    const sanitizedBio = bio ? bio.trim().substring(0, 500) : '';
    const sanitizedGithubUrl = githubUrl ? githubUrl.trim().substring(0, 200) : '';

    // Check uniqueness
    const [emailExists, usernameExists] = await Promise.all([
      User.findOne({ email: sanitizedEmail }).lean(),
      User.findOne({ username: sanitizedUsername }).lean(),
    ]);
    if (emailExists || usernameExists) {
      return res.status(400).json({ success: false, message: "User with provided credentials already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const isProfessional = plan !== "Trial";
    
    const user = await User.create({
      fullName: sanitizedFullName,
      username: sanitizedUsername,
      email: sanitizedEmail,
      password: hashedPassword,
      primaryLanguage,
      skills,
      githubUrl: sanitizedGithubUrl,
      bio: sanitizedBio,
      plan,
      isProfessional,
      role: 'trial', // All users start as trial
    });

    // Generate JWT token for automatic login after registration
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

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
      role: user.role,
    };

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token, // Include token for automatic login
      user: userResponse, // Include full user data
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Registration error:', err.message);
    }
    res.status(500).json({ 
      success: false, 
      message: "Server error during registration",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }
    
    if (!password || typeof password !== 'string' || password.length < 1) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ success: false, message: INVALID_CREDENTIALS });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

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
    if (process.env.NODE_ENV === 'development') {
      console.error('Login error:', err.message);
    }
    res.status(500).json({ 
      success: false, 
      message: "Server error during login",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Logout user (stateless JWT)
exports.logout = async (req, res) => {
  res.status(200).json({ success: true, message: "Logged out successfully" });
};
