'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function PatientSubscription() {
  const [currentPlan, setCurrentPlan] = useState('essential');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: '1',
      type: 'VISA',
      last4: '4242',
      expiry: '12/25',
      isDefault: true
    }
  ]);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for new plan from checkout redirect
  useEffect(() => {
    const newPlan = searchParams.get('newPlan');
    if (newPlan) {
      setCurrentPlan(newPlan);
      // Clear the URL parameter
      router.replace('/patient/subscription');
    }
  }, [searchParams, router]);

  // Format expiry date as MM/YY
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove any non-digit characters
    value = value.replace(/\D/g, '');
    
    // Add slash after MM
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    
    setExpiryDate(value);
  };

  // Format card number with spaces
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove any non-digit characters
    value = value.replace(/\D/g, '');
    
    // Add spaces every 4 digits
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    // Limit to 16 digits
    if (value.replace(/\s/g, '').length <= 16) {
      setCardNumber(value);
    }
  };

  // Handle CVC input (only numbers)
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove any non-digit characters
    value = value.replace(/\D/g, '');
    
    // Limit to 3 or 4 digits (some cards have 4-digit CVCs)
    if (value.length <= 4) {
      setCvc(value);
    }
  };

  // Handle Name on Card input (only letters and spaces)
  const handleCardNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Only allow letters, spaces, apostrophes, and hyphens (for names like O'Brien or Mary-Jane)
    value = value.replace(/[^a-zA-Z\s'-]/g, '');
    
    // Prevent multiple spaces in a row
    value = value.replace(/\s+/g, ' ');
    
    setCardName(value);
  };

  const plans = [
    {
      id: 'free',
      name: 'Free Consultation',
      price: 0,
      period: 'One-time',
      features: [
        'Single consultation',
        'Basic treatment plan',
        'Pay per medication',
        'Email support'
      ],
      current: false
    },
    {
      id: 'essential',
      name: 'Essential Care',
      price: 29,
      period: 'month',
      features: [
        'Unlimited consultations',
        'Priority provider review',
        '10% medication discount',
        'Chat support',
        'Prescription management'
      ],
      current: false,
      badge: 'Most Popular'
    },
    {
      id: 'premium',
      name: 'Premium Care',
      price: 79,
      period: 'month',
      features: [
        'Everything in Essential',
        '25% medication discount',
        'Same-day provider review',
        'Video consultations',
        'Free shipping',
        'Dedicated care team'
      ],
      current: false,
      badge: 'Best Value'
    }
  ];

  const billingHistory = [
    { date: 'Jan 1', amount: 29, description: 'Essential Care', status: 'Paid' },
    { date: 'Dec 1', amount: 29, description: 'Essential Care', status: 'Paid' },
    { date: 'Nov 15', amount: 147, description: 'Medication Order', status: 'Paid' }
  ];

  return (
    <div className="space-y-4 pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Subscription & Billing</h1>
        <p className="text-sm text-slate-600 mt-1">Manage your care plan and payments</p>
      </div>

      {/* Current Plan Card - Mobile First */}
      <div className={`rounded-xl p-4 text-white ${
        currentPlan === 'free' 
          ? 'bg-gradient-to-r from-slate-500 to-slate-600' 
          : 'bg-gradient-to-r from-medical-500 to-emerald-500'
      }`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/90">Your Current Plan</p>
            <h2 className="text-2xl font-bold mt-1">
              {currentPlan === 'free' ? 'Free Consultation' : 
               currentPlan === 'premium' ? 'Premium Care' : 'Essential Care'}
            </h2>
            <p className="text-sm text-white/80 mt-1">
              {currentPlan === 'free' ? 'Pay per use' : 
               currentPlan === 'premium' ? '$79/month' : '$29/month'}
            </p>
          </div>
          <span className="px-2 py-1 bg-white/20 backdrop-blur text-white text-xs font-semibold rounded-full">
            Active
          </span>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20">
          {currentPlan === 'free' ? (
            <>
              <p className="text-xs text-white/80">No active subscription</p>
              <p className="text-xs text-white/80 mt-1">Pay only when you need care</p>
            </>
          ) : (
            <>
              <p className="text-xs text-white/80">Next billing: February 1, 2024</p>
              <p className="text-xs text-white/80 mt-1">Member since: October 2023</p>
            </>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          {currentPlan !== 'free' ? (
            <>
              <button 
                onClick={() => {
                  // Navigate to upgrade flow
                  router.push(`/patient/subscription-checkout?plan=premium&price=79`);
                }}
                aria-label="Upgrade to premium plan"
                className="flex-1 bg-white/20 backdrop-blur text-white font-medium text-sm py-2 px-3 rounded-lg hover:bg-white/30 transition"
              >
                {currentPlan === 'premium' ? 'Manage' : 'Upgrade'}
              </button>
              <button 
                onClick={() => setShowCancelModal(true)}
                className="flex-1 bg-white/10 text-white/90 font-medium text-sm py-2 px-3 rounded-lg hover:bg-white/20 transition"
              >
                Cancel
              </button>
            </>
          ) : (
            <button 
              onClick={() => {
                // Navigate to select a paid plan
                const element = document.getElementById('available-plans');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-white/20 backdrop-blur text-white font-medium text-sm py-2 px-3 rounded-lg hover:bg-white/30 transition"
            >
              Choose a Plan
            </button>
          )}
        </div>
      </div>

      {/* Plans Grid - Mobile Optimized */}
      <div id="available-plans">
        <h2 className="text-base font-semibold text-slate-900 mb-3">Available Plans</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-xl border-2 p-4 transition-all ${
                plan.id === currentPlan 
                  ? 'border-medical-500 shadow-md' 
                  : 'border-slate-200 hover:border-slate-300 hover:shadow'
              }`}
            >
              {/* Badges */}
              <div className="absolute -top-3 left-4 right-4 flex justify-between">
                {plan.badge && (
                  <span className="px-2 py-0.5 bg-medical-600 text-white text-xs font-semibold rounded-full">
                    {plan.badge}
                  </span>
                )}
                {plan.id === currentPlan && (
                  <span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                    Current
                  </span>
                )}
              </div>

              <div className="mt-2">
                <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-2xl font-bold text-slate-900">${plan.price}</span>
                  {plan.price > 0 && <span className="text-sm text-slate-500 ml-1">/{plan.period}</span>}
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-xs">
                    <span className="text-emerald-500 mr-2 mt-0.5">✓</span>
                    <span className="text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.id !== currentPlan && (
                <button
                  onClick={() => {
                    // Handle plan selection
                    if (plan.price > 29) {
                      // Navigate to subscription checkout page
                      router.push(`/patient/subscription-checkout?plan=${plan.id}&price=${plan.price}`);
                    } else if (plan.price === 0) {
                      // For downgrade to free, show custom confirmation modal
                      setShowDowngradeModal(true);
                    } else {
                      // For same-tier or lower plans
                      router.push(`/patient/subscription-checkout?plan=${plan.id}&price=${plan.price}`);
                    }
                  }}
                  aria-label={`Switch to ${plan.name} plan - $${plan.price}${plan.price > 0 ? '/' + plan.period : ''}`}
                  className={`mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium transition ${
                    plan.price > 29
                      ? 'bg-medical-600 text-white hover:bg-medical-700'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {plan.price > 29 ? 'Upgrade' : plan.price === 0 ? 'Switch to Free' : 'Select'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods - Clean Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Payment Methods</h2>
        </div>
        <div className="p-4 space-y-3">
          {paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-8 rounded flex items-center justify-center text-xs font-bold text-white ${
                  method.type === 'VISA' ? 'bg-slate-700' : 
                  method.type === 'MC' ? 'bg-red-600' : 
                  method.type === 'AMEX' ? 'bg-blue-600' : 'bg-gray-600'
                }`}>
                  {method.type}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">•••• {method.last4}</p>
                  <p className="text-xs text-slate-600">Expires {method.expiry}</p>
                </div>
                {method.isDefault && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                    Default
                  </span>
                )}
              </div>
              <button 
                onClick={() => {
                  // Handle payment method removal
                  if (confirm('Remove this payment method?')) {
                    setPaymentMethods(prev => prev.filter(pm => pm.id !== method.id));
                    toast.success('Payment method removed');
                  }
                }}
                aria-label="Remove payment method"
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          <button 
            onClick={() => setShowPaymentModal(true)}
            aria-label="Add new payment method"
            className="w-full py-2.5 px-4 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-slate-400 hover:text-slate-700 transition-colors text-sm"
          >
            + Add Payment Method
          </button>
        </div>
      </div>

      {/* Billing History - Mobile Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Recent Charges</h2>
        </div>
        
        {/* Mobile View */}
        <div className="lg:hidden divide-y divide-slate-100">
          {billingHistory.map((item, idx) => (
            <div key={idx} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.description}</p>
                  <p className="text-xs text-slate-600 mt-1">{item.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">${item.amount}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                    {item.status}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => {
                  // Handle invoice download
                  console.log(`Downloading invoice for ${item.description} - $${item.amount}`);
                  // TODO: Implement invoice download API call
                }}
                aria-label={`Download invoice for ${item.description} - $${item.amount}`}
                className="mt-2 text-xs text-medical-600 hover:text-medical-700"
              >
                Download Invoice →
              </button>
            </div>
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-sm font-medium text-slate-700">Date</th>
                <th className="text-left py-2 text-sm font-medium text-slate-700">Description</th>
                <th className="text-left py-2 text-sm font-medium text-slate-700">Amount</th>
                <th className="text-left py-2 text-sm font-medium text-slate-700">Status</th>
                <th className="text-left py-2 text-sm font-medium text-slate-700">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {billingHistory.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 text-sm text-slate-600">{item.date}</td>
                  <td className="py-3 text-sm text-slate-900">{item.description}</td>
                  <td className="py-3 text-sm font-semibold text-slate-900">${item.amount}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <button 
                      onClick={() => {
                        // Handle invoice download
                        console.log(`Downloading invoice for ${item.description} - $${item.amount}`);
                        // TODO: Implement invoice download API call
                      }}
                      aria-label={`Download invoice for ${item.description} - $${item.amount}`}
                      className="text-medical-600 hover:text-medical-700 text-sm"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Modal - Mobile Optimized */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Cancel Subscription?</h3>
            <p className="text-sm text-slate-600 mb-4">
              You'll lose access to these benefits:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start text-sm">
                <span className="text-red-500 mr-2">✕</span>
                <span className="text-slate-700">Unlimited consultations</span>
              </li>
              <li className="flex items-start text-sm">
                <span className="text-red-500 mr-2">✕</span>
                <span className="text-slate-700">10% medication discount</span>
              </li>
              <li className="flex items-start text-sm">
                <span className="text-red-500 mr-2">✕</span>
                <span className="text-slate-700">Priority support</span>
              </li>
            </ul>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium text-sm transition"
              >
                Keep Plan
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  // Switch to free plan when canceling subscription
                  setCurrentPlan('free');
                  // In a real app, this would call an API to downgrade/cancel
                  toast.success('Your subscription has been cancelled. You now have the Free plan.', {
                    duration: 4000,
                    icon: '✅',
                    style: {
                      background: '#10b981',
                      color: 'white',
                    },
                  });
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Downgrade Modal - Custom Confirmation */}
      {showDowngradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Switch to Free Plan?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to switch to the free plan? You will lose your current benefits.
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-amber-800 mb-2">You'll lose access to:</p>
              <ul className="space-y-2">
                <li className="flex items-start text-sm">
                  <span className="text-amber-600 mr-2 mt-0.5">⚠</span>
                  <span className="text-amber-700">Unlimited consultations</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="text-amber-600 mr-2 mt-0.5">⚠</span>
                  <span className="text-amber-700">10% medication discount</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="text-amber-600 mr-2 mt-0.5">⚠</span>
                  <span className="text-amber-700">Priority provider review</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="text-amber-600 mr-2 mt-0.5">⚠</span>
                  <span className="text-amber-700">Chat support</span>
                </li>
              </ul>
            </div>

            <p className="text-xs text-slate-500 mb-6">
              This change will take effect at the end of your current billing cycle.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDowngradeModal(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle downgrade
                  setShowDowngradeModal(false);
                  setCurrentPlan('free');
                  // In a real app, this would call an API to downgrade
                  toast.success('Your subscription has been cancelled. You now have the Free plan.', {
                    duration: 4000,
                    icon: '✅',
                    style: {
                      background: '#10b981',
                      color: 'white',
                    },
                  });
                }}
                className="flex-1 px-4 py-2.5 bg-medical-600 text-white rounded-lg hover:bg-medical-700 font-medium text-sm transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Add Payment Method</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setExpiryDate('');
                  setCardNumber('');
                  setCvc('');
                  setCardName('');
                  setIsDefault(true);
                }}
                className="text-slate-400 hover:text-slate-600 transition"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              
              // Get card type based on first digit
              const getCardType = (num: string) => {
                const firstDigit = num.charAt(0);
                if (firstDigit === '4') return 'VISA';
                if (firstDigit === '5') return 'MC';
                if (firstDigit === '3') return 'AMEX';
                return 'CARD';
              };
              
              // Add new payment method
              const newMethod = {
                id: Date.now().toString(),
                type: getCardType(cardNumber),
                last4: cardNumber.replace(/\s/g, '').slice(-4),
                expiry: expiryDate,
                isDefault: isDefault
              };
              
              // If this is set as default, update other cards
              if (isDefault) {
                setPaymentMethods(prev => prev.map(method => ({ ...method, isDefault: false })));
              }
              
              setPaymentMethods(prev => [...prev, newMethod]);
              
              toast.success('Payment method added successfully!', {
                duration: 3000,
                icon: '💳',
              });
              setShowPaymentModal(false);
              // Reset form
              setExpiryDate('');
              setCardNumber('');
              setCvc('');
              setCardName('');
              setIsDefault(true);
            }}>
              {/* Card Number */}
              <div className="mb-4">
                <label htmlFor="cardNumber" className="block text-sm font-medium text-slate-700 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500"
                  required
                  maxLength={19}
                  inputMode="numeric"
                />
              </div>

              {/* Expiry and CVC */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="expiry" className="block text-sm font-medium text-slate-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    id="expiry"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={handleExpiryDateChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500"
                    required
                    maxLength={5}
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label htmlFor="cvc" className="block text-sm font-medium text-slate-700 mb-2">
                    CVC
                  </label>
                  <input
                    type="text"
                    id="cvc"
                    placeholder="123"
                    value={cvc}
                    onChange={handleCvcChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500"
                    required
                    maxLength={4}
                    inputMode="numeric"
                  />
                </div>
              </div>

              {/* Name on Card */}
              <div className="mb-6">
                <label htmlFor="cardName" className="block text-sm font-medium text-slate-700 mb-2">
                  Name on Card
                </label>
                <input
                  type="text"
                  id="cardName"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={handleCardNameChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500"
                  required
                />
              </div>

              {/* Make Default Checkbox */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded text-medical-600 focus:ring-medical-500"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                  />
                  <span className="text-slate-700">Set as default payment method</span>
                </label>
              </div>

              {/* Security Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Your payment information is secure and encrypted
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setExpiryDate('');
                    setCardNumber('');
                    setCvc('');
                    setCardName('');
                    setIsDefault(true);
                  }}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-medical-600 text-white rounded-lg hover:bg-medical-700 font-medium text-sm transition"
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
