// Debug endpoint for testing execution system
const express = require('express');
const router = express.Router();

router.get('/execution-status', (req, res) => {
  const { getActiveService, isServiceConfigured, getAvailableServices } = require('../config/executionConfig');
  
  const status = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasGroqKey: !!process.env.GROQ_API_KEY
    },
    services: {
      available: getAvailableServices(),
      active: getActiveService(),
      configured: {
        judge0: isServiceConfigured('judge0'),
        gemini: isServiceConfigured('gemini'),
        openai: isServiceConfigured('openai'),
        groq: isServiceConfigured('groq')
      }
    },
    config: require('../config/executionConfig').EXECUTION_CONFIG
  };
  
  res.json({
    success: true,
    data: status
  });
});

router.post('/test-execution', async (req, res) => {
  try {
    const { code = 'console.log("Hello World");', testCases = [{ input: '', expectedOutput: 'Hello World', index: 0 }] } = req.body;
    
    // Import the controller to access executeCode
    const dailyChallengeController = require('../controllers/dailyChallengeController');
    
    // Check if executeCode exists
    if (typeof dailyChallengeController.executeCode === 'function') {
      const results = await dailyChallengeController.executeCode(code, testCases, 'Test execution');
      
      res.json({
        success: true,
        data: {
          input: { code, testCases },
          results: results,
          executionTime: Date.now() - req.body.startTime
        }
      });
    } else {
      res.json({
        success: false,
        error: 'executeCode function not available'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
