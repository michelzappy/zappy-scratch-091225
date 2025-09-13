'use client';

import { useState } from 'react';

export default function PatientSubscription() {
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
      <div className="bg-gradient-to-r from-medical-500 to-emerald-500 rounded-xl p-4 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/90">Your Current Plan</p>
            <h2 className="text-2xl font-bold mt-1">Essential Care</h2>
            <p className="text-sm text-white/80 mt-1">$29/month</p>
          </div>
          <span className="px-2 py-1 bg-white/20 backdrop-blur text-white text-xs font-semibold rounded-full">
            Active
          </span>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-xs text-white/80">Next billing: February 1, 2024</p>
          <p className="text-xs text-white/80 mt-1">Member since: October 2023</p>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="flex-1 bg-white/20 backdrop-blur text-white font-medium text-sm py-2 px-3 rounded-lg hover:bg-white/30 transition">
            Upgrade
          </button>
          <button 
            onClick={() => setShowCancelModal(true)}
            className="flex-1 bg-white/10 text-white/90 font-medium text-sm py-2 px-3 rounded-lg hover:bg-white/20 transition"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Plans Grid - Mobile Optimized */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Available Plans</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-xl border-2 p-4 transition-all ${
                plan.current 
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
                {plan.current && (
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

              {!plan.current && (
                <button
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
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-slate-700 rounded flex items-center justify-center text-xs font-bold text-white">
                VISA
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">•••• 4242</p>
                <p className="text-xs text-slate-600">Expires 12/25</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                Default
              </span>
            </div>
            <button className="text-medical-600 hover:text-medical-700 text-sm">
              Edit
            </button>
          </div>
          <button className="w-full py-2.5 px-4 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-slate-400 hover:text-slate-700 transition-colors text-sm">
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
              <button className="mt-2 text-xs text-medical-600 hover:text-medical-700">
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
                    <button className="text-medical-600 hover:text-medical-700 text-sm">
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
                  // Handle cancellation
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition"
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
