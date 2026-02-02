// middlewares/validators.js
const { body, validationResult } = require("express-validator");

const registerValidators = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username length must be between 3 and 30"),
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number")
    .matches(/^(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage("Password must contain at least one special character"),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required"),
  body("plan")
    .notEmpty()
    .withMessage("Plan is required")
    .isIn(["Trial", "Basic", "Premium"]),
  // optional fields sanitization/validation
  body("primaryLanguage").optional().trim(),
  body("skills").optional().isArray().withMessage("Skills must be an array"),
  body("githubUrl")
    .optional()
    .isURL()
    .withMessage("GitHub URL must be a valid URL"),
];

const loginValidators = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // return first error only to avoid leaking structure
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

module.exports = {
  registerValidators,
  loginValidators,
  checkValidation,
};
