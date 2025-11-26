// components/Signup/Step1Account.tsx
import React from 'react';
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
  return (
    <div className="space-y-4">
      <div>
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-purple-400"
          required
          maxLength={100}
        />
        {errors.fullName && (
          <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
        )}
      </div>

      <div>
        <input
          type="text"
          name="username"
          placeholder="Username (@handle)"
          value={formData.username}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-purple-400"
          required
          maxLength={50}
          pattern="[a-zA-Z0-9_]+"
          title="Username can only contain letters, numbers, and underscores"
        />
        {errors.username && (
          <p className="text-red-500 text-sm mt-1">{errors.username}</p>
        )}
      </div>

      <div>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-purple-400"
          required
          maxLength={255}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-purple-400"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password}</p>
        )}
      </div>

      <div className="relative">
        <input
          type={showConfirmPassword ? 'text' : 'password'}
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-purple-400"
          required
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
        >
          {showConfirmPassword ? 'Hide' : 'Show'}
        </button>
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
        )}
      </div>
    </div>
  );
};

export default Step1Account;
