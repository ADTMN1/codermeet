// controllers/userController.js
const User = require("../models/user");

exports.updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatarUrl, publicId } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({ success: false, message: "avatarUrl is required" });
    }

    // Save the URL and publicId in DB
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { avatar: avatarUrl, avatarPublicId: publicId } },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({ success: true, message: "Profile picture updated", user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
