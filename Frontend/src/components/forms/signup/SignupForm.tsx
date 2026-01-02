// components/Signup/SignupForm.tsx
import React, { useState, useEffect } from 'react';
import { FaGithub, FaPython, FaJsSquare, FaReact, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaArrowLeft, FaArrowRight, FaCheck } from 'react-icons/fa';
import { IoMdCheckboxOutline } from 'react-icons/io';
import axios from 'axios';
import { useUser } from '../../../context/UserContext';
import { useNavigate } from 'react-router-dom';

import { FormData } from './types';
import {
  validateStep,
  sanitizeInput,
  validatePasswordStrength,
  validateEmail,
  validateGithubUrl,
} from './validation';
import { uploadToCloudinary } from './cloudinary';

import Step1Account from './Step1Account';
import Step2Profile from './Step2Profile';
import Step3Plan from './Step3Plan';
import Step4Payment from './Step4Payment';

const SignupForm: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  const navigate = useNavigate();
  const { setUser } = useUser();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    skills: [],
    primaryLanguage: '',
    github: '',
    bio: '',
    plan: 'trial',
    notifications: true,
    challenges: true,
  });
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
    isVisible: boolean;
  } | null>(null);

  // Enhanced toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Clear errors when step changes
  useEffect(() => {
    setErrors({});
    setApiError('');
  }, [step]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const skillsOptions = [
    'React',
    'Node.js',
    'Python',
    'JavaScript',
    'Tailwind',
    'Docker',
  ];

  // Enhanced handleChange with proper TypeScript typing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const { name, value } = target;
    
    let finalValue: string | boolean | string[];
    
    if ('checked' in target && target.type === 'checkbox') {
      finalValue = target.checked;
    } else if (name === 'skills' && Array.isArray(value)) {
      finalValue = value; // Skills array, no sanitization needed
    } else {
      finalValue = sanitizeInput(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Enhanced file change handler with validation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        paymentProof: 'Please upload a valid image (JPEG, PNG, GIF, WebP)',
      }));
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        paymentProof: 'File size must be less than 10MB',
      }));
      return;
    }

    setPaymentProof(file);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.paymentProof;
      return newErrors;
    });
  };

  const checkExistingUser = async (field: 'email' | 'username', value: string): Promise<boolean> => {
    if (!value.trim()) return false;
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${API_BASE_URL}/api/auth/check-user`, {
        params: { field, value }
      });
      return response.data.exists;
    } catch (error) {
      return false;
    }
  };

  const handleNext = async () => {
    // Clear previous errors first
    setErrors({});
    setApiError('');
    
    // Validate current step only
    const stepErrors = validateStep(formData, step, paymentProof);
    
    // If we're on step 1, check for existing email/username
    if (step === 1) {
      try {
        const [emailExists, usernameExists] = await Promise.all([
          checkExistingUser('email', formData.email),
          checkExistingUser('username', formData.username)
        ]);
        
        if (emailExists || usernameExists) {
          const newErrors = {...stepErrors};
          if (emailExists) newErrors.email = 'This email is already registered';
          if (usernameExists) newErrors.username = 'This username is already taken';
          
          setErrors(newErrors);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      } catch (error) {
        setApiError('Error verifying account details. Please try again.');
        return;
      }
    }
    
    if (Object.keys(stepErrors).length > 0) {
      // Show errors for current step
      setErrors(stepErrors);
      
      // Scroll to top of form to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Clear all errors and proceed to next step
    setErrors({});
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSubmitting(true);
    setApiError('');

    // Validate all steps before final submission
    let allErrors: { [key: string]: string } = {};
    
    // Validate each step
    for (let stepNum = 1; stepNum <= 4; stepNum++) {
      const stepErrors = validateStep(formData, stepNum, paymentProof);
      allErrors = { ...allErrors, ...stepErrors };
    }
    
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setIsLoading(false);
      setIsSubmitting(false);
      
      // Find which step has errors and go back to it
      const errorSteps = [1, 2, 3, 4].filter(stepNum => {
        const stepErrors = validateStep(formData, stepNum, paymentProof);
        return Object.keys(stepErrors).length > 0;
      });
      
      if (errorSteps.length > 0) {
        setStep(errorSteps[0]);
        showToast('Please fix validation errors before submitting', 'error');
      }
      return;
    }

    try {
      // Upload payment proof only on submit if needed
      let paymentScreenshotUrl = '';
      if (formData.plan !== 'trial' && paymentProof) {
        paymentScreenshotUrl = (await uploadToCloudinary(paymentProof)) || '';
        if (!paymentScreenshotUrl) {
          setErrors((prev) => ({
            ...prev,
            paymentProof:
              'Failed to upload payment screenshot. Please try again.',
          }));
          setIsLoading(false);
          return;
        }
      }

      const API_BASE_URL =
        import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
        plan:
          formData.plan === 'trial'
            ? 'Trial'
            : formData.plan === 'basic'
              ? 'Basic'
              : 'Premium',
        paymentScreenshot: paymentScreenshotUrl,
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/auth/register`,
        payload,
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      // Set user data in context
      if (res.data.user) {
        setUser({
          _id: res.data.user._id,
          name: formData.fullName,
          email: formData.email,
          username: formData.username,
          plan: formData.plan.toLowerCase(),
          bio: formData.bio,
          skills: formData.skills,
          github: formData.github,
          points: 0, // Initial points
          // Add other fields as needed
        });
      }

      showToast(res.data.message, 'success');

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const backendError = error.response?.data;
        const errorMessage = backendError?.message || 'Registration failed. Please try again.';
        
        if (error.response?.status === 400 && errorMessage.includes('already exists')) {
          // Handle duplicate user error
          setApiError('An account with this email or username already exists.');
          // Highlight relevant fields
          setErrors(prev => ({
            ...prev,
            email: 'This email is already registered',
            username: 'This username is already taken'
          }));
          // Scroll to the first error
          setTimeout(() => {
            const errorElement = document.querySelector('[name="email"], [name="username"]');
            errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        } else {
          // Handle other errors
          setApiError(errorMessage);
        }
      } else {
        setApiError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-gray-200 flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl bg-black-800 rounded-2xl p-10 shadow-2xl animate-fadeIn"
      >
        {apiError && (
          <p className="text-red-500 text-center mb-4 font-semibold">
            {apiError}
          </p>
        )}

        
        {/* Enhanced Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step >= s
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {step > s ? <FaCheck /> : s}
                </div>
                <span className={`text-xs mt-2 transition-colors duration-300 ${
                  step >= s ? 'text-purple-400' : 'text-gray-500'
                }`}>
                  {s === 1 ? 'Account' : s === 2 ? 'Profile' : s === 3 ? 'Plan' : 'Payment'}
                </span>
              </div>
            ))}
          </div>
          <div className="relative">
            <div className="flex justify-between">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1 mx-1 transition-all duration-500 ${
                    step > s ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-700'
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Steps */}
        {step === 1 && (
          <Step1Account
            formData={formData}
            handleChange={handleChange}
            errors={errors}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
          />
        )}

        {step === 2 && (
          <Step2Profile
            formData={formData}
            handleChange={handleChange}
            errors={errors}
          />
        )}

        {step === 3 && (
          <Step3Plan
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        )}

        {step === 4 && (
          <Step4Payment
            formData={formData}
            handleChange={handleChange}
            handleFileChange={handleFileChange}
            paymentProof={paymentProof}
            errors={errors}
          />
        )}

        {/* Enhanced Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading || isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <FaArrowLeft />
              Back
            </button>
          )}
          <div className="flex-1"></div>
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isLoading || isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading || isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  Next
                  <FaArrowRight />
                </>
              )}
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-bold"
            >
              {isLoading || isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Finish & Join
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Enhanced Toast Notifications */}
      {toast && toast.isVisible && (
        <div
          className={`fixed top-32 right-5 px-6 py-4 rounded-xl shadow-2xl text-white font-semibold transition-all duration-500 transform animate-slideInRight flex items-center gap-3 z-50 max-w-md ${
            toast.type === 'success' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
              : toast.type === 'warning'
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
              : 'bg-gradient-to-r from-red-500 to-pink-500'
          }`}
        >
          {toast.type === 'success' && <FaCheckCircle />}
          {toast.type === 'warning' && <FaExclamationTriangle />}
          {toast.type === 'error' && <FaExclamationTriangle />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl border border-gray-700">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle className="text-white text-3xl" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Welcome to CoderMeet!</h3>
            <p className="text-gray-300 mb-6">Your account has been created successfully. Redirecting to dashboard...</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full animate-progressBar"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignupForm;
