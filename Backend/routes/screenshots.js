const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const paymentVerificationController = require('../controllers/paymentVerificationController');
const { paymentUploadLimiter, apiLimiter } = require('../middleware/rateLimiter');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload payment screenshot
router.post('/upload', upload.single('screenshot'), paymentVerificationController.uploadPaymentScreenshot);

// Get all pending payment verifications (admin)
router.get('/pending', paymentVerificationController.getPendingVerifications);

// Upload and verify payment screenshot
router.post('/verify', apiLimiter, paymentUploadLimiter, upload.single('screenshot'), paymentVerificationController.uploadPaymentScreenshot);

// Manually verify payment (admin)
router.post('/verify-manually', apiLimiter, paymentVerificationController.verifyPaymentManually);

// Get payment screenshot file
router.get('/:uploadId', paymentVerificationController.getPaymentScreenshot);

module.exports = router;
