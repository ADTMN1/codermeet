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

// Debug endpoint to check recent activity
router.get('/debug/activity', (req, res) => {
  res.json({
    success: true,
    message: 'SMS Forwarding Debug Info',
    data: {
      timestamp: new Date().toISOString(),
      pendingPayments: Array.from(smsForwardingController.getPendingPayments().data || []),
      serverStatus: 'running',
      lastActivity: 'Check server logs for recent SMS activity'
    }
  });
});

module.exports = router;
