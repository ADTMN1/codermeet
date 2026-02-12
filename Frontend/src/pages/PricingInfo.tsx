import React from 'react';
import { useNavigate } from 'react-router-dom';

const PricingInfo: React.FC = () => {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    navigate('/signup');
  };
  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for getting started',
      features: [
        'Access to daily challenges',
        'Community forums access',
        'Basic learning resources',
        'Public profile',
        'Project showcase'
      ],
      color: 'from-blue-400 to-cyan-400',
      buttonColor: 'bg-blue-500 hover:bg-blue-400',
      borderColor: 'border-blue-500/30',
      popular: false
    },
    {
      name: 'Professional',
      price: '$29',
      period: '/month',
      description: 'Most popular for developers',
      features: [
        'Everything in Starter',
        'Weekly coding challenges',
        '1-on-1 mentorship sessions',
        'Advanced learning resources',
        'Priority support',
        'Private projects',
        'Code reviews'
      ],
      color: 'from-purple-400 to-pink-400',
      buttonColor: 'bg-purple-500 hover:bg-purple-400',
      borderColor: 'border-purple-500/30',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      description: 'For teams and organizations',
      features: [
        'Everything in Professional',
        'Unlimited mentorship',
        'Custom learning paths',
        'Team collaboration tools',
        'Dedicated account manager',
        'API access',
        'Custom integrations',
        'SLA guarantee'
      ],
      color: 'from-green-400 to-emerald-400',
      buttonColor: 'bg-green-500 hover:bg-green-400',
      borderColor: 'border-green-500/30',
      popular: false
    }
  ];

  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400 mb-8 leading-relaxed max-w-3xl mx-auto">
            Select the perfect plan for your coding journey. Start free and upgrade as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative bg-white/10 backdrop-blur-md border ${plan.borderColor} rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 shadow-lg flex flex-col h-full ${
                plan.popular ? 'ring-2 ring-purple-500/50' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className={`text-2xl font-bold mb-2 bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                  {plan.name}
                </h3>
                <p className="text-gray-400 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className={`text-5xl font-extrabold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-400 ml-2">{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <span className="text-green-400 mr-3 mt-1 flex-shrink-0">✓</span>
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <button 
                  onClick={handleButtonClick}
                  className={`w-full ${plan.buttonColor} text-white py-4 rounded-xl font-semibold text-lg transition duration-200 shadow-lg hover:shadow-blue-500/40 transform hover:-translate-y-0.5 hover:scale-105 cursor-pointer border-0`}
                >
                  {plan.name === 'Enterprise' ? 'Contact Sales' : plan.name === 'Starter' ? 'Get Started' : 'Start Free Trial'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-white mb-8">
            Compare Features
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-4 text-gray-400">Feature</th>
                  <th className="pb-4 text-center text-gray-400">Starter</th>
                  <th className="pb-4 text-center text-gray-400">Professional</th>
                  <th className="pb-4 text-center text-gray-400">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="py-4 text-gray-300">Daily Challenges</td>
                  <td className="py-4 text-center text-green-400">✓</td>
                  <td className="py-4 text-center text-green-400">✓</td>
                  <td className="py-4 text-center text-green-400">✓</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-4 text-gray-300">Weekly Challenges</td>
                  <td className="py-4 text-center text-gray-500">—</td>
                  <td className="py-4 text-center text-green-400">✓</td>
                  <td className="py-4 text-center text-green-400">✓</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-4 text-gray-300">1-on-1 Mentorship</td>
                  <td className="py-4 text-center text-gray-500">—</td>
                  <td className="py-4 text-center text-green-400">Limited</td>
                  <td className="py-4 text-center text-green-400">Unlimited</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-4 text-gray-300">Priority Support</td>
                  <td className="py-4 text-center text-gray-500">—</td>
                  <td className="py-4 text-center text-green-400">✓</td>
                  <td className="py-4 text-center text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="py-4 text-gray-300">API Access</td>
                  <td className="py-4 text-center text-gray-500">—</td>
                  <td className="py-4 text-center text-gray-500">—</td>
                  <td className="py-4 text-center text-green-400">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 text-left">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Can I change plans anytime?</h3>
              <p className="text-gray-300">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 text-left">
              <h3 className="text-lg font-semibold text-purple-400 mb-2">Is there a free trial?</h3>
              <p className="text-gray-300">Professional plan comes with a 14-day free trial. No credit card required.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 text-left">
              <h3 className="text-lg font-semibold text-green-400 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-300">We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 text-left">
              <h3 className="text-lg font-semibold text-pink-400 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-300">Absolutely. You can cancel your subscription anytime with no cancellation fees.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingInfo;
