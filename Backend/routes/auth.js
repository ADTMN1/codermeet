const express = require("express");
const router = express.Router();
const multer = require("multer");
const rateLimit = require("express-rate-limit");

const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/auth");
const sanitize = require("../middlewares/sanitize");
const {
  registerValidators,
  loginValidators,
  checkValidation,
} = require("../middlewares/validators");

// Multer setup for file uploads
const storage = multer.diskStorage({});
const upload = multer({ storage });

// Apply sanitize middleware on all auth routes
router.use(sanitize);

// Stricter rate limiter for login
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth routes
router.post("/register", registerValidators, checkValidation, authController.register);
router.post("/login", loginLimiter, loginValidators, checkValidation, authController.login);
router.get("/check-user", authController.checkUser);
router.post("/logout", authController.logout);
router.get("/me", authMiddleware, authController.me);

// Update profile with optional avatar
router.put(
  "/profile",
  authMiddleware,
  upload.single("avatar"),
  authController.updateProfile
);

// Update profile picture only (optional)
router.put(
  "/profile/avatar",
  authMiddleware,
  upload.single("avatar"),
  authController.updateProfilePicture
);

module.exports = router;
