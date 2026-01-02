// components/Signup/Step1Account.tsx
import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaUser, FaAt, FaEnvelope, FaLock, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { FormData } from './types';

interface Props {
  formData: FormData;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  errors: { [key: string]: string };
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (v: boolean) => void;
}

const Step1Account: React.FC<Props> = ({
  formData,
  handleChange,
  errors,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}) => {
  const [isFocused, setIsFocused] = useState<string>('');

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-purple-400 mb-2">Create Your Account</h2>
        <p className="text-gray-400">Join our community of developers</p>
      </div>
      <div>
        <div className="relative">
          <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            onFocus={() => setIsFocused('fullName')}
            onBlur={() => setIsFocused('')}
            className={`w-full pl-12 pr-3 py-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 transition-all duration-300 ${
              isFocused === 'fullName' ? 'focus:ring-purple-400 shadow-lg shadow-purple-500/20' : 'focus:ring-purple-400'
            }`}
            required
            maxLength={100}
          />
          {formData.fullName && !errors.fullName && (
            <FaCheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 text-xl" />
          )}
        </div>
        {errors.fullName && (
          <p className="text-red-500 text-sm mt-1 animate-pulse flex items-center gap-1">
            <FaExclamationCircle className="text-xs" />
            {errors.fullName}
          </p>
        )}
      </div>

      <div>
        <div className="relative">
          <FaAt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            name="username"
            placeholder="Username (@handle)"
            value={formData.username}
            onChange={handleChange}
            onFocus={() => setIsFocused('username')}
            onBlur={() => setIsFocused('')}
            className={`w-full pl-12 pr-3 py-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 transition-all duration-300 ${
              isFocused === 'username' ? 'focus:ring-purple-400 shadow-lg shadow-purple-500/20' : 'focus:ring-purple-400'
            }`}
            required
            maxLength={50}
            pattern="[a-zA-Z0-9_]+"
            title="Username can only contain letters, numbers, and underscores"
          />
          {formData.username && !errors.username && (
            <FaCheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 text-xl" />
          )}
        </div>
        {errors.username && (
          <p className="text-red-500 text-sm mt-1 animate-pulse flex items-center gap-1">
            <FaExclamationCircle className="text-xs" />
            {errors.username}
          </p>
        )}
      </div>

      <div>
        <div className="relative">
          <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            onFocus={() => setIsFocused('email')}
            onBlur={() => setIsFocused('')}
            className={`w-full pl-12 pr-3 py-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 transition-all duration-300 ${
              isFocused === 'email' ? 'focus:ring-purple-400 shadow-lg shadow-purple-500/20' : 'focus:ring-purple-400'
            }`}
            required
            maxLength={255}
          />
          {formData.email && !errors.email && (
            <FaCheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 text-xl" />
          )}
        </div>
        {errors.email && (
          <p className="text-red-500 text-sm mt-1 animate-pulse flex items-center gap-1">
            <FaExclamationCircle className="text-xs" />
            {errors.email}
          </p>
        )}
      </div>

      <div className="relative">
        <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
        <input
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          onFocus={() => setIsFocused('password')}
          onBlur={() => setIsFocused('')}
          className={`w-full pl-12 pr-12 py-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 transition-all duration-300 ${
            isFocused === 'password' ? 'focus:ring-purple-400 shadow-lg shadow-purple-500/20' : 'focus:ring-purple-400'
          }`}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer transition-colors duration-200"
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
        {errors.password && (
          <p className="text-red-500 text-sm mt-1 animate-pulse flex items-center gap-1">
            <FaExclamationCircle className="text-xs" />
            {errors.password}
          </p>
        )}
      </div>

      <div className="relative">
        <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
        <input
          type={showConfirmPassword ? 'text' : 'password'}
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          onFocus={() => setIsFocused('confirmPassword')}
          onBlur={() => setIsFocused('')}
          className={`w-full pl-12 pr-12 py-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 transition-all duration-300 ${
            isFocused === 'confirmPassword' ? 'focus:ring-purple-400 shadow-lg shadow-purple-500/20' : 'focus:ring-purple-400'
          }`}
          required
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer transition-colors duration-200"
        >
          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
        {formData.confirmPassword && !errors.confirmPassword && formData.password === formData.confirmPassword && (
          <FaCheckCircle className="absolute right-12 top-1/2 transform -translate-y-1/2 text-green-400 text-xl" />
        )}
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1 animate-pulse flex items-center gap-1">
            <FaExclamationCircle className="text-xs" />
            {errors.confirmPassword}
          </p>
        )}
      </div>
    </div>
  );
};

export default Step1Account;
