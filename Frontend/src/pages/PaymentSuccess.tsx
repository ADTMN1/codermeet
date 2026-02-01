import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import axios from 'axios';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Success state when payment is completed
  const [showSuccess, setShowSuccess] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');

  // Update success state when loading completes
  useEffect(() => {
    if (!loading && !error) {
      const tx_ref = searchParams.get('tx_ref');
      setTransactionId(tx_ref || '');
      
      // Get plan from localStorage or URL
      const pendingData = localStorage.getItem('pending_registration');
      if (pendingData) {
        try {
          const { formData } = JSON.parse(pendingData);
          setUserPlan(formData.plan || 'premium');
        } catch (e) {
          setUserPlan('premium');
        }
      }
      setShowSuccess(true);
    }
  }, [loading, error, searchParams]);

  useEffect(() => {
    let isMounted = true;
    
    const handlePaymentSuccess = async () => {
      const tx_ref = searchParams.get('tx_ref');
      
      if (!tx_ref) {
        if (isMounted) setError('Transaction reference not found');
        if (isMounted) setLoading(false);
        return;
      }

      let formData: any = null;
      let API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      try {
        // Get pending registration data
        const pendingData = localStorage.getItem('pending_registration');
        if (!pendingData) {
          if (isMounted) setError('No pending registration found');
          if (isMounted) setLoading(false);
          return;
        }

        const parsedData = JSON.parse(pendingData);
        formData = parsedData.formData;
        const paymentTxRef = parsedData.paymentTxRef;
        
        if (paymentTxRef !== tx_ref) {
          if (isMounted) setError('Invalid transaction reference');
          if (isMounted) setLoading(false);
          return;
        }

        // Verify payment with backend
        const verifyRes = await axios.get(
          `${API_BASE_URL}/api/payment/verify?tx_ref=${tx_ref}`
        );

        if (verifyRes.data.success && isMounted) {
          // Payment verified, now complete registration
          const payload = {
            fullName: formData.fullName,
            username: formData.username,
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            primaryLanguage: formData.primaryLanguage,
            skills: formData.skills,
            githubUrl: formData.github,
            bio: formData.bio,
            plan: formData.plan.charAt(0).toUpperCase() + formData.plan.slice(1),
          };

          const registerRes = await axios.post(
            `${API_BASE_URL}/api/auth/register`,
            payload,
            {
              headers: {
                'Content-Type': 'application/json',
              }
            }
          );

          // Set authentication token
          if (registerRes.data.token && isMounted) {
            localStorage.setItem('auth_token', registerRes.data.token);
          }

          // Set user data in context
          if (registerRes.data.user && isMounted) {
            setUser({
              _id: registerRes.data.user.id,
              name: registerRes.data.user.fullName || formData.fullName,
              fullName: registerRes.data.user.fullName || formData.fullName,
              email: registerRes.data.user.email,
              username: registerRes.data.user.username,
              plan: formData.plan.toLowerCase(),
              bio: registerRes.data.user.bio || formData.bio,
              skills: registerRes.data.user.skills || formData.skills,
              github: registerRes.data.user.github || formData.github,
              points: 0,
              role: registerRes.data.user.role,
              isProfessional: registerRes.data.user.isProfessional,
            });
          }

          // Clear pending registration
          if (isMounted) {
            localStorage.removeItem('pending_registration');
          }

          // Show success message instead of immediate redirect
          if (isMounted) {
            setLoading(false);
          }

        } else if (isMounted) {
          setError('Payment verification failed');
        }

      } catch (error: any) {
        if (!isMounted) return;
        
        if (error.response?.status === 400) {
          // User might already exist, try to log them in instead
          try {
            const loginRes = await axios.post(
              `${API_BASE_URL}/api/auth/login`,
              {
                email: formData.email,
                password: formData.password
              },
              {
                timeout: 10000,
                headers: { 'Content-Type': 'application/json' },
              }
            );

            if (loginRes.data.success && isMounted) {
              // Set authentication token
              if (loginRes.data.token) {
                localStorage.setItem('auth_token', loginRes.data.token);
              }

              // Set user data in context
              if (loginRes.data.user) {
                setUser({
                  _id: loginRes.data.user.id,
                  name: loginRes.data.user.fullName || formData.fullName,
                  fullName: loginRes.data.user.fullName || formData.fullName,
                  email: loginRes.data.user.email,
                  username: loginRes.data.user.username,
                  plan: formData.plan.toLowerCase(),
                  bio: loginRes.data.user.bio || formData.bio,
                  skills: loginRes.data.user.skills || formData.skills,
                  github: loginRes.data.user.github || formData.github,
                  points: 0,
                  role: loginRes.data.user.role,
                  isProfessional: loginRes.data.user.isProfessional,
                });
              }

              // Clear pending registration
              localStorage.removeItem('pending_registration');

              // Show success message instead of immediate redirect
              if (isMounted) {
                setLoading(false);
              }
              return;
            }
          } catch (loginError) {
            // Login also failed
          }
        }
        
        setError('Failed to verify payment: ' + (error.response?.data?.message || error.message));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    handlePaymentSuccess();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [searchParams, navigate, setUser]);

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-blue-900 flex items-center justify-center">
        <div className="max-w-2xl w-full mx-4">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
              <p className="text-green-100">Your subscription has been activated</p>
            </div>

            {/* Receipt */}
            <div className="p-8">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Receipt</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-sm">{transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-semibold capitalize">{userPlan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-green-600 font-semibold">✓ Completed</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span>Chapa Secure Payment</span>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Account Information</h3>
                <p className="text-sm text-gray-600">Your {userPlan} plan is now active. You can access all premium features.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Print Receipt
                </button>
              </div>

              {/* Security Note */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  🔒 Secured by Chapa | Payment processed successfully
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <h2 className="text-white text-xl">Verifying your payment...</h2>
          <p className="text-gray-400 mt-2">Please wait while we complete your registration</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-6">
            <h2 className="text-red-400 text-xl mb-2">Payment Error</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={() => navigate('/signup')}
              className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition"
            >
              Back to Signup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-8">
          <div className="text-green-400 text-6xl mb-4">✓</div>
          <h2 className="text-white text-2xl mb-2">Payment Successful!</h2>
          <p className="text-gray-300">Redirecting to your dashboard...</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
