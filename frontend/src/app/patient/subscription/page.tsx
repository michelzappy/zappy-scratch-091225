'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PatientSubscription() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState('essential');
  const [showCancelModal, setShowCancelModal] = useState(false);

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
      current: true,
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
      current: false
    }
  ];

  const billingHistory = [
    { date: '2024-01-01', amount: 29, description: 'Essential Care - Monthly', status: 'Paid' },
    { date: '2023-12-01', amount: 29, description: 'Essential Care - Monthly', status: 'Paid' },
    { date: '2023-11-15', amount: 147, description: 'Medication Order #1234', status: 'Paid' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => router.push('/patient/dashboard')}
            className="text-blue-600 hover:text-blue-700 text-sm mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Subscription & Billing</h1>
          <p className="text-gray-600 mt-1">Manage your care plan and payment methods</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Current Plan Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
              <div className="mt-3 flex items-baseline">
                <span className="text-3xl font-bold text-blue-600">Essential Care</span>
                <span className="ml-2 text-gray-500">$29/month</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Next billing date: February 1, 2024</p>
              <div className="mt-4 flex space-x-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Upgrade Plan
                </button>
                <button 
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel Subscription
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Member since</p>
              <p className="font-semibold">October 2023</p>
              <p className="text-sm text-green-600 mt-2">Active</p>
            </div>
          </div>
        </div>

        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-lg shadow-sm p-6 relative ${
                  plan.current ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                    {plan.badge}
                  </span>
                )}
                {plan.current && (
                  <span className="absolute -top-3 right-4 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Current Plan
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  {plan.price > 0 && <span className="text-gray-500">/{plan.period}</span>}
                </div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                {!plan.current && (
                  <button
                    className={`mt-6 w-full py-2 px-4 rounded-lg transition ${
                      plan.price > 29
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {plan.price > 29 ? 'Upgrade' : 'Downgrade'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-12 h-8 bg-blue-100 rounded flex items-center justify-center text-xs font-bold text-blue-600">
                  VISA
                </div>
                <div className="ml-4">
                  <p className="font-medium">•••• 4242</p>
                  <p className="text-sm text-gray-500">Expires 12/25</p>
                </div>
                <span className="ml-4 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Default</span>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm">Edit</button>
            </div>
          </div>
          <button className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
            + Add Payment Method
          </button>
        </div>

        {/* Billing History */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-700">Description</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-700">Amount</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-700">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {billingHistory.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-3 text-sm">{item.date}</td>
                    <td className="py-3 text-sm">{item.description}</td>
                    <td className="py-3 text-sm font-medium">${item.amount}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <button className="text-blue-600 hover:text-blue-700 text-sm">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-4">Cancel Subscription?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your Essential Care subscription? You'll lose access to:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✕</span>
                <span className="text-sm">Unlimited consultations</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✕</span>
                <span className="text-sm">10% medication discount</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✕</span>
                <span className="text-sm">Priority support</span>
              </li>
            </ul>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Keep Subscription
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  alert('Subscription cancelled');
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
