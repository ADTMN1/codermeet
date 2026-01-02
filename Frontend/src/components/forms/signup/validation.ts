// components/Signup/validation.ts
import { FormData } from './types';

export const validatePasswordStrength = (password: string): string => {
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(password))
    return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password))
    return 'Password must contain at least one lowercase letter';
  if (!/\d/.test(password)) return 'Password must contain at least one number';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    return 'Password must contain at least one special character';
  return '';
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateGithubUrl = (url: string): boolean => {
  if (!url) return true;
  
  // Trim whitespace
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return true;
  
  // More flexible GitHub regex - allows usernames with underscores, dots, and dashes
  const githubRegex = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9._-]+$/;
  
  // More general URL regex for other portfolio sites
  const urlRegex = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  
  return githubRegex.test(trimmedUrl) || urlRegex.test(trimmedUrl);
};

export const sanitizeInput = (input: string | any): string => {
  if (typeof input !== 'string') {
    return String(input);
  }
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

/**
 * validateStep(formData, step, paymentProof)
 * - paymentProof param optional: if plan is paid and paymentProof missing -> error
 */
export const validateStep = (
  formData: FormData,
  step: number,
  paymentProof?: File | null
) => {
  const errors: { [key: string]: string } = {};

  if (step === 1) {
    if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
    else if (formData.fullName.trim().length > 100)
      errors.fullName = 'Full Name must be less than 100 characters';

    if (!formData.username.trim()) errors.username = 'Username is required';
    else if (formData.username.length > 50)
      errors.username = 'Username must be less than 50 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(formData.username))
      errors.username =
        'Username can only contain letters, numbers, and underscores';

    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!validateEmail(formData.email))
      errors.email = 'Please enter a valid email address';
    else if (formData.email.length > 255)
      errors.email = 'Email must be less than 255 characters';

    if (!formData.password) errors.password = 'Password is required';
    else {
      const passwordError = validatePasswordStrength(formData.password);
      if (passwordError) errors.password = passwordError;
    }

    if (!formData.confirmPassword)
      errors.confirmPassword = 'Confirm your password';
    else if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = 'Passwords do not match';
  }

  if (step === 2) {
    if (!formData.primaryLanguage)
      errors.primaryLanguage = 'Select your primary language';
    if (formData.skills.length === 0)
      errors.skills = 'Please select at least one skill';
    if (formData.skills.length > 10)
      errors.skills = 'You can select up to 10 skills';
    if (!formData.github || !formData.github.trim())
      errors.github = 'GitHub URL is required';
    else if (!validateGithubUrl(formData.github))
      errors.github = 'GitHub URL must be a valid URL (e.g., github.com/username)';
    if (formData.bio && formData.bio.length > 500)
      errors.bio = 'Bio must be less than 500 characters';
  }

  if (step === 3) {
    if (!formData.plan) errors.plan = 'Select a plan';
  }

  if (step === 4) {
    if (formData.plan !== 'trial' && !paymentProof) {
      errors.paymentProof = 'Payment screenshot is required for paid plans';
    }
  }

  return errors;
};
