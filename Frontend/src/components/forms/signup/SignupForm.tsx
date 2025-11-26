// components/Signup/SignupForm.tsx
import React, { useState } from 'react';
import { FaGithub, FaPython, FaJsSquare, FaReact } from 'react-icons/fa';
import { IoMdCheckboxOutline } from 'react-icons/io';
import axios from 'axios';
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

  const navigate = useNavigate();
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
    type: 'success' | 'error';
  } | null>(null);

  // keep password visibility toggles here (same as original)
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

  // handleChange preserved from original (sanitization included)
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = e.target;
    const sanitizedValue =
      type === 'checkbox' ? value : sanitizeInput(value as string);

    if (type === 'checkbox' && name === 'skills') {
      const newSkills = checked
        ? [...formData.skills, sanitizedValue]
        : formData.skills.filter((s) => s !== sanitizedValue);
      setFormData({ ...formData, skills: newSkills });
    } else if (type === 'checkbox') {
      // cast name to keyof FormData to satisfy TS - but we know it's notifications or challenges
      setFormData({ ...formData, [name as keyof FormData]: checked as any });
    } else {
      setFormData({
        ...formData,
        [name as keyof FormData]: sanitizedValue as any,
      });
    }

    // Clear the error for the field if it exists
    if ((errors as any)[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete (newErrors as any)[name];
        return newErrors;
      });
    }
  };

  // file validation (does NOT upload here)
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

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        paymentProof: 'File size must be less than 5MB',
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

  const handleNext = () => {
    const stepErrors = validateStep(formData, step, paymentProof);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError('');

    const finalErrors = validateStep(formData, step, paymentProof);
    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      setIsLoading(false);
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

      setToast({ message: res.data.message, type: 'success' });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.log('🔴 FULL ERROR RESPONSE:', error.response?.data);
        console.log('🔴 ERROR STATUS:', error.response?.status);
        const backendError = error.response?.data;
        setApiError(
          backendError?.message
            ? `Error: ${backendError.message}`
            : `Registration failed: ${JSON.stringify(backendError)}`
        );
      } else {
        setApiError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
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

        <h1 className="text-4xl font-bold mb-6 text-purple-400 text-center">
          Join CoderMeet
        </h1>

        {/* Progress Indicator */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 mx-1 rounded-es-sm transition-colors duration-300 ${
                step >= s
                  ? 'bg-gradient-to-r from-pink-200 via-purple-500'
                  : 'bg-gray-700'
              }`}
            ></div>
          ))}
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

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="px-6 py-3 rounded-lg bg-purple-500 hover:bg-purple-400 text-white transition duration-200 ml-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Next'}
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 rounded-lg bg-green-500 hover:bg-green-400 text-white transition duration-200 ml-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Finish & Join'}
            </button>
          )}
        </div>
      </form>

      {toast && (
        <div
          className={`fixed top-5 right-5 px-4 py-2 rounded shadow-lg text-white font-semibold transition-transform duration-300 ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default SignupForm;
