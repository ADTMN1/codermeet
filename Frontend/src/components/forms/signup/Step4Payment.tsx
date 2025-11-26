// components/Signup/Step4Payment.tsx
import React from 'react';
import { FormData } from './types';

interface Props {
  formData: FormData;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  handleFileChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => Promise<void> | void;
  paymentProof: File | null;
  errors: { [key: string]: string };
}

const Step4Payment: React.FC<Props> = ({
  formData,
  handleChange,
  handleFileChange,
  paymentProof,
  errors,
}) => {
  return (
    <>
      <hr className="my-8 border-gray-600" />

      <div className="space-y-6">
        {formData.plan !== 'trial' && (
          <>
            <h2 className="text-2xl font-semibold text-center mb-4 text-green-400">
              Payment Instructions
            </h2>

            <div className="bg-gray-700 p-4 rounded-xl text-gray-200">
              <p className="text-lg font-semibold mb-2 text-purple-300">
                Send Payment To:
              </p>

              <div className="space-y-1">
                <p>
                  <span className="font-bold">Account Name:</span> CoderMeet
                </p>
                <p>
                  <span className="font-bold">Bank / Service:</span> ETHIOPIAN
                  COMMERCIAL Bank
                </p>
                <p>
                  <span className="font-bold">Account Number:</span> 100051.....
                </p>
                <p>
                  <span className="font-bold">Amount:</span>{' '}
                  {formData.plan === 'basic' ? '100' : '400'} Birr
                </p>
              </div>

              <p className="mt-3 text-sm text-gray-300">
                After sending payment, upload a screenshot of the transaction
                below.
              </p>
            </div>

            <div className="bg-gray-700 p-4 rounded-xl">
              <label className="block text-gray-300 mb-2">
                Upload Payment Screenshot:
              </label>

              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="w-full p-3 rounded-lg bg-gray-800 text-gray-200 focus:outline-none focus:ring-purple-400"
                required={formData.plan !== 'trial'}
              />

              {paymentProof && (
                <div className="mt-4">
                  <p className="text-green-400 text-sm">
                    File selected: {paymentProof.name}
                  </p>
                </div>
              )}

              {errors.paymentProof && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.paymentProof}
                </p>
              )}
            </div>

            <p className="text-sm text-center text-gray-400">
              Your account will be verified within 1–12 hours after uploading
              proof.
            </p>
          </>
        )}

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
      </div>
    </>
  );
};

export default Step4Payment;
