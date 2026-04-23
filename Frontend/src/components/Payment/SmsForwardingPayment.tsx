import React, { useState, useEffect } from 'react';

interface PaymentInfo {
  prices: {
    basic: number;
    premium: number;
  };
  supportedBanks: {
    code: string;
    name: string;
  }[];
  instructions: {
    title: string;
    description: string;
    steps: string[];
  };
}

interface PaymentReference {
  paymentRef: string;
  plan: string;
  amount: number;
  paymentMethods: {
    bank_transfer: {
      name: string;
      accountName: string;
      accountNumber: string;
      bank: string;
      branch: string;
    };
    telebirr: {
      name: string;
      phoneNumber: string;
      merchantName: string;
    };
  };
  instructions: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
  };
  expiresAt: string;
}

const SmsForwardingPayment: React.FC = () => {
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium'>('basic');
  const [loading, setLoading] = useState(false);
  const [paymentReference, setPaymentReference] = useState<PaymentReference | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    fetchPaymentInfo();
  }, []);

  useEffect(() => {
    if (paymentReference) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const expiresAt = new Date(paymentReference.expiresAt).getTime();
        const distance = expiresAt - now;

        if (distance > 0) {
          const hours = Math.floor(distance / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${hours}h ${minutes}m`);
        } else {
          setTimeRemaining('Expired');
          clearInterval(timer);
        }
      }, 60000); // Update every minute

      return () => clearInterval(timer);
    }
  }, [paymentReference]);

  const fetchPaymentInfo = async () => {
    try {
      const response = await fetch('/api/sms-forwarding/info');
      const data = await response.json();
      if (data.success) {
        setPaymentInfo(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch payment info:', error);
    }
  };

  const generatePaymentReference = async () => {
    setLoading(true);
    try {
      // Get user info (in real app, from auth context)
      const userData = {
        plan: selectedPlan,
        userId: 'temp-user-id', // Replace with actual user ID
        email: 'user@example.com', // Replace with actual user email
        fullName: 'Test User' // Replace with actual user name
      };

      const response = await fetch('/api/sms-forwarding/generate-reference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (data.success) {
        setPaymentReference(data.data);
        console.log('Payment reference generated successfully');
      } else {
        console.error('Failed to generate payment reference:', data.message);
      }
    } catch (error) {
      console.error('Error generating payment reference:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    console.log('Copied to clipboard:', text);
  };

  if (!paymentInfo) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Automatic Payment Detection
      </h1>

      {/* System Description */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3 text-blue-800">
          {paymentInfo.instructions.title}
        </h2>
        <p className="text-blue-700 mb-4">
          {paymentInfo.instructions.description}
        </p>
        <div className="bg-white p-4 rounded border">
          <p className="font-semibold text-sm text-gray-700 mb-2">Supported Banks:</p>
          <div className="flex flex-wrap gap-2">
            {paymentInfo.supportedBanks.map((bank) => (
              <span
                key={bank.code}
                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
              >
                {bank.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {!paymentReference ? (
        <div className="space-y-6">
          {/* Plan Selection */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Select Your Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(paymentInfo.prices).map(([plan, price]) => (
                <div
                  key={plan}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPlan === plan
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan(plan as 'basic' | 'premium')}
                >
                  <h3 className="text-lg font-semibold capitalize">{plan} Plan</h3>
                  <p className="text-2xl font-bold text-blue-600">{price} ETB/month</p>
                  <div className="mt-2 text-sm text-gray-600">
                    {plan === 'basic' ? (
                      <div>
                        <p>✓ Basic dashboard access</p>
                        <p>✓ Limited features</p>
                      </div>
                    ) : (
                      <div>
                        <p>✓ Full dashboard access</p>
                        <p>✓ All premium features</p>
                        <p>✓ Priority support</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">Bank Transfer</h3>
                <div className="space-y-2">
                  <p><strong>Account Name:</strong> CoderMeet Technologies</p>
                  <p><strong>Account Number:</strong> 
                    <span 
                      className="ml-2 text-blue-600 cursor-pointer hover:underline"
                      onClick={() => copyToClipboard('1000123456789')}
                    >
                      1000123456789 📋
                    </span>
                  </p>
                  <p><strong>Bank:</strong> Commercial Bank of Ethiopia</p>
                  <p><strong>Branch:</strong> Bole Branch</p>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">TeleBirr</h3>
                <div className="space-y-2">
                  <p><strong>Phone Number:</strong> 
                    <span 
                      className="ml-2 text-blue-600 cursor-pointer hover:underline"
                      onClick={() => copyToClipboard('+251911234567')}
                    >
                      +251911234567 📋
                    </span>
                  </p>
                  <p><strong>Merchant Name:</strong> CoderMeet</p>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-green-800">How It Works</h2>
            <div className="space-y-3">
              {paymentInfo.instructions.steps.map((step, index) => (
                <div key={index} className="flex items-start">
                  <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-green-700">{step}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Our system automatically detects payments through bank SMS notifications. 
                No manual confirmation needed!
              </p>
            </div>
          </div>

          {/* Generate Reference Button */}
          <button
            onClick={generatePaymentReference}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Generating...' : 'Generate Payment Reference'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Payment Reference Generated */}
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-green-800">
              Payment Reference Generated!
            </h2>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded border">
                <p className="text-sm text-gray-600">Payment Reference:</p>
                <p className="text-lg font-mono font-bold text-green-700">
                  {paymentReference.paymentRef}
                  <button
                    onClick={() => copyToClipboard(paymentReference.paymentRef)}
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    📋 Copy
                  </button>
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded border">
                <p className="text-sm text-yellow-800">
                  <strong>Time Remaining:</strong> {timeRemaining}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Next Steps:</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>{paymentReference.instructions.step1}</li>
              <li>{paymentReference.instructions.step2}</li>
              <li>{paymentReference.instructions.step3}</li>
              <li>{paymentReference.instructions.step4}</li>
            </ol>
          </div>

          {/* Payment Methods */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Make Payment Using:</h3>
            <div className="space-y-4">
              {Object.entries(paymentReference.paymentMethods).map(([key, method]) => {
                const typedMethod = method as any; // Type assertion for union type
                return (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">{typedMethod.name}</h4>
                  {key === 'bank_transfer' && (
                    <div className="space-y-1 text-sm">
                      <p><strong>Account Name:</strong> {typedMethod.accountName}</p>
                      <p><strong>Account Number:</strong> {typedMethod.accountNumber}</p>
                      <p><strong>Bank:</strong> {typedMethod.bank}</p>
                      <p><strong>Branch:</strong> {typedMethod.branch}</p>
                    </div>
                  )}
                  {key === 'telebirr' && (
                    <div className="space-y-1 text-sm">
                      <p><strong>Phone Number:</strong> {typedMethod.phoneNumber}</p>
                      <p><strong>Merchant Name:</strong> {typedMethod.merchantName}</p>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>

          {/* Status Message */}
          <div className="bg-blue-100 p-6 rounded-lg text-center">
            <div className="animate-pulse">
              <p className="text-blue-800 font-semibold">
                ⏳ Waiting for automatic payment detection...
              </p>
              <p className="text-blue-700 text-sm mt-2">
                You will receive instant dashboard access once payment is detected
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmsForwardingPayment;
