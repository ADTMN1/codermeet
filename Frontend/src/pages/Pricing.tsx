import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Step3Plan from '../components/forms/signup/Step3Plan';
import { FormData } from '../components/forms/signup/types';
import axios from 'axios';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const handlePlanSelect = async (plan: string) => {
    if (plan === 'trial') {
      navigate('/dashboard');
      return;
    }

    // For paid plans, check if user is logged in
    if (!user) {
      navigate('/login', { state: { from: '/pricing', selectedPlan: plan } });
      return;
    }

    try {
      // Store upgrade info for SMS payment
      localStorage.setItem('pending_upgrade', JSON.stringify({
        userId: user._id || user.id,
        plan: plan,
        email: user.email,
        fullName: user.name || user.fullName
      }));

      // Redirect to SMS payment page
      window.location.href = '/payment/sms';
    } catch (error) {
      console.error('Payment redirect error:', error);
      alert('Failed to redirect to payment page. Please try again.');
    }
  };

  // Create a minimal form data object for the plan component
  const formData: FormData = {
    fullName: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    skills: user?.skills || [],
    primaryLanguage: '',
    github: user?.github || '',
    bio: user?.bio || '',
    plan: 'trial',
    notifications: true,
    challenges: true,
  };

  const setFormData = () => {
    // This is a dummy function since we're just displaying plans
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400 mb-2">
            Upgrade your account to unlock all features
          </p>
          <p className="text-gray-500">
            Current plan: <span className="font-semibold text-purple-400">
              {user?.plan?.toUpperCase() || 'TRIAL'}
            </span>
          </p>
        </div>

        {/* Pricing info */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 bg-gray-800 rounded-lg px-6 py-3">
            <span className="text-gray-300">Pricing in Ethiopian Birr (ETB)</span>
            <span className="text-purple-400">Basic: 1 ETB/month</span>
            <span className="text-yellow-400">Premium: 599 ETB/month</span>
          </div>
        </div>

        {/* Plans */}
        <Step3Plan
          formData={formData}
          setFormData={setFormData}
          errors={{}}
          onPlanSelect={handlePlanSelect}
        />

        {/* Payment Methods Info */}
        <div className="mt-12 text-center">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-white mb-4">
              Payment Methods
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
              <div className="bg-gray-700 rounded p-2">Telebirr</div>
              <div className="bg-gray-700 rounded p-2">CBE Birr</div>
              <div className="bg-gray-700 rounded p-2">Amole</div>
              <div className="bg-gray-700 rounded p-2">HelloCash</div>
              <div className="bg-gray-700 rounded p-2">E-Birr</div>
              <div className="bg-gray-700 rounded p-2">Bank Cards</div>
              <div className="bg-gray-700 rounded p-2">PayPal</div>
              <div className="bg-gray-700 rounded p-2">Mobile Money</div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
