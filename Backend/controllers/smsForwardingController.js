const crypto = require('crypto');
const User = require('../models/user');

// Bank SMS patterns for Ethiopian banks
const BANK_PATTERNS = {
  CBE: {
    name: 'Commercial Bank of Ethiopia',
    patterns: [
      /CBE[:\s]*(?:credited|received|deposited)\s*(?:ETB\s*)?(\d+(?:,\d+)*)/i,
      /CBE[:\s]*account\s*credited\s*with\s*(?:ETB\s*)?(\d+(?:,\d+)*)/i,
      /CBE[:\s]*(\d+(?:,\d+)*)\s*ETB\s*credited/i
    ],
    referencePattern: /ref(?:erence)?:?\s*([A-Z0-9]+)/i,
    accountPattern: /account\s*(?:no|number)?[:\s]*(\d+)/i
  },
  AWASH: {
    name: 'Awash Bank',
    patterns: [
      /Awash[:\s]*(?:credited|received)\s*(?:ETB\s*)?(\d+(?:,\d+)*)/i,
      /Awash[:\s]*deposit\s*(?:ETB\s*)?(\d+(?:,\d+)*)/i
    ],
    referencePattern: /ref(?:erence)?:?\s*([A-Z0-9]+)/i
  },
  DASHEN: {
    name: 'Dashen Bank',
    patterns: [
      /Dashen[:\s]*(?:credited|received)\s*(?:ETB\s*)?(\d+(?:,\d+)*)/i,
      /Dashen[:\s]*payment\s*received\s*(?:ETB\s*)?(\d+(?:,\d+)*)/i
    ],
    referencePattern: /ref(?:erence)?:?\s*([A-Z0-9]+)/i
  },
  TELEBIRR: {
    name: 'TeleBirr',
    patterns: [
      /TeleBirr[:\s]*(?:received|credited)\s*(?:ETB\s*)?(\d+(?:,\d+)*)/i,
      /TeleBirr[:\s]*payment\s*received\s*(?:ETB\s*)?(\d+(?:,\d+)*)/i
    ],
    referencePattern: /transaction\s*id[:\s]*([A-Z0-9]+)/i
  }
};

// Expected payment amounts
const PLAN_PRICES = {
  'basic': 299,
  'premium': 599
};

// Store pending payments (in production, use Redis/database)
const pendingPayments = new Map();

// Generate payment reference for user
exports.generatePaymentReference = async (req, res) => {
  try {
    const { plan, userId, email, fullName } = req.body;

    if (!plan || !userId || !email || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: plan, userId, email, fullName'
      });
    }

    if (!PLAN_PRICES[plan.toLowerCase()]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected'
      });
    }

    // Generate unique payment reference
    const paymentRef = `CM-${plan.toUpperCase()}-${Date.now()}`;
    const amount = PLAN_PRICES[plan.toLowerCase()];

    // Store pending payment
    pendingPayments.set(paymentRef, {
      userId,
      email,
      fullName,
      plan: plan.toLowerCase(),
      amount,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    return res.status(200).json({
      success: true,
      data: {
        paymentRef,
        plan: plan.toLowerCase(),
        amount,
        paymentMethods: {
          bank_transfer: {
            name: 'Bank Transfer',
            accountName: 'CoderMeet Technologies',
            accountNumber: '1000123456789',
            bank: 'Commercial Bank of Ethiopia',
            branch: 'Bole Branch'
          },
          telebirr: {
            name: 'TeleBirr',
            phoneNumber: '+251911234567',
            merchantName: 'CoderMeet'
          }
        },
        instructions: {
          step1: `Pay ${amount} ETB using any payment method above`,
          step2: 'Use your full name as payment description/reference',
          step3: 'Payment will be detected automatically via bank SMS',
          step4: 'You will receive instant dashboard access upon detection'
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

  } catch (error) {
    console.error('Payment reference generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payment reference'
    });
  }
};

// SMS forwarding receiver endpoint
exports.receiveSms = async (req, res) => {
  try {
    const { message, sender, time } = req.body;

    console.log('Received SMS:', { message, sender, time });

    // Parse the SMS to extract payment information
    const paymentInfo = parseBankSMS(message);
    
    if (!paymentInfo) {
      console.log('SMS does not contain payment information');
      return res.status(200).json({ 
        success: false, 
        message: 'No payment information detected' 
      });
    }

    console.log('Payment detected:', paymentInfo);

    // Try to match with pending payment
    const matchedPayment = await matchPaymentWithUser(paymentInfo);
    
    if (matchedPayment) {
      // Update user plan
      await updateUserPlan(matchedPayment.userId, matchedPayment.plan);
      
      // Remove from pending payments
      pendingPayments.delete(matchedPayment.paymentRef);

      console.log('Payment processed successfully:', {
        userId: matchedPayment.userId,
        plan: matchedPayment.plan,
        amount: paymentInfo.amount
      });

      return res.status(200).json({
        success: true,
        message: 'Payment processed and user upgraded',
        data: {
          userId: matchedPayment.userId,
          plan: matchedPayment.plan,
          amount: paymentInfo.amount,
          bank: paymentInfo.bank
        }
      });
    } else {
      console.log('No matching pending payment found');
      
      // Store unmatched payment for manual review
      await storeUnmatchedPayment(paymentInfo, message, sender);
      
      return res.status(200).json({
        success: false,
        message: 'Payment detected but no matching user found',
        data: paymentInfo
      });
    }

  } catch (error) {
    console.error('SMS processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process SMS'
    });
  }
};

// Parse bank SMS to extract payment information
function parseBankSMS(message) {
  const messageUpper = message.toUpperCase();
  
  for (const [bankKey, bankInfo] of Object.entries(BANK_PATTERNS)) {
    for (const pattern of bankInfo.patterns) {
      const match = message.match(pattern);
      if (match) {
        const amount = parseInt(match[1].replace(/,/g, ''));
        
        // Extract reference if available
        let reference = null;
        if (bankInfo.referencePattern) {
          const refMatch = message.match(bankInfo.referencePattern);
          if (refMatch) {
            reference = refMatch[1];
          }
        }

        // Extract account if available
        let account = null;
        if (bankInfo.accountPattern) {
          const accMatch = message.match(bankInfo.accountPattern);
          if (accMatch) {
            account = accMatch[1];
          }
        }

        return {
          bank: bankKey,
          bankName: bankInfo.name,
          amount,
          reference,
          account,
          rawMessage: message,
          timestamp: new Date()
        };
      }
    }
  }
  
  return null;
}

// Match payment with pending payment
async function matchPaymentWithUser(paymentInfo) {
  // Try to match by amount first
  for (const [paymentRef, pending] of pendingPayments.entries()) {
    if (pending.amount === paymentInfo.amount && 
        pending.createdAt < paymentInfo.timestamp &&
        pending.expiresAt > paymentInfo.timestamp) {
      
      return {
        paymentRef,
        userId: pending.userId,
        plan: pending.plan,
        amount: pending.amount
      };
    }
  }
  
  // If no amount match, try to find user by recent pending payments
  // This handles cases where amount might be slightly different
  for (const [paymentRef, pending] of pendingPayments.entries()) {
    const amountDiff = Math.abs(pending.amount - paymentInfo.amount);
    if (amountDiff <= 50 && // Allow small difference (fees, etc.)
        pending.createdAt < paymentInfo.timestamp &&
        pending.expiresAt > paymentInfo.timestamp) {
      
      return {
        paymentRef,
        userId: pending.userId,
        plan: pending.plan,
        amount: pending.amount
      };
    }
  }
  
  return null;
}

// Update user plan
async function updateUserPlan(userId, plan) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return false;
    }

    // Update user's plan and professional status
    user.plan = plan.charAt(0).toUpperCase() + plan.slice(1);
    user.isProfessional = plan !== 'trial';
    user.activity.lastActive = new Date();
    await user.save();

    console.log('User plan updated:', {
      userId,
      plan: user.plan,
      isProfessional: user.isProfessional
    });

    return true;
  } catch (error) {
    console.error('Error updating user plan:', error);
    return false;
  }
}

// Store unmatched payments for manual review
async function storeUnmatchedPayment(paymentInfo, rawMessage, sender) {
  try {
    // In production, store in database
    console.log('Unmatched payment stored:', {
      paymentInfo,
      rawMessage,
      sender,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error storing unmatched payment:', error);
  }
}

// Get pending payments for admin
exports.getPendingPayments = async (req, res) => {
  try {
    const pending = Array.from(pendingPayments.entries()).map(([ref, data]) => ({
      paymentRef: ref,
      ...data,
      timeRemaining: data.expiresAt - new Date()
    }));

    return res.status(200).json({
      success: true,
      data: pending
    });

  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending payments'
    });
  }
};

// Manual payment verification
exports.verifyManualPayment = async (req, res) => {
  try {
    const { userId, plan, amount, notes } = req.body;

    if (!userId || !plan || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Update user plan
    const success = await updateUserPlan(userId, plan);
    
    if (success) {
      return res.status(200).json({
        success: true,
        message: 'Manual payment verified and user upgraded'
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

  } catch (error) {
    console.error('Manual payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify manual payment'
    });
  }
};

// Get payment info
exports.getPaymentInfo = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      prices: PLAN_PRICES,
      supportedBanks: Object.keys(BANK_PATTERNS).map(key => ({
        code: key,
        name: BANK_PATTERNS[key].name
      })),
      instructions: {
        title: 'Automatic Payment Detection',
        description: 'Our system automatically detects bank payments via SMS notifications',
        steps: [
          'Generate payment reference',
          'Pay using bank transfer or mobile money',
          'System automatically detects payment via SMS',
          'Get instant dashboard access'
        ]
      }
    }
  });
};
