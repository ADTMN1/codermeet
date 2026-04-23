const express = require('express');
const router = express.Router();
const smsForwardingController = require('../controllers/smsForwardingController');

// Public routes
router.get('/info', smsForwardingController.getPaymentInfo);
router.post('/generate-reference', smsForwardingController.generatePaymentReference);

// SMS forwarding receiver endpoint (no auth required - for SMS forwarding app)
router.post('/receive-sms', smsForwardingController.receiveSms);

// Admin routes (temporarily without auth for testing)
router.get('/pending', smsForwardingController.getPendingPayments);
router.post('/verify-manual', smsForwardingController.verifyManualPayment);

module.exports = router;
