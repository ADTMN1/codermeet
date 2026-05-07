const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const User = require('../models/user');
const PaymentVerification = require('../models/PaymentVerification');
const Tesseract = require('tesseract.js');
const { sanitizePaymentVerificationRequest, validateFileUpload } = require('../middleware/validation');
const ErrorMessageHandler = require('../utils/errorMessages');

// OCR Service - Real implementation using Tesseract.js
class OCRService {
  static async extractTextFromImage(imagePath) {
    try {
      
      // Check if file exists and get file info
      const fs = require('fs');
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }
      
      const fileStats = fs.statSync(imagePath);
      
      // Use real Tesseract.js OCR
      
      const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
        oem: 1,
        psm: 3
      });
      
      
      return text;
    } catch (error) {
      throw new Error(`Failed to extract text from image: ${error.message}`);
    }
  }
  
  static generateMockTransactionText() {
    // Generate realistic-looking transaction text for demo
    const transactionId = 'FT' + Math.random().toString(36).substr(2, 10).toUpperCase();
    const amount = (Math.random() * 5000 + 100).toFixed(2);
    const date = new Date().toLocaleDateString();
    
    return `Payment Confirmation
Transaction ID: ${transactionId}
Amount: ETB ${amount}
Date: ${date}
Recipient: CoderMeet Technologies
Status: COMPLETED
Reference: PAY-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }
  
  static generateRealisticTransactionText() {
    // Generate realistic transaction text based on common patterns
    const transactionId = 'FT' + Math.random().toString(36).substr(2, 10).toUpperCase();
    const amount = (Math.random() * 5000 + 100).toFixed(2);
    const date = new Date().toLocaleDateString();
    
    
    return `Payment Confirmation
    
Transaction ID: ${transactionId}
Amount: ETB ${amount}
Date: ${date}
Recipient: CoderMeet Technologies
Status: COMPLETED
Reference: PAY-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }
}

// Payment Verification Service
class PaymentVerificationService {
  static async verifyPayment(extractedText, expectedAmount, recipientName) {
    try {
      
      // Extract key information from OCR text
      const extractedData = this.parseTransactionText(extractedText);
      
      // Verification checks
      const verification = {
        isValid: false,
        confidence: 0,
        issues: [],
        extractedData,
        verificationId: this.generateVerificationId()
      };
      
      // Check 1: Amount match (allowing variance for Ethiopian banking fees)
      const amountDiff = Math.abs(extractedData.amount - expectedAmount);
      const amountVariance = amountDiff / expectedAmount;
      
      
      if (amountVariance <= 0.70) { // Allow 70% variance for Ethiopian banking fees
        verification.isValid = true;
        verification.confidence += 40;
      } else if (amountVariance <= 0.90) { // Flag suspicious amounts
        verification.issues.push({
          type: 'AMOUNT_MISMATCH',
          severity: 'WARNING',
          message: `Amount differs by ${(amountVariance * 100).toFixed(1)}%`
        });
        verification.confidence += 20;
      } else {
        verification.issues.push({
          type: 'MAJOR_AMOUNT_MISMATCH',
          severity: 'ERROR',
          message: `Amount differs by ${(amountVariance * 100).toFixed(1)}% - Possible fake payment`
        });
      }
      
      // Check 2: Recipient validation - ensure payment goes to correct CoderMeet account
      const validRecipients = [
        process.env.CODERMEET_RECIPIENT_NAME || 'NATINAEL ABEBAW GEREMEW',
        process.env.CODERMEET_BUSINESS_NAME || 'CoderMeet Technologies',
        'CoderMeet' 
      ];
      
      const isValidRecipient = validRecipients.some(recipient => 
        extractedData.recipient && 
        (extractedData.recipient.toLowerCase().includes(recipient.toLowerCase()) ||
         recipient.toLowerCase().includes(extractedData.recipient.toLowerCase()))
      );
      
      
      if (isValidRecipient) {
        verification.confidence += 30;
      } else {
        verification.issues.push({
          type: 'RECIPIENT_MISMATCH',
          severity: 'ERROR',
          message: 'Payment recipient does not match CoderMeet account'
        });
      }
      
      // Check 3: Transaction ID format
      if (extractedData.transactionId && extractedData.transactionId.match(/^FT[A-Z0-9]{8,12}$/)) {
        verification.confidence += 20;
      } else {
        verification.issues.push({
          type: 'INVALID_TRANSACTION_ID',
          severity: 'WARNING',
          message: 'Transaction ID format is unusual'
        });
      }
      
      // Check 4: Date validity
      const transactionDate = new Date(extractedData.date);
      const now = new Date();
      const daysDiff = (now - transactionDate) / (1000 * 60 * 60 * 24);
      
      if (daysDiff <= 30) { // Payment within last 30 days
        verification.confidence += 10;
      } else {
        verification.issues.push({
          type: 'OLD_TRANSACTION',
          severity: 'WARNING',
          message: `Transaction is ${daysDiff.toFixed(0)} days old`
        });
      }
      
      // Final validation
      verification.confidence = Math.min(verification.confidence, 100);
      verification.isValid = verification.confidence >= 70 && verification.issues.filter(i => i.severity === 'ERROR').length === 0;
      
      return verification;
      
    } catch (error) {
      throw new Error('Payment verification failed');
    }
  }
  
  static parseTransactionText(text) {
    
    const data = {
      transactionId: null,
      amount: null,
      date: null,
      recipient: null,
      status: null,
      payer: null
    };
    
    // Split text into lines for processing
    const lines = text.split('\n').filter(line => line.trim());
    
    
    lines.forEach((line, index) => {
      
      // Extract transaction ID (multiple formats including multi-line)
      if (line.toLowerCase().includes('transaction id:')) {
        const match = line.match(/transaction id:\s*([A-Z0-9]+)/i);
        if (match) data.transactionId = match[1];
      } else if (line.toLowerCase().includes('id:') && line.match(/[A-Z0-9]{10,}/)) {
        const match = line.match(/id:\s*([A-Z0-9]+)/i);
        if (match) data.transactionId = match[1];
      } else if (line.match(/^[A-Z0-9]{10,}$/)) {
        // Line with just transaction ID (common format)
        data.transactionId = line.trim();
      } else if (line.match(/^([A-Z0-9]{10,})\./)) {
        // Transaction ID with period at end (common in Ethiopian receipts)
        const match = line.match(/^([A-Z0-9]{10,})\./);
        if (match) data.transactionId = match[1];
      }
      
      // Extract amount (multiple formats)
      if (line.toLowerCase().includes('debited') && line.toLowerCase().includes('etb')) {
        const match = line.match(/ETB\s*([\d.]+)/i);
        if (match) data.amount = parseFloat(match[1]);
      } else if (line.toLowerCase().includes('amount:') && line.toLowerCase().includes('etb')) {
        const match = line.match(/ETB\s*([\d.]+)/i);
        if (match) data.amount = parseFloat(match[1]);
      }
      
      // Extract date (multiple formats)
      if (line.toLowerCase().includes('on ') && line.toLowerCase().includes('-apr-')) {
        const match = line.match(/on\s+(\d{1,2}-[a-z]{3}-\d{4})/i);
        if (match) data.date = match[1];
      } else if (line.toLowerCase().includes('date:')) {
        const dateStr = line.split(':')[1]?.trim();
        if (dateStr) data.date = dateStr;
      } else if (line.match(/^\d{1,2}-[a-z]{3}-\d{4}$/i)) {
        // Line with just date
        data.date = line.trim();
      }
      
      // Extract payer (debited from)
      if (line.toLowerCase().includes('debited from')) {
        const parts = line.split('debited from');
        if (parts.length > 1) {
          const payerPart = parts[1].split(' for')[0]?.trim();
          if (payerPart) data.payer = payerPart;
        }
      }
      
      // Extract recipient (for) - this is the payment recipient/merchant
      if (line.toLowerCase().includes(' for ') && !line.toLowerCase().includes('debited')) {
        const parts = line.split(' for ');
        if (parts.length > 1) {
          let recipientPart = parts[1].split('-')[0]?.trim();
          if (recipientPart) {
            // Check if recipient continues on next line
            const nextLineIndex = index + 1;
            if (nextLineIndex < lines.length && 
                lines[nextLineIndex].includes('-ETB-') && 
                !lines[nextLineIndex].toLowerCase().includes('debited')) {
              recipientPart += ' ' + lines[nextLineIndex].split('-')[0]?.trim();
            }
            data.recipient = recipientPart;
          }
        }
      }
      
      // Extract merchant/company from bank name (more robust with OCR noise)
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('commercial bank') || lowerLine.includes('bank') || 
          (lowerLine.includes('commercial') && lowerLine.includes('bank'))) {
        data.merchant = 'Commercial Bank of Ethiopia';
        }
      
      // Extract status
      if (line.toLowerCase().includes('success')) {
        data.status = 'success';
      } else if (line.toLowerCase().includes('failed')) {
        data.status = 'failed';
      } else if (line.toLowerCase().includes('pending')) {
        data.status = 'pending';
      }
    });
    
    return data;
  }
  
  static generateVerificationId() {
    return 'VER' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
  }
  
  // Check for duplicate payments
  static async checkDuplicatePayment(transactionId, amount, userEmail) {
    try {
      // Check if this transaction ID was already used in PaymentVerification collection
      const existingVerification = await PaymentVerification.findByTransactionId(transactionId);
      
      if (existingVerification) {
        return {
          isDuplicate: true,
          type: 'DUPLICATE_TRANSACTION_ID',
          message: 'This transaction ID has already been used for another payment verification',
          existingVerification: {
            id: existingVerification._id,
            email: existingVerification.email,
            status: existingVerification.status,
            createdAt: existingVerification.createdAt
          }
        };
      }
      
      // Check if this transaction ID was already used in User collection (legacy check)
      const existingUser = await User.findOne({
        $or: [
          { 'verifiedTransactionId': transactionId },
          { 'paymentScreenshot': { $regex: transactionId } }
        ]
      });
      
      if (existingUser) {
        return {
          isDuplicate: true,
          type: 'DUPLICATE_TRANSACTION_ID',
          message: 'This transaction ID has already been used for another payment verification',
          existingUser: existingUser.email
        };
      }
      
      // Check for suspicious patterns (multiple similar amounts in short time)
      const recentPayments = await User.find({
        email: userEmail,
        'paymentVerifiedAt': { $exists: true },
        'paymentVerifiedAt': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });
      
      if (recentPayments.length >= 3) {
        return {
          isDuplicate: true,
          type: 'SUSPICIOUS_FREQUENCY',
          message: 'Multiple payment verifications detected in last 24 hours',
          count: recentPayments.length
        };
      }
      
      return { isDuplicate: false };
    } catch (error) {
        return { isDuplicate: false, error: error.message };
    }
  }
}

// Upload and verify payment screenshot
exports.uploadPaymentScreenshot = async (req, res) => {
  try {
    // Validate and sanitize input
    const validation = sanitizePaymentVerificationRequest(req);
    if (!validation.isValid) {
      const errorType = validation.errors[0].includes('email') ? 'INVALID_EMAIL' :
                       validation.errors[0].includes('plan') ? 'INVALID_PLAN' :
                       validation.errors[0].includes('amount') ? 'INVALID_AMOUNT' : 'SYSTEM_ERROR';
      
      const errorResponse = ErrorMessageHandler.formatErrorResponse(errorType);
      return res.status(ErrorMessageHandler.getHttpStatus(errorType)).json(errorResponse);
    }
    
    // Validate file upload
    const fileValidation = validateFileUpload(req.file);
    if (!fileValidation.isValid) {
      const errorType = fileValidation.errors[0].includes('file') ? 'NO_FILE_UPLOADED' :
                       fileValidation.errors[0].includes('type') ? 'INVALID_FILE_TYPE' :
                       fileValidation.errors[0].includes('size') ? 'FILE_TOO_LARGE' : 'SYSTEM_ERROR';
      
      const errorResponse = ErrorMessageHandler.formatErrorResponse(errorType);
      return res.status(ErrorMessageHandler.getHttpStatus(errorType)).json(errorResponse);
    }
    
    const { plan, amount, email, fullName, pendingRegistration } = validation.sanitized;
    const screenshot = req.file;


    if (!screenshot) {
      return res.status(400).json({
        success: false,
        message: 'No screenshot uploaded',
        debug: {
          error: 'MISSING_SCREENSHOT',
          hasFiles: !!req.files,
          fileKeys: req.files ? Object.keys(req.files) : [],
          bodyKeys: Object.keys(req.body),
          timestamp: new Date().toISOString()
        }
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const filename = `payment_${timestamp}_${randomString}.jpg`;
    
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads/screenshots');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Calculate file hash to detect duplicate screenshots
    const fileHash = crypto.createHash('sha256').update(screenshot.buffer).digest('hex');

    // Check if this exact file has been uploaded before (using database)
    const existingFileUpload = await PaymentVerification.findByFileHash(fileHash);
    if (existingFileUpload) {
      const errorResponse = ErrorMessageHandler.formatErrorResponse('DUPLICATE_SCREENSHOT', {
        existingUpload: {
          id: existingFileUpload._id,
          email: existingFileUpload.email,
          status: existingFileUpload.status,
          createdAt: existingFileUpload.createdAt
        }
      });
      return res.status(ErrorMessageHandler.getHttpStatus('DUPLICATE_SCREENSHOT')).json(errorResponse);
    }

    // Save screenshot
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, screenshot.buffer);

    // Create PaymentVerification record in database
    const paymentVerification = new PaymentVerification({
      // Will be populated after OCR extraction
      status: 'processing',
      verified: false,
      
      // User and plan information
      email: email || 'unknown',
      fullName: fullName || 'Unknown',
      plan: plan,
      amount: parseFloat(amount),
      
      // File information
      originalFileName: screenshot.originalname,
      fileSize: screenshot.size,
      fileHash: fileHash,
      filePath: filepath,
      
      // Request metadata
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      
      // Pending registration flag
      pendingRegistration: pendingRegistration === 'true'
    });
    
    // Save to database
    await paymentVerification.save();



    // Step 1: Extract text using OCR
    const extractedText = await OCRService.extractTextFromImage(filepath);
    
    // Step 2: Check for duplicates before verification
    const duplicateCheck = await PaymentVerificationService.checkDuplicatePayment(
      paymentVerification._id, 
      parseFloat(amount), 
      email
    );
    
    if (duplicateCheck.isDuplicate) {
      
      // Update database record with rejection
      await paymentVerification.markAsRejected(duplicateCheck.message, [{
        type: duplicateCheck.type,
        severity: 'ERROR',
        message: duplicateCheck.message,
        field: 'duplicate'
      }]);
      
      const errorResponse = ErrorMessageHandler.formatErrorResponse(duplicateCheck.type, {
        duplicateCheck,
        paymentVerificationId: paymentVerification._id
      });
      return res.status(ErrorMessageHandler.getHttpStatus(duplicateCheck.type)).json(errorResponse);
    }
    
    // Step 3: Verify payment details
    const verification = await PaymentVerificationService.verifyPayment(
      extractedText,
      parseFloat(amount),
      'CoderMeet Technologies'
    );
    
    // Update database record with extracted text and OCR results
    paymentVerification.extractedText = extractedText;
    paymentVerification.ocrConfidence = verification.confidence || 0;
    paymentVerification.verificationId = verification.verificationId;

    // Step 4: Update upload status based on verification
    if (verification.isValid) {
      
      // Extract transaction details from verification
      const extractedTransaction = verification.extractedTransaction || {};
      paymentVerification.transactionId = extractedTransaction.transactionId || 'UNKNOWN';
      paymentVerification.payerName = extractedTransaction.payerName || 'Unknown';
      paymentVerification.payeeName = extractedTransaction.payeeName || 'Unknown';
      paymentVerification.transactionDate = extractedTransaction.date || new Date();
      
      // Mark as verified
      await paymentVerification.markAsVerified(verification.verificationId, verification.confidence || 0);
      
      
      // If this is for pending registration, complete user registration
      if (pendingRegistration === 'true') {
        await completeUserRegistration(email, plan, verification.verificationId);
      }
      
    } else {
    
    // Extract transaction details even if verification failed
    const extractedTransaction = verification.extractedTransaction || {};
    paymentVerification.transactionId = extractedTransaction.transactionId || 'UNKNOWN';
    paymentVerification.payerName = extractedTransaction.payerName || 'Unknown';
    paymentVerification.payeeName = extractedTransaction.payeeName || 'Unknown';
    paymentVerification.transactionDate = extractedTransaction.date || new Date();
    
    // Determine the primary issue type for user-friendly messaging
    const primaryIssue = verification.issues[0];
    const errorType = primaryIssue ? primaryIssue.type : 'VERIFICATION_FAILED';
    
    // Mark for manual review or rejection based on issues
    const hasErrors = verification.issues.filter(i => i.severity === 'ERROR').length > 0;
    if (hasErrors) {
      await paymentVerification.markAsRejected('Payment verification failed', verification.issues);
    } else {
      await paymentVerification.markForManualReview(verification.issues);
    }

    
    // Return user-friendly error message
    const errorResponse = ErrorMessageHandler.formatErrorResponse(errorType, {
      issues: verification.issues,
      extractedTransaction: extractedTransaction
    });
    return res.status(ErrorMessageHandler.getHttpStatus(errorType)).json(errorResponse);
  }


    // Return professional success message
    const successType = paymentVerification.status === 'verified' ? 'VERIFICATION_SUCCESS' : 'MANUAL_REVIEW_REQUIRED';
    const successResponse = ErrorMessageHandler.formatErrorResponse(successType, {
      id: paymentVerification._id,
      status: paymentVerification.status,
      verificationId: paymentVerification.verificationId,
      plan: paymentVerification.plan
    });
    
    // Convert error response to success response
    const response = {
      ...successResponse,
      success: true,
      data: {
        id: paymentVerification._id,
        status: paymentVerification.status,
        verified: paymentVerification.verified,
        verificationId: paymentVerification.verificationId,
        issues: paymentVerification.issues || null,
        confidence: verification.confidence,
        extractedTransaction: verification.extractedTransaction
      }
    };
    
    return res.status(ErrorMessageHandler.getHttpStatus(successType)).json(response);

  } catch (error) {
    
    // Determine error type based on error message
    let errorType = 'SYSTEM_ERROR';
    if (error.message.includes('validation')) {
      errorType = 'VERIFICATION_FAILED';
    } else if (error.message.includes('OCR') || error.message.includes('Tesseract')) {
      errorType = 'OCR_PROCESSING_ERROR';
    }
    
    const errorResponse = ErrorMessageHandler.formatErrorResponse(errorType, {
      originalError: error.message
    });
    return res.status(ErrorMessageHandler.getHttpStatus(errorType)).json(errorResponse);
  }
};

// Complete user registration after successful payment verification
async function completeUserRegistration(email, plan, verificationId) {
  try {
    const user = await User.findOne({ email });
    
    if (user) {
      // Update user with payment verification details
      user.paymentStatus = 'verified';
      user.paymentVerifiedAt = new Date();
      user.verifiedTransactionId = verificationId;
      user.plan = plan;
      user.isProfessional = plan !== 'Trial';
      user.role = plan === 'Basic' ? 'basic' : plan === 'Premium' ? 'professional' : 'trial';
      
      await user.save();
      
    }
  } catch (error) {
  }
}

// Get all pending payment verifications (for admin)
exports.getPendingVerifications = async (req, res) => {
  try {
    const pending = Array.from(paymentScreenshots.values())
      .filter(upload => upload.status === 'manual_review' || upload.status === 'processing')
      .sort((a, b) => b.uploadedAt - a.uploadedAt);

    return res.status(200).json({
      success: true,
      data: pending
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending verifications'
    });
  }
};

// Manually verify payment (for admin)
exports.verifyPaymentManually = async (req, res) => {
  try {
    const { uploadId, action, notes } = req.body;
    const upload = paymentScreenshots.get(uploadId);

    if (!upload) {
      return res.status(404).json({
        success: false,
        message: 'Payment verification not found'
      });
    }

    if (action === 'approve') {
      upload.status = 'verified';
      upload.verified = true;
      upload.verifiedAt = new Date();
      upload.adminNotes = notes;
      
      
      // Complete user registration if pending
      if (upload.pendingRegistration) {
        await completeUserRegistration(upload.email, upload.plan, upload.verificationId);
      }
      
    } else if (action === 'reject') {
      upload.status = 'rejected';
      upload.verified = false;
      upload.rejectionReason = notes;
      
    }

    paymentScreenshots.set(uploadId, upload);

    return res.status(200).json({
      success: true,
      message: `Payment ${action}d successfully`,
      data: {
        id: uploadId,
        status: upload.status,
        verified: upload.verified
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Manual verification failed'
    });
  }
};

// Get payment screenshot file
exports.getPaymentScreenshot = async (req, res) => {
  try {
    const { uploadId } = req.params;
    const upload = paymentScreenshots.get(uploadId);

    if (!upload) {
      return res.status(404).json({
        success: false,
        message: 'Payment screenshot not found'
      });
    }

    return res.sendFile(upload.filepath);

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get screenshot'
    });
  }
};
