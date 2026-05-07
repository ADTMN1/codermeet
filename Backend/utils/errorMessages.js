// Professional error message handler for payment verification
class ErrorMessageHandler {
  static getPaymentVerificationMessage(errorType, details = {}) {
    const messages = {
      // File upload errors
      'INVALID_FILE_TYPE': {
        title: 'Invalid File Format',
        message: 'Please upload a valid payment screenshot in JPEG, PNG, or WebP format.',
        suggestion: 'Take a clear screenshot of your payment confirmation and try again.',
        action: 'Choose File'
      },
      'FILE_TOO_LARGE': {
        title: 'File Too Large',
        message: `Your file is too large. Please upload a file smaller than 5MB.`,
        suggestion: 'Compress your image or take a new screenshot with better quality settings.',
        action: 'Upload Smaller File'
      },
      'NO_FILE_UPLOADED': {
        title: 'Payment Screenshot Required',
        message: 'Please upload a screenshot of your payment confirmation to verify your account.',
        suggestion: 'Take a clear screenshot showing your transaction details and amount.',
        action: 'Upload Screenshot'
      },

      // Duplicate detection errors
      'DUPLICATE_SCREENSHOT': {
        title: 'Screenshot Already Used',
        message: 'This payment screenshot has already been used for account verification.',
        suggestion: 'Please use a different payment screenshot or contact support if you believe this is an error.',
        action: 'Use Different Screenshot'
      },
      'DUPLICATE_TRANSACTION_ID': {
        title: 'Transaction Already Used',
        message: 'This transaction ID has already been used for another account verification.',
        suggestion: 'Please use a different transaction ID or contact support if you believe this is an error.',
        action: 'Use Different Transaction'
      },
      'DUPLICATE_AMOUNT': {
        title: 'Recent Payment Detected',
        message: 'A payment with this amount was recently processed. Please wait before submitting another payment.',
        suggestion: 'Wait a few hours before trying again, or use a different payment method.',
        action: 'Try Again Later'
      },
      'SAME_USER_MULTIPLE_PAYMENTS': {
        title: 'Multiple Payments Detected',
        message: 'You have already made multiple payment verification attempts today.',
        suggestion: 'Please contact our support team for assistance with your account verification.',
        action: 'Contact Support'
      },

      // Payment verification errors
      'AMOUNT_MISMATCH': {
        title: 'Amount Mismatch',
        message: `The payment amount (${details.expectedAmount} ETB) doesn't match the selected plan.`,
        suggestion: 'Please ensure you paid the correct amount for your selected plan, or choose the appropriate plan.',
        action: 'Check Payment Amount'
      },
      'RECIPIENT_MISMATCH': {
        title: 'Payment Recipient Issue',
        message: 'The payment recipient does not match our expected payment processor.',
        suggestion: 'Please ensure you sent payment to the correct recipient account.',
        action: 'Verify Payment Details'
      },
      'INVALID_TRANSACTION_ID': {
        title: 'Invalid Transaction Format',
        message: 'The transaction ID format could not be properly validated.',
        suggestion: 'Please ensure your screenshot clearly shows a valid transaction ID.',
        action: 'Upload Clearer Screenshot'
      },
      'OLD_TRANSACTION': {
        title: 'Old Transaction',
        message: 'This transaction appears to be too old for verification.',
        suggestion: 'Please use a recent payment (within the last 30 days) for account verification.',
        action: 'Use Recent Payment'
      },
      'LOW_CONFIDENCE': {
        title: 'Unclear Payment Details',
        message: 'We couldn\'t clearly read all payment details from your screenshot.',
        suggestion: 'Please upload a clearer, higher-quality screenshot of your payment confirmation.',
        action: 'Upload Clearer Screenshot'
      },
      'MISSING_TRANSACTION_ID': {
        title: 'Transaction ID Missing',
        message: 'We couldn\'t find a transaction ID in your payment screenshot.',
        suggestion: 'Please ensure your screenshot clearly shows the transaction ID.',
        action: 'Upload Complete Screenshot'
      },
      'MISSING_AMOUNT': {
        title: 'Payment Amount Missing',
        message: 'We couldn\'t find the payment amount in your screenshot.',
        suggestion: 'Please ensure your screenshot clearly shows the payment amount.',
        action: 'Upload Complete Screenshot'
      },
      'CORRUPTED_IMAGE': {
        title: 'Image Quality Issue',
        message: 'The uploaded image appears to be corrupted or of poor quality.',
        suggestion: 'Please take a new, clear screenshot of your payment confirmation.',
        action: 'Upload New Screenshot'
      },
      'TEXT_EXTRACTION_FAILED': {
        title: 'Payment Details Not Readable',
        message: 'We couldn\'t extract payment details from your screenshot.',
        suggestion: 'Please ensure your screenshot is clear, well-lit, and shows all payment information.',
        action: 'Upload Better Quality Image'
      },

      // Rate limiting errors
      'PAYMENT_UPLOAD_RATE_LIMIT_EXCEEDED': {
        title: 'Too Many Upload Attempts',
        message: 'You have reached the maximum number of payment upload attempts. Please try again later.',
        suggestion: 'For security reasons, we limit payment verification attempts. Please wait before trying again.',
        action: 'Try Again Later'
      },
      'RATE_LIMIT_EXCEEDED': {
        title: 'Request Limit Reached',
        message: 'You have made too many requests. Please wait a moment before trying again.',
        suggestion: 'To protect our system, we limit the number of requests. Please try again in a few minutes.',
        action: 'Wait and Retry'
      },

      // Input validation errors
      'INVALID_EMAIL': {
        title: 'Invalid Email Address',
        message: 'Please provide a valid email address for your account.',
        suggestion: 'Enter a correct email address (e.g., user@example.com).',
        action: 'Update Email'
      },
      'INVALID_PLAN': {
        title: 'Invalid Plan Selection',
        message: 'Please select a valid subscription plan.',
        suggestion: 'Choose from our available plans: Trial, Basic, or Premium.',
        action: 'Select Valid Plan'
      },
      'INVALID_AMOUNT': {
        title: 'Invalid Amount',
        message: 'Please provide a valid payment amount.',
        suggestion: 'Enter a positive number for the payment amount.',
        action: 'Enter Valid Amount'
      },

      // General system errors
      'VERIFICATION_FAILED': {
        title: 'Payment Verification Failed',
        message: 'We couldn\'t verify your payment automatically. Your payment will be reviewed manually.',
        suggestion: 'Our team will review your payment within 24 hours. You\'ll receive an email with the result.',
        action: 'Wait for Manual Review'
      },
      'SYSTEM_ERROR': {
        title: 'Temporary System Issue',
        message: 'We\'re experiencing a temporary issue with payment verification.',
        suggestion: 'Please try again in a few minutes. If the problem persists, contact our support team.',
        action: 'Try Again Later'
      },
      'OCR_PROCESSING_ERROR': {
        title: 'Payment Processing Issue',
        message: 'We encountered an issue processing your payment screenshot.',
        suggestion: 'Please try uploading your screenshot again, or contact support if the problem continues.',
        action: 'Retry Upload'
      },

      // Success messages
      'VERIFICATION_SUCCESS': {
        title: 'Payment Verified Successfully',
        message: 'Your payment has been verified and your account is now active!',
        suggestion: 'You can now access all features of your selected plan.',
        action: 'Continue to Dashboard'
      },
      'MANUAL_REVIEW_REQUIRED': {
        title: 'Payment Submitted for Review',
        message: 'Your payment has been submitted and is being reviewed by our team.',
        suggestion: 'You\'ll receive an email within 24 hours once the review is complete.',
        action: 'Check Email Later'
      }
    };

    return messages[errorType] || messages['SYSTEM_ERROR'];
  }

  static formatErrorResponse(errorType, details = {}) {
    const messageData = this.getPaymentVerificationMessage(errorType, details);
    
    return {
      success: false,
      error: errorType,
      userMessage: {
        title: messageData.title,
        message: messageData.message,
        suggestion: messageData.suggestion,
        action: messageData.action,
        severity: this.getErrorSeverity(errorType),
        timestamp: new Date().toISOString()
      },
      // Keep technical details for debugging (but don't expose to users)
      debug: {
        errorType,
        details,
        timestamp: new Date().toISOString()
      }
    };
  }

  static getErrorSeverity(errorType) {
    const severityMap = {
      // Critical errors that prevent completion
      'NO_FILE_UPLOADED': 'error',
      'INVALID_FILE_TYPE': 'error',
      'FILE_TOO_LARGE': 'error',
      'DUPLICATE_SCREENSHOT': 'error',
      'DUPLICATE_TRANSACTION_ID': 'error',
      'SYSTEM_ERROR': 'error',

      // Warning issues that need user attention
      'AMOUNT_MISMATCH': 'warning',
      'RECIPIENT_MISMATCH': 'warning',
      'LOW_CONFIDENCE': 'warning',
      'INVALID_TRANSACTION_ID': 'warning',
      'OLD_TRANSACTION': 'warning',
      'MISSING_TRANSACTION_ID': 'warning',
      'MISSING_AMOUNT': 'warning',
      'CORRUPTED_IMAGE': 'warning',
      'TEXT_EXTRACTION_FAILED': 'warning',

      // Rate limiting (temporary issues)
      'PAYMENT_UPLOAD_RATE_LIMIT_EXCEEDED': 'warning',
      'RATE_LIMIT_EXCEEDED': 'warning',
      'DUPLICATE_AMOUNT': 'warning',
      'SAME_USER_MULTIPLE_PAYMENTS': 'warning',

      // Input validation (user errors)
      'INVALID_EMAIL': 'info',
      'INVALID_PLAN': 'info',
      'INVALID_AMOUNT': 'info',

      // Processing states
      'VERIFICATION_FAILED': 'warning',
      'OCR_PROCESSING_ERROR': 'warning',
      'VERIFICATION_SUCCESS': 'success',
      'MANUAL_REVIEW_REQUIRED': 'info'
    };

    return severityMap[errorType] || 'error';
  }

  // Helper method to get appropriate HTTP status code
  static getHttpStatus(errorType) {
    const statusMap = {
      // Client errors (4xx)
      'NO_FILE_UPLOADED': 400,
      'INVALID_FILE_TYPE': 400,
      'FILE_TOO_LARGE': 400,
      'DUPLICATE_SCREENSHOT': 400,
      'DUPLICATE_TRANSACTION_ID': 400,
      'INVALID_EMAIL': 400,
      'INVALID_PLAN': 400,
      'INVALID_AMOUNT': 400,
      'PAYMENT_UPLOAD_RATE_LIMIT_EXCEEDED': 429,
      'RATE_LIMIT_EXCEEDED': 429,
      'DUPLICATE_AMOUNT': 400,
      'SAME_USER_MULTIPLE_PAYMENTS': 400,

      // Server errors (5xx)
      'SYSTEM_ERROR': 500,
      'OCR_PROCESSING_ERROR': 500,
      'VERIFICATION_FAILED': 500,
      'TEXT_EXTRACTION_FAILED': 500,

      // Success codes
      'VERIFICATION_SUCCESS': 200,
      'MANUAL_REVIEW_REQUIRED': 202 // Accepted
    };

    return statusMap[errorType] || 500;
  }
}

module.exports = ErrorMessageHandler;
