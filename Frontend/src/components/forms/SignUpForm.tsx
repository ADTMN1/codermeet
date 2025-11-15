import React, { useState } from 'react';
import { FaGithub, FaPython, FaJsSquare, FaReact } from 'react-icons/fa';
import { IoMdCheckboxOutline } from 'react-icons/io';

type FormData = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  skills: string[];
  primaryLanguage: string;
  github: string;
  bio: string;
  plan: 'trial' | 'basic' | 'premium';
  notifications: boolean;
  challenges: boolean;
};

const Signup: React.FC = () => {
  const [step, setStep] = useState<number>(1);
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

  const skillsOptions = [
    'React',
    'Node.js',
    'Python',
    'JavaScript',
    'Tailwind',
    'Docker',
  ];

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'skills') {
      const newSkills = checked
        ? [...formData.skills, value]
        : formData.skills.filter((s) => s !== value);
      setFormData({ ...formData, skills: newSkills });
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Signup Data:', formData);

    // Show success toast
    setToast({ message: 'Successfully signed up! 🎉', type: 'success' });

    // Automatically hide after 3 seconds
    setTimeout(() => setToast(null), 3000);

    // Here you can call your API to save the user
  };

  return (
    <div className="min-h-screen text-gray-200 flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl bg-black-800 rounded-2xl p-10 shadow-2xl animate-fadeIn"
      >
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

        {/* Step 1: Account Info */}
        {step === 1 && (
          <div className="space-y-4">
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none  focus:ring-purple-400"
              required
            />
            <input
              type="text"
              name="username"
              placeholder="Username (@handle)"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none  focus:ring-purple-400"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none  focus:ring-purple-400"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none  focus:ring-purple-400"
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none  focus:ring-purple-400"
              required
            />
          </div>
        )}

        {/* Step 2: Developer Profile */}
        {step === 2 && (
          <div className="space-y-4">
            <select
              name="primaryLanguage"
              value={formData.primaryLanguage}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none  focus:ring-purple-400"
              required
            >
              <option value="">Select Primary Language</option>
              <option value="JavaScript">JavaScript</option>
              <option value="Python">Python</option>
              <option value="React">React</option>
              <option value="Node.js">Node.js</option>
              <option value="Other">Other</option>
            </select>

            <div className="flex flex-wrap gap-2">
              {skillsOptions.map((skill) => (
                <label
                  key={skill}
                  className={`px-3 py-1 rounded-full cursor-pointer border ${
                    formData.skills.includes(skill)
                      ? 'bg-purple-500 border-purple-500'
                      : 'border-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="skills"
                    value={skill}
                    checked={formData.skills.includes(skill)}
                    onChange={handleChange}
                    className="hidden"
                  />
                  {skill}
                </label>
              ))}
            </div>

            <input
              type="text"
              name="github"
              placeholder="GitHub / Portfolio URL"
              value={formData.github}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none  focus:ring-purple-400"
            />

            <textarea
              name="bio"
              placeholder="Short Bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none  focus:ring-purple-400"
              rows={3}
            ></textarea>
          </div>
        )}

        {/* Step 3: Subscription Plan */}
        {step === 3 && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center text-green-400">
              Choose Your Plan
            </h2>

            <div className="flex flex-col md:flex-row gap-6 justify-center ">
              {[
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
                  missing: [],
                  recommended: true,
                },
              ].map((plan) => (
                <div
                  key={plan.key}
                  className={`flex-1 flex flex-col rounded-2xl border-2 transition duration-300 shadow-lg cursor-pointer ${
                    formData.plan === plan.key
                      ? 'bg-gradient-to-r from-black-100 via-purple-500 border-purple-500 text-white'
                      : 'border-gray-600 bg-gray-800 text-gray-200 hover:border-purple-400 hover:text-white'
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, plan: plan.key as any })
                  }
                >
                  {/* Header */}
                  <div className="p-6 flex flex-col items-center">
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      {plan.title}
                      {plan.recommended && (
                        <span className="bg-yellow-400 text-black px-3 py-1 rounded-full  font-bold">
                          Recommended
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-300">{plan.price}</p>
                  </div>

                  {/* Divider */}
                  <hr className="border-gray-600" />

                  {/* Features */}
                  <div className="flex-1 p-6 space-y-2 overflow-x-auto ">
                    {plan.features.map((f) => (
                      <p
                        key={f}
                        className="text-sm md:text-base flex items-center gap-2  whitespace-nowrap"
                      >
                        {f}
                      </p>
                    ))}

                    {plan.missing.length > 0 &&
                      plan.missing.map((m) => (
                        <p
                          key={m}
                          className="text-sm md:text-base opacity-70 whitespace-nowrap"
                        >
                          {m}
                        </p>
                      ))}
                  </div>

                  {/* Select Button */}
                  <div className="p-6">
                    <button
                      className={`w-full py-2 rounded-lg font-semibold border-2 transition duration-300 ${
                        formData.plan === plan.key
                          ? 'bg-white text-purple-500 border-white'
                          : 'border-gray-400 text-gray-200 hover:bg-purple-600 hover:border-purple-600 hover:text-white'
                      }`}
                      onClick={() =>
                        setFormData({ ...formData, plan: plan.key as any })
                      }
                    >
                      {formData.plan === plan.key ? 'Selected' : 'Select Plan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Step 4: Payment Upload */}
        {step === 4 && (
          <>
            <hr className="my-8 border-gray-600" />

            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-center mb-4 text-green-400">
                Payment Instructions
              </h2>

              {/* Your Payment Account Details */}
              <div className="bg-gray-700 p-4 rounded-xl text-gray-200">
                <p className="text-lg font-semibold mb-2 text-purple-300">
                  Send Payment To:
                </p>

                <div className="space-y-1">
                  <p>
                    <span className="font-bold">Account Name:</span> CoderMeet
                  </p>
                  <p>
                    <span className="font-bold">Bank / Service:</span> ETHIPIAN
                    COMERICIAL Bank
                  </p>
                  <p>
                    <span className="font-bold">Account Number:</span>{' '}
                    100051.....
                  </p>
                  <p>
                    <span className="font-bold">Amount:</span> 400 Birr
                  </p>
                </div>

                <p className="mt-3 text-sm text-gray-300">
                  After sending payment, upload a screenshot of the transaction
                  below.
                </p>
              </div>

              {/* Screenshot Upload */}
              <div className="bg-gray-700 p-4 rounded-xl">
                <label className="block text-gray-300 mb-2">
                  Upload Payment Screenshot:
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentProof: e.target.files[0],
                    })
                  }
                  className="w-full p-3 rounded-lg bg-gray-800 text-gray-200 focus:outline-none  focus:ring-purple-400"
                  required
                />

                {/* Preview if image uploaded */}
                {formData.paymentProof && (
                  <img
                    src={URL.createObjectURL(formData.paymentProof)}
                    alt="Payment Screenshot Preview"
                    className="mt-4 rounded-lg shadow-lg max-h-64 object-cover"
                  />
                )}
              </div>

              <p className="text-sm text-center text-gray-400">
                Your account will be verified within 1–12 hours after uploading
                proof.
              </p>
            </div>
          </>
        )}

        {/* Step 4: Preferences */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-center mb-4 text-green-400">
              Personalize Experience
            </h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="challenges"
                checked={formData.challenges}
                onChange={handleChange}
                className="w-5 h-5"
              />
              Participate in daily coding challenges
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="notifications"
                checked={formData.notifications}
                onChange={handleChange}
                className="w-5 h-5"
              />
              Receive notifications & newsletter
            </label>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition duration-200
           cursor-pointer"
            >
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 rounded-lg bg-purple-500 hover:bg-purple-400 text-white transition duration-200 ml-auto cursor-pointer"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-green-500 hover:bg-green-400 text-white transition duration-200 ml-auto cursor-pointer"
            >
              Finish & Join
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

export default Signup;
