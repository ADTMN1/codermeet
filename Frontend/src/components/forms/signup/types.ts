// components/Signup/types.ts
export type PlanType = 'trial' | 'basic' | 'premium';

export type FormData = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  skills: string[];
  primaryLanguage: string;
  github: string;
  bio: string;
  plan: PlanType;
  notifications: boolean;
  challenges: boolean;
  paymentScreenshot?: string;
};
