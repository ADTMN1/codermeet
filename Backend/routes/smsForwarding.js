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

// Simple test endpoint to verify connection
router.post('/test-connection', (req, res) => {
  console.log('='.repeat(50));
  console.log('🔔 TEST CONNECTION RECEIVED AT:', new Date().toISOString());
  console.log('📱 Request Body:', req.body);
  console.log('📱 Request IP:', req.ip);
  console.log('📱 User-Agent:', req.get('User-Agent'));
  console.log('📱 Headers:', req.headers);
  console.log('='.repeat(50));
  
  res.json({
    success: true,
    message: 'Test connection successful!',
    data: {
      timestamp: new Date().toISOString(),
      receivedBody: req.body,
      receivedIP: req.ip,
      userAgent: req.get('User-Agent')
    }
  });
});

// Ultra-simple endpoint that's impossible to miss
router.post('/ping', (req, res) => {
  console.log('🔥🔥🔥 PING RECEIVED AT:', new Date().toISOString());
  console.log('🔥 BODY:', JSON.stringify(req.body));
  console.log('🔥 IP:', req.ip);
  console.log('🔥🔥🔥');
  
  res.send('PONG SUCCESS');
});

module.exports = router;
