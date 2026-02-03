const User = require("../models/user");
const { uploadToCloudinary } = require("../utils/cloudinary"); // your cloudinary upload helper

// Check if user exists by email or username
exports.checkUser = async (req, res) => {
  try {
    const { field, value } = req.query;

    if (!field || !value) {
      return res.status(400).json({ success: false, message: "Field and value are required" });
    }

    if (!["email", "username"].includes(field)) {
      return res.status(400).json({ success: false, message: 'Invalid field. Must be "email" or "username"' });
    }

    const query = { [field]: field === "email" ? value.toLowerCase() : value };
    const user = await User.findOne(query).select("_id").lean();

    res.status(200).json({ success: true, exists: !!user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get current logged-in user
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.userProfile?._id || req.user?.id).select("-password -tokens");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, data: user, message: "User profile retrieved successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.userProfile?._id || req.user?.id;

    const {
      name,
      email,
      bio,
      location,
      website,
      github,
      linkedin,
      skills,
    } = req.body || {};

    const updateData = {};

    if (name) updateData.fullName = name;

    if (email) {
      const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
      if (existingUser) return res.status(400).json({ success: false, message: "Email already in use" });
      updateData.email = email.toLowerCase();
    }

    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (github !== undefined) updateData.github = github;
    if (linkedin !== undefined) updateData.linkedin = linkedin;

    if (skills !== undefined) {
      updateData.skills = typeof skills === "string"
        ? skills.split(",").map((s) => s.trim())
        : skills;
    }

    // Handle avatar upload if provided (multer + Cloudinary)
    if (req.file) {
      const avatarUrl = await uploadToCloudinary(req.file.path, userId);
      updateData.avatar = avatarUrl;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true })
      .select("-password -tokens");

    if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });

   res.status(200).json({ 
  success: true, 
  message: "Profile updated successfully", 
  data: { user: updatedUser }   // <-- wrap in `user`
});

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error during profile update", error: error.message });
  }
};

// Update only profile picture
exports.updateProfilePicture = async (req, res) => {
  try {
    const userId = req.userProfile?._id || req.user?.id;

    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    // Upload file securely
    const avatarUrl = await uploadToCloudinary(req.file.path, userId);

    const updatedUser = await User.findByIdAndUpdate(userId, { avatar: avatarUrl }, { new: true, runValidators: true })
      .select("-password -tokens");

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: { avatar: avatarUrl, user: updatedUser },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
