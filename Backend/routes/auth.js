const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const authController = require("../controllers/authController");
const sanitize = require("../middlewares/sanitize");
const {
  registerValidators,
  loginValidators,
  checkValidation,
} = require("../middlewares/validators");

// Apply sanitize middleware on all auth routes
router.use(sanitize);

// Rate limiter for login (strict)
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  message: { success: false, message: "Too many login attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for register (optional, less strict)
const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: { success: false, message: "Too many accounts created, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth routes
router.get("/check-user", authController.checkUserAvailability);
router.get("/check-github", authController.checkGithubAvailability);
router.post("/register", registerLimiter, registerValidators, checkValidation, authController.register);
router.post("/login", loginLimiter, loginValidators, checkValidation, authController.login);
router.post("/logout", authController.logout);

module.exports = router;
