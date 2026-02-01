// components/Signup/Step3Plan.tsx
import React from 'react';
import { FormData, PlanType } from './types';

interface Props {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: { [key: string]: string };
  onPlanSelect?: (plan: string) => void; // Optional callback for plan selection
}

const Step3Plan: React.FC<Props> = ({ formData, setFormData, errors, onPlanSelect }) => {
  const plans: {
    key: PlanType;
    title: string;
    price: string;
    features: string[];
    missing?: string[];
    recommended?: boolean;
  }[] = [
    {
      key: 'trial',
      title: 'Trial – Free',
      price: '0 Birr',
      features: [
        'Access to limited services.',
        'Basic support is included.',
        'Valid for 1 day only.',
      ],
      missing: [
        'Custom features are not included.',
        'Cloud backup is not available.',
      ],
    },
    {
      key: 'basic',
      title: 'Basic – 100 Birr',
      price: '100 Birr/month',
      features: [
        'Access to all core services.',
        'Standard support is included.',
        'Data backup is included.',
      ],
      missing: [
        'Advanced analytics are not available.',
        'Priority support is not included.',
      ],
    },
    {
      key: 'premium',
      title: 'Premium – 400 Birr',
      price: '400 Birr/month',
      features: [
        'All Basic features are included.',
        'Advanced analytics and reports are available.',
        'Priority support is included.',
        'Cloud sync and storage are included.',
      ],
      recommended: true,
    },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-center text-green-400">
        Choose Your Plan
      </h2>

      <div className="flex flex-col md:flex-row gap-6 justify-center">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`flex-1 flex flex-col rounded-2xl border-2 transition duration-300 shadow-lg cursor-pointer ${
              formData.plan === plan.key
                ? 'bg-gradient-to-r from-black-100 via-purple-500 border-purple-500 text-white'
                : 'border-gray-600 bg-gray-800 text-gray-200 hover:border-purple-400 hover:text-white'
            }`}
            onClick={() => setFormData({ ...formData, plan: plan.key })}
          >
            <div className="p-6 flex flex-col items-center">
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                {plan.title}
                {plan.recommended && (
                  <span className="bg-yellow-400 text-black px-3 py-1 rounded-full font-bold">
                    Recommended
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-300">{plan.price}</p>
            </div>

            <hr className="border-gray-600" />

            <div className="flex-1 p-6 space-y-2 overflow-x-auto">
              {plan.features.map((f) => (
                <p
                  key={f}
                  className="text-sm md:text-base flex items-center gap-2 whitespace-nowrap"
                >
                  {f}
                </p>
              ))}

              {plan.missing?.length &&
                plan.missing.map((m) => (
                  <p
                    key={m}
                    className="text-sm md:text-base opacity-70 whitespace-nowrap"
                  >
                    {m}
                  </p>
                ))}
            </div>

            <div className="p-6">
              <button
                type="button"
                className={`w-full py-2 rounded-lg font-semibold border-2 transition duration-300 ${
                  formData.plan === plan.key
                    ? 'bg-white text-purple-500 border-white'
                    : 'border-gray-400 text-gray-200 hover:bg-purple-600 hover:border-purple-600 hover:text-white'
                }`}
                onClick={() => {
                  setFormData({ ...formData, plan: plan.key });
                  if (onPlanSelect) {
                    onPlanSelect(plan.key);
                  }
                }}
              >
                {formData.plan === plan.key ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {errors.plan && (
        <p className="text-red-500 text-sm mt-1 text-center">{errors.plan}</p>
      )}
    </div>
  );
};

export default Step3Plan;
