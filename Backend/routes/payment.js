const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Initialize payment
router.post('/initialize', paymentController.initializePayment);

// Verify payment
router.get('/verify', paymentController.verifyPayment);

// Webhook endpoint for Chapa notifications
router.post('/webhook', paymentController.handleWebhook);

// Get plan prices
router.get('/prices', paymentController.getPlanPrices);

module.exports = router;
