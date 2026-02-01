const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/user');

// Chapa configuration
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
const CHAPA_BASE_URL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';

// Plan pricing in ETB (Ethiopian Birr)
const PLAN_PRICES = {
  'basic': 299, // 299 ETB per month
  'premium': 599 // 599 ETB per month
};

// Initialize payment
exports.initializePayment = async (req, res) => {
  try {
    // Validate required environment variables
    if (!CHAPA_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Payment service configuration error'
      });
    }

    const { plan, userId, email, fullName } = req.body;

    if (!plan || !userId || !email || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: plan, userId, email, fullName'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Additional email validation for common issues
    if (email.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Email address is too long (max 100 characters)'
      });
    }

    // Check for common typos in email domains
    const commonTypos = {
      'c6odermeet.com': 'codermeet.com',
      'gmial.com': 'gmail.com',
      'yahho.com': 'yahoo.com'
    };

    const [localPart, domain] = email.toLowerCase().split('@');
    if (commonTypos[domain]) {
      const correctedEmail = `${localPart}@${commonTypos[domain]}`;
      // Use the corrected email for the payment
      email = correctedEmail;
    }

    if (!PLAN_PRICES[plan.toLowerCase()]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected'
      });
    }

    // Generate unique transaction reference
    const tx_ref = `${plan.toLowerCase()}-${userId}-${Date.now()}`;

    // Prepare payment payload for Chapa with strict validation
    const title = `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`;
    const validatedTitle = title.length > 16 ? title.substring(0, 16) : title;
    
    // Validate and sanitize all fields to prevent undefined/null values
    const firstName = (fullName && fullName.split) ? (fullName.split(' ')[0] || 'User') : 'User';
    const lastName = (fullName && fullName.split) ? (fullName.split(' ').slice(1).join(' ') || 'Name') : 'Name';
    const phoneNumber = ''; // Optional, keep empty string
    
    // Ensure all required fields are present and valid
    const payload = {
      amount: PLAN_PRICES[plan.toLowerCase()] || 299,
      currency: 'ETB',
      email: email || 'test@example.com',
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
      tx_ref: tx_ref || `tx-${Date.now()}`,
      callback_url: `${process.env.FRONTEND_URL}/api/payment/verify`,
      return_url: `${process.env.FRONTEND_URL}/payment-success?tx_ref=${tx_ref || `tx-${Date.now()}`}`,
      customization: {
        title: validatedTitle || 'Payment',
        description: `Monthly subscription for ${plan || 'basic'} plan`
      },
      meta: {
        userId: userId || 'temp',
        plan: plan || 'basic',
        type: 'subscription'
      }
    };

    // Ensure nested objects are always objects, never undefined/null
    if (!payload.customization || typeof payload.customization !== 'object') {
      payload.customization = {
        title: validatedTitle || 'Payment',
        description: 'Monthly subscription'
      };
    }

    if (!payload.meta || typeof payload.meta !== 'object') {
      payload.meta = {
        userId: userId || 'temp',
        plan: plan || 'basic',
        type: 'subscription'
      };
    }

    // Final validation - ensure no undefined/null values in any object
    const validateObject = (obj, prefix = '') => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value === undefined || value === null) {
          // Set appropriate defaults based on key
          if (key === 'amount') obj[key] = 299;
          else if (key === 'currency') obj[key] = 'ETB';
          else if (key === 'email') obj[key] = 'test@example.com';
          else if (key === 'first_name') obj[key] = 'User';
          else if (key === 'last_name') obj[key] = 'Name';
          else if (key === 'phone_number') obj[key] = '';
          else if (key === 'tx_ref') obj[key] = tx_ref || `tx-${Date.now()}`;
          else if (key === 'callback_url') obj[key] = `${process.env.FRONTEND_URL}/payment/verify`;
          else if (key === 'return_url') obj[key] = `${process.env.FRONTEND_URL}/payment/success?tx_ref=${tx_ref || `tx-${Date.now()}`}`;
          else if (key === 'title') obj[key] = validatedTitle || 'Payment';
          else if (key === 'description') obj[key] = 'Monthly subscription';
          else if (key === 'userId') obj[key] = userId || 'temp';
          else if (key === 'plan') obj[key] = plan || 'basic';
          else if (key === 'type') obj[key] = 'subscription';
          else obj[key] = ''; // Default empty string for unknown keys
        }
      });
    };

    // Validate all objects recursively
    validateObject(payload);
    validateObject(payload.customization, 'customization.');
    validateObject(payload.meta, 'meta.');

    // Additional safety check - ensure payload is a valid object
    if (!payload || typeof payload !== 'object') {
      payload = {
        amount: 299,
        currency: 'ETB',
        email: 'test@example.com',
        first_name: 'User',
        last_name: 'Name',
        phone_number: '',
        tx_ref: tx_ref || `tx-${Date.now()}`,
        callback_url: `${process.env.FRONTEND_URL}/payment/verify`,
        return_url: `${process.env.FRONTEND_URL}/payment/success?tx_ref=${tx_ref || `tx-${Date.now()}`}`,
        customization: {
          title: 'Payment',
          description: 'Monthly subscription'
        },
        meta: {
          userId: 'temp',
          plan: 'basic',
          type: 'subscription'
        }
      };
    }

    // Make real API call to Chapa to get hosted checkout URL
    const response = await axios.post(
      `${CHAPA_BASE_URL}/transaction/initialize`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      }
    );

    if (response.data.status === 'success') {
      return res.status(200).json({
        success: true,
        data: {
          checkout_url: response.data.data.checkout_url,
          tx_ref: tx_ref,
          plan: plan,
          amount: PLAN_PRICES[plan.toLowerCase()]
        },
        real_chapa: true
      });
    } else {
      // Check if we got a checkout URL despite the error
      if (response.data.data && response.data.data.checkout_url) {
        return res.status(200).json({
          success: true,
          data: {
            checkout_url: response.data.data.checkout_url,
            tx_ref: tx_ref,
            plan: plan,
            amount: PLAN_PRICES[plan.toLowerCase()]
          },
          partial_success: true,
          warning: 'Chapa API returned error but provided checkout URL'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Failed to initialize payment',
        error: response.data
      });
    }

  } catch (error) {
    // Log error without exposing sensitive information
    const errorInfo = {
      message: error.message,
      code: error.code,
      status: error.response?.status
    };
    
    // Log specific Chapa error if available (but not full response)
    if (error.response?.data?.message) {
      errorInfo.chapaError = error.response.data.message;
    }
    
    // In production, use proper logging service
    if (process.env.NODE_ENV === 'development') {
      console.error('Payment initialization error:', errorInfo);
    }
    
    res.status(500).json({
      success: false,
      message: 'Payment initialization failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const { tx_ref } = req.query;

    if (!tx_ref) {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference is required'
      });
    }

    // In development, simulate successful payment verification
    if (process.env.NODE_ENV === 'development') {
      // Extract plan and userId from transaction reference
      const parts = tx_ref.split('-');
      const plan = parts[0];
      const userId = parts[1] || 'temp';
      
      if (userId === 'temp') {
        // For development mode, simulate successful payment and complete registration
        
        try {
          // Create mock registration data based on extracted plan
          const pendingData = {
            formData: {
              fullName: 'Test User',
              username: 'testuser' + Date.now(),
              email: 'test' + Date.now() + '@codermeet.com',
              password: 'password123',
              confirmPassword: 'password123',
              primaryLanguage: 'JavaScript',
              skills: ['React', 'Node.js'],
              github: 'https://github.com/testuser',
              bio: 'Test user bio',
              plan: plan || 'premium'
            }
          };

          // Register the user
          const User = require('../models/user');
          const bcrypt = require('bcryptjs');
          
          const { formData } = pendingData;
          const hashedPassword = await bcrypt.hash(formData.password, 12);
          
          const newUser = new User({
            fullName: formData.fullName,
            username: formData.username,
            email: formData.email,
            password: hashedPassword,
            primaryLanguage: formData.primaryLanguage,
            skills: formData.skills,
            github: formData.github,
            bio: formData.bio,
            plan: formData.plan.charAt(0).toUpperCase() + formData.plan.slice(1),
            isProfessional: formData.plan.toLowerCase() !== 'trial',
            createdAt: new Date(),
            updatedAt: new Date()
          });

          await newUser.save();
          
          return res.status(200).json({
            success: true,
            message: 'Payment verified and user registered successfully (DEV MODE)',
            data: {
              user: {
                id: 'temp-user-id',
                email: 'test@example.com',
                username: 'testuser',
                fullName: 'Test User',
                plan: plan || 'Premium',
                isProfessional: true
              },
              transaction: {
                tx_ref: tx_ref,
                amount: plan === 'premium' ? 599 : 299,
                status: 'success'
              }
            },
            test_mode: true
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: 'Failed to register user in DEV MODE',
            error: error.message
          });
        }
      }
      
      // Try to find real user in database
      const user = await User.findById(userId);
      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'Payment verified successfully (DEV MODE - User not found)',
          data: {
            user: {
              id: userId,
              email: 'unknown@example.com',
              username: 'unknown',
              fullName: 'Unknown User',
              plan: plan.charAt(0).toUpperCase() + plan.slice(1),
              isProfessional: plan !== 'trial'
            },
            transaction: {
              tx_ref: tx_ref,
              amount: PLAN_PRICES[plan.toLowerCase()],
              status: 'success'
            }
          },
          test_mode: true
        });
      }

      // Update real user's plan
      user.plan = plan.charAt(0).toUpperCase() + plan.slice(1);
      user.isProfessional = plan !== 'trial';
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Payment verified and plan updated successfully (DEV MODE)',
        data: {
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            plan: user.plan,
            isProfessional: user.isProfessional
          },
          transaction: {
            tx_ref: tx_ref,
            amount: PLAN_PRICES[plan.toLowerCase()],
            status: 'success'
          }
        },
        test_mode: true
      });
    }

    // Production: Make real API call to Chapa verification endpoint
    const response = await axios.get(
      `${CHAPA_BASE_URL}/transaction/verify/${tx_ref}`,
      {
        headers: {
          'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.status === 'success' && response.data.data.status === 'success') {
      const transaction = response.data.data;
      const meta = transaction.meta;

      // Update user's plan in database
      const user = await User.findById(meta.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user plan
      user.plan = meta.plan.charAt(0).toUpperCase() + meta.plan.slice(1);
      user.isProfessional = meta.plan !== 'trial';
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Payment verified and plan updated successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            plan: user.plan,
            isProfessional: user.isProfessional
          },
          transaction: {
            tx_ref: tx_ref,
            amount: transaction.amount,
            status: transaction.status
          }
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        data: response.data
      });
    }

  } catch (error) {
    // Log error without exposing sensitive information
    if (process.env.NODE_ENV === 'development') {
      console.error('Payment verification error:', error.message);
    }
    
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Webhook handler for payment notifications
exports.handleWebhook = async (req, res) => {
  try {
    const { tx_ref, ref_id, status } = req.body;

    if (!tx_ref || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing webhook data'
      });
    }

    if (status === 'success') {
      // Verify the transaction to get full details
      const response = await axios.get(
        `${CHAPA_BASE_URL}/transaction/verify/${tx_ref}`,
        {
          headers: {
            'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        const transaction = response.data.data;
        const meta = transaction.meta;

        // Update user's plan
        await User.findByIdAndUpdate(meta.userId, {
          plan: meta.plan.charAt(0).toUpperCase() + meta.plan.slice(1),
          isProfessional: meta.plan !== 'trial'
        });
      }
    }

    res.status(200).json({ success: true });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Chapa webhook error:', error.message);
    }
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
};

// Get plan prices
exports.getPlanPrices = (req, res) => {
  res.status(200).json({
    success: true,
    data: PLAN_PRICES
  });
};
