// routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/auth");
const sanitize = require("../middlewares/sanitize");
const {
  registerValidators,
  loginValidators,
  checkValidation,
} = require("../middlewares/validators");
const rateLimit = require("express-rate-limit");

// Apply sanitize middleware on all auth routes
router.use(sanitize);

// stricter rate limiter for login to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/register",
  registerValidators,
  checkValidation,
  authController.register
);
router.post(
  "/login",
  loginLimiter,
  loginValidators,
  checkValidation,
  authController.login
);
router.post("/logout", authController.logout);

router.get("/me", authMiddleware, authController.me);

module.exports = router;
