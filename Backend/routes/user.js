// routes/user.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { updateProfilePicture } = require("../controllers/userController");

router.post("/profile-picture", auth, updateProfilePicture);

module.exports = router;
