// components/Signup/Step4Payment.tsx
import React, { useState, useRef } from 'react';
import { FaUpload, FaCheckCircle, FaExclamationTriangle, FaEye, FaTrash, FaMobileAlt, FaSpinner, FaClock, FaSearch } from 'react-icons/fa';
import { type FormData } from './types';
import OCRService from '../../../services/ocrService';
import { useUser } from '../../../context/UserContext';
import { useNavigate } from 'react-router-dom';

interface Props {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: { [key: string]: string };
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  onClearPaymentError?: () => void;
}

const Step4Payment: React.FC<Props> = ({ formData, setFormData, errors, setErrors, onClearPaymentError }) => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  
  // OCR and verification states
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing' | 'extracted' | 'failed'>('idle');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'checking' | 'verified' | 'failed'>('idle');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [verificationError, setVerificationError] = useState<string>('');
  const [verificationProgress, setVerificationProgress] = useState<string>('');

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset all states
    setUploadError('');
    setVerificationError('');
    setOcrStatus('idle');
    setVerificationStatus('idle');
    setExtractedData(null);
    
    // Clear payment screenshot validation error when file is selected
    if (errors?.paymentScreenshot && onClearPaymentError) {
      onClearPaymentError();
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file (PNG, JPG, JPEG)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setUploadStatus('uploading');
    setUploadError('');

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = async () => {
        const screenshotData = reader.result as string;
        setScreenshotPreview(screenshotData);
        setUploadStatus('success');
        
        // Store screenshot data in formData
        setFormData({
          ...formData,
          paymentScreenshot: screenshotData,
          screenshotFileName: file.name
        });

        // Start OCR processing
        await processOCR(file);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadStatus('error');
      setUploadError('Failed to upload screenshot. Please try again.');
    }
  };

  const processOCR = async (file: File) => {
    setOcrStatus('processing');
    setVerificationProgress('Extracting transaction details from screenshot...');

    try {
      const ocrService = OCRService.getInstance();
      const result = await ocrService.extractTransactionInfo(file);
      
      console.log('🔍 [FRONTEND DEBUG] OCR completed, storing screenshot data');
      
      // Store screenshot data immediately
      const reader = new FileReader();
      reader.onloadend = async () => {
        const screenshotData = reader.result as string;
        setFormData({
          ...formData,
          paymentScreenshot: screenshotData,
          screenshotFileName: file.name
        });
        
        console.log('🔍 [FRONTEND DEBUG] Screenshot data stored, length:', screenshotData.length);
        
        setExtractedData(result);
        setOcrStatus('extracted');
        setVerificationProgress('Transaction details extracted successfully!');

        // Auto-start verification if transaction ID was extracted
        if (result.transactionId) {
          await verifyTransaction(result.transactionId, result, screenshotData, file.name);
        } else {
          setVerificationError('Could not extract transaction ID from the screenshot. Please ensure the screenshot clearly shows the transaction details.');
          setOcrStatus('failed');
        }
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
            setOcrStatus('failed');
      setVerificationError('Failed to extract transaction details. Please ensure the screenshot is clear and contains transaction information.');
    }
  };

  const verifyTransaction = async (transactionId: string, ocrResult: any, screenshotData?: string, fileName?: string) => {
    setVerificationStatus('checking');
    setVerificationProgress('Verifying transaction with payment system...');

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Use new payment verification endpoint
      const endpoint = '/screenshots/verify';
      
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      
      // Enhanced debugging for frontend
      console.log('🔍 [FRONTEND DEBUG] Starting payment verification:', {
        transactionId,
        plan: formData.plan,
        amount: ocrResult.amount,
        endpoint: fullUrl,
        timestamp: new Date().toISOString()
      });
      
      // Create FormData to send screenshot as file
      const formDataToSend = new FormData();
      formDataToSend.append('transactionId', transactionId);
      formDataToSend.append('plan', formData.plan);
      formDataToSend.append('amount', ocrResult.amount || (formData.plan === 'trial' ? 0 : formData.plan === 'basic' ? 1 : 599));
      
      // Use the passed screenshotData parameter instead of formData state
      const screenshotToUse = screenshotData || formData.paymentScreenshot;
      const fileNameToUse = fileName || formData.screenshotFileName;
      
      console.log('🔍 [FRONTEND DEBUG] Screenshot data check:', {
        hasPaymentScreenshot: !!screenshotToUse,
        screenshotLength: screenshotToUse ? screenshotToUse.length : 0,
        screenshotPreview: screenshotToUse ? screenshotToUse.substring(0, 100) : 'none',
        screenshotFileName: fileNameToUse,
        timestamp: new Date().toISOString()
      });
      
      // Convert base64 to Blob and append as file
      if (screenshotToUse) {
        try {
          const base64Data = screenshotToUse.split(',')[1];
          console.log('🔍 [FRONTEND DEBUG] Base64 data length:', base64Data.length);
          const binaryData = atob(base64Data);
          const bytes = new Uint8Array(binaryData.length);
          for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'image/jpeg' });
          console.log('🔍 [FRONTEND DEBUG] Blob created:', {
            size: blob.size,
            type: blob.type
          });
          formDataToSend.append('screenshot', blob, fileNameToUse || 'screenshot.jpg');
          console.log('🔍 [FRONTEND DEBUG] Screenshot appended to FormData');
        } catch (error) {
          console.error('❌ [FRONTEND DEBUG] Error converting base64 to blob:', error);
        }
      } else {
        console.error('❌ [FRONTEND DEBUG] No payment screenshot data available');
      }
      
      // Debug FormData contents
      console.log('🔍 [FRONTEND DEBUG] FormData contents before sending:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File: ${value.name}, size: ${value.size}` : value);
      }
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        body: formDataToSend
      });

      console.log('🔍 [FRONTEND DEBUG] API response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ [FRONTEND DEBUG] API response error:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          timestamp: new Date().toISOString()
        });
                
        // Try to parse professional error message from backend
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorDetails = '';
        
        try {
          const errorData = JSON.parse(errorText);
          console.log('🔍 [FRONTEND DEBUG] Parsed error response:', errorData);
          
          // Check for new professional error message format
          if (errorData.userMessage) {
            const userMessage = errorData.userMessage;
            errorMessage = userMessage.title;
            errorDetails = `${userMessage.message}\n\n💡 ${userMessage.suggestion}\n\n ${userMessage.action}`;
            
     
          } else if (errorData.message) {
            // Fallback to old format for compatibility
            errorMessage = errorData.message;
            
            // Add user-friendly guidance based on error type
            if (errorData.type === 'DUPLICATE_TRANSACTION_ID') {
              errorDetails = '💡 Please use a different transaction ID from your payment receipt.';
            } else if (errorData.type === 'DUPLICATE_AMOUNT') {
              errorDetails = '💡 Please wait 24 hours before submitting another payment with the same amount.';
            } else if (errorData.type === 'SAME_USER_MULTIPLE_PAYMENTS') {
              errorDetails = '💡 Please contact support if you believe this is an error.';
            } else if (response.status === 400) {
              errorDetails = '💡 Please ensure your payment details match exactly what\'s on your receipt.';
            } else if (response.status === 404) {
              errorDetails = '💡 Please check your payment details and try again.';
            }
          }
          
          if (errorData.debug) {
            console.log('🔍 [FRONTEND DEBUG] Backend debug info:', errorData.debug);
          }
        } catch (parseError: any) {
          console.log('❌ [FRONTEND DEBUG] Failed to parse error response:', parseError.message);
        }
        
        throw new Error(errorMessage + (errorDetails ? `\n\n${errorDetails}` : ''));
      }

      const result = await response.json();

      if (result.success) {
        setVerificationStatus('verified');
        
        // Use professional success message if available
        let successMessage = 'Payment verified successfully! Please complete your registration to continue.';
        if (result.userMessage) {
          successMessage = `${result.userMessage.title}\n\n${result.userMessage.message}\n\n💡 ${result.userMessage.suggestion}`;
        }
        
        setVerificationProgress(successMessage);
        
        // Store payment verification result for use during registration
        localStorage.setItem('payment_verified', JSON.stringify({
          verified: true,
          verificationId: result.data?.verificationId || result.verificationId,
          plan: formData.plan,
          amount: ocrResult.amount || (formData.plan === 'trial' ? 0 : formData.plan === 'basic' ? 1 : 599),
          timestamp: new Date().toISOString(),
          status: result.data?.status || 'verified'
        }));
      } else {
        throw new Error(result.message || 'Payment verification failed');
      }

    } catch (error) {
            setVerificationStatus('failed');
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during verification. Please try again.';
      setVerificationError(errorMessage);
    }
  };

  const retryVerification = async () => {
    if (extractedData?.transactionId) {
      await verifyTransaction(extractedData.transactionId, extractedData);
    }
  };

  const removeScreenshot = () => {
    setScreenshotPreview(null);
    setUploadStatus('idle');
    setUploadError('');
    // Reset OCR and verification states
    setOcrStatus('idle');
    setVerificationStatus('idle');
    setExtractedData(null);
    setVerificationError('');
    setVerificationProgress('');
    
    setFormData({
      ...formData,
      paymentScreenshot: '',
      screenshotFileName: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getUploadStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent" />;
      case 'success':
        return <FaCheckCircle className="text-green-400" />;
      case 'error':
        return <FaExclamationTriangle className="text-red-400" />;
      default:
        return <FaUpload className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-center text-green-400">
        Payment Information
      </h2>

      {/* Account Information for Payment */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm">
        <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <FaMobileAlt className="text-green-400" />
          Send Payment To This Account
        </h3>
        
        <div className="space-y-3">
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Payment Method:</span>
              <span className="text-white font-medium">CBE</span>
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Account Number:</span>
              <span className="text-white font-medium text-lg">1000516323381</span>
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Account Name:</span>
              <span className="text-white font-medium">CoderMeet Ethiopia</span>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Amount:</span>
              <span className="text-white font-medium text-lg">
                {formData.plan === 'trial' ? '0 Birr' : 
                 formData.plan === 'basic' ? '1 Birr' : 
                 formData.plan === 'premium' ? '599 Birr' : '0 Birr'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Screenshot Upload */}
      <div className="space-y-6">
        <h3 className="text-lg font-mono font-medium text-gray-300">// Upload Payment Screenshot</h3>
        
        <div className="border border-gray-700 rounded-lg p-8 bg-gray-900/50">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleScreenshotUpload}
            className="hidden"
            id="screenshot-upload"
          />
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 border border-gray-600 rounded-lg mb-4">
                <FaUpload className="text-gray-400 text-xl" />
              </div>
            </div>
            
            <label
              htmlFor="screenshot-upload"
              className="cursor-pointer block text-center"
            >
              <div className="inline-flex items-center gap-2 px-6 py-3 border border-gray-600 hover:border-gray-500 rounded-lg transition-colors">
                {getUploadStatusIcon()}
                <span className="font-mono text-sm text-gray-300">
                  {uploadStatus === 'uploading' ? 'processing...' : 
                   uploadStatus === 'success' ? 'uploaded ✓' : 
                   'select file'}
                </span>
              </div>
            </label>
            
            <div className="text-center space-y-1">
              <p className="text-xs font-mono text-gray-500">const fileTypes = ['PNG', 'JPG', 'JPEG'];</p>
              <p className="text-xs font-mono text-gray-500">const maxSize = '5MB';</p>
            </div>
          </div>
        </div>

        {uploadError && (
          <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
            <div className="flex items-start gap-3">
              <span className="text-gray-400 font-mono text-xs mt-1">!</span>
              <div className="flex-1">
                <p className="text-xs font-mono text-gray-400 mb-1">Error:</p>
                <p className="text-xs font-mono text-gray-500">{uploadError}</p>
              </div>
            </div>
          </div>
        )}

        {screenshotPreview && (
          <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-mono text-gray-400">// Screenshot Preview</h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="p-2 text-gray-400 hover:text-gray-300 transition-colors border border-gray-600 hover:border-gray-500 rounded"
                  title="View full size"
                >
                  <FaEye className="text-sm" />
                </button>
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="p-2 text-gray-400 hover:text-gray-300 transition-colors border border-gray-600 hover:border-gray-500 rounded"
                  title="Remove screenshot"
                >
                  <FaTrash className="text-sm" />
                </button>
              </div>
            </div>
            <div className="border border-gray-700 rounded overflow-hidden bg-gray-800">
              <img
                src={screenshotPreview}
                alt="Payment screenshot"
                className="w-full h-auto max-h-80 object-contain"
              />
            </div>
            <p className="text-xs font-mono text-gray-500 mt-2">
              {formData.screenshotFileName || 'screenshot.jpg'}
            </p>
          </div>
        )}

        {errors.paymentScreenshot && (
          <p className="text-red-400 text-sm mt-1">{errors.paymentScreenshot}</p>
        )}

       
        {/* Verification Status */}
        {verificationStatus !== 'idle' && (
          <div className="mt-6">
            <div className={`rounded-xl p-4 border ${
              verificationStatus === 'checking' ? 'bg-blue-900/20 border-blue-500/30' :
              verificationStatus === 'verified' ? 'bg-green-900/20 border-green-500/30' :
              'bg-red-900/20 border-red-500/30'
            }`}>
              <div className="flex items-center gap-3">
                {verificationStatus === 'checking' && <FaSearch className="text-blue-400 animate-pulse" />}
                {verificationStatus === 'verified' && <FaCheckCircle className="text-green-400" />}
                {verificationStatus === 'failed' && <FaExclamationTriangle className="text-red-400" />}
                <div>
                  <h4 className={`font-medium ${
                    verificationStatus === 'checking' ? 'text-blue-400' :
                    verificationStatus === 'verified' ? 'text-green-400' :
                    'text-red-400'
                  }`}>
                    {verificationStatus === 'checking' ? 'Verifying Payment...' :
                     verificationStatus === 'verified' ? 'Payment Verified!' :
                     'Verification Failed'}
                  </h4>
                  <p className="text-sm text-gray-300 mt-1">
                    {verificationProgress || 'Checking transaction with payment system...'}
                  </p>
                </div>
              </div>

              {/* Verification Error with Retry */}
              {verificationStatus === 'failed' && verificationError && (
                <div className="mt-4">
                  <div className="flex items-start gap-2 text-red-400 text-sm">
                    <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                    <span>{verificationError}</span>
                  </div>
                  {extractedData?.transactionId && (
                    <button
                      onClick={retryVerification}
                      className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                    >
                      <FaSearch />
                      Retry Verification
                    </button>
                  )}
                </div>
              )}

              {/* Success Animation */}
              {verificationStatus === 'verified' && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 text-green-400">
                    <FaCheckCircle className="animate-bounce" />
                    <span className="font-medium">Redirecting to dashboard...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Plan Summary */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Selected Plan Summary</h3>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-sm">Plan Type</p>
            <p className="text-white font-medium capitalize text-lg">{formData.plan}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Payment Amount</p>
            <p className="text-green-400 font-bold text-xl">
              {formData.plan === 'trial' ? 'Free' : 
               formData.plan === 'basic' ? '1 Birr' : 
               formData.plan === 'premium' ? '599 Birr' : 'Free'}
            </p>
          </div>
        </div>
      </div>

      {/* Verification Notice */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <FaExclamationTriangle className="text-blue-400 mt-1 flex-shrink-0" />
          <div>
            <h4 className="text-blue-400 font-medium mb-1">Payment Verification</h4>
            <p className="text-sm text-gray-300">
              Please upload a valid payment screenshot. If you upload incorrect screenshots more times, your account may be blocked.
                         </p>
          </div>
        </div>
      </div>

      {/* Screenshot Modal */}
      {showModal && screenshotPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 z-10 p-2 bg-gray-800/90 hover:bg-gray-700 text-gray-300 rounded-md border border-gray-600 transition-all"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Image Container */}
            <div className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden">
              <img
                src={screenshotPreview || ''}
                alt="Payment screenshot"
                className="w-full h-full max-h-[80vh] object-contain"
              />
            </div>
            
            {/* File Name */}
            <div className="bg-gray-900/50 border-t border-gray-800 px-3 py-2">
              <p className="text-xs text-gray-400 font-mono text-center">
                {formData.screenshotFileName || 'screenshot.jpg'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step4Payment;
