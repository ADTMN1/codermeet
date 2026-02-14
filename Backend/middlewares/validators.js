// middlewares/validators.js
const { body, validationResult } = require("express-validator");

const registerValidators = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username length must be between 3 and 30")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores")
    .not()
    .matches(/^(?=.*admin|root|user|test|guest)/i)
    .withMessage("Username cannot contain reserved words")
    .not()
    .matches(/(.)\1{2,}/)
    .withMessage("Username cannot contain repeated characters"),
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage("Email address is too long (max 254 characters)")
    .not()
    .matches(/^(?=.*\+|.*%|.*=)/)
    .withMessage("Email contains invalid characters")
    .custom((value) => {
      // Block disposable email domains
      const disposableDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com'];
      const domain = value.split('@')[1]?.toLowerCase();
      if (disposableDomains.includes(domain)) {
        throw new Error('Disposable email addresses are not allowed');
      }
      return true;
    }),
  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number")
    .matches(/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage("Password must contain at least one special character")
    .not()
    .matches(/(.)\1{2,}/)
    .withMessage("Password cannot contain repeated characters")
    .not()
    .matches(/^(?=.*password|123456|qwerty|admin)/i)
    .withMessage("Password cannot contain common patterns"),
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
