'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function SubscriptionCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get('plan');
  const price = searchParams.get('price');
  const [isProcessing, setIsProcessing] = useState(false);

  const getPlanDetails = (planId: string | null) => {
    switch(planId) {
      case 'premium':
        return {
          name: 'Premium Care',
          price: 79,
          features: [
            'Everything in Essential',
            '25% medication discount',
            'Same-day provider review',
            'Video consultations',
            'Free shipping',
            'Dedicated care team'
          ]
        };
      case 'essential':
        return {
          name: 'Essential Care',
          price: 29,
          features: [
            'Unlimited consultations',
            'Priority provider review',
            '10% medication discount',
            'Chat support',
            'Prescription management'
          ]
        };
      default:
        return {
          name: 'Unknown Plan',
          price: 0,
          features: []
        };
    }
  };

  const planDetails = getPlanDetails(plan);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      // In a real app, this would integrate with Stripe or another payment processor
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      toast.success(`Successfully subscribed to ${planDetails.name}!`, {
        duration: 4000,
        icon: '✅',
        style: {
          background: '#10b981',
          color: 'white',
        },
      });
      
      // Redirect back to subscription page with new plan info after a short delay
      setTimeout(() => {
        router.push(`/patient/subscription?newPlan=${plan}`);
      }, 1500);
    } catch (error) {
      toast.error('Payment failed. Please try again.', {
        duration: 4000,
        icon: '❌',
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="text-sm text-medical-600 hover:text-medical-700 mb-4 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Subscription
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Subscription Checkout</h1>
        <p className="text-sm text-slate-600 mt-1">Review and complete your subscription change</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plan Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Plan Details</h2>
            
            <div className="bg-gradient-to-r from-medical-50 to-emerald-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-slate-900">{planDetails.name}</h3>
              <div className="mt-2 flex items-baseline">
                <span className="text-3xl font-bold text-slate-900">${planDetails.price}</span>
                <span className="text-sm text-slate-500 ml-1">/month</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-3">What\'s included:</h4>
              <ul className="space-y-2">
                {planDetails.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-sm">
                    <span className="text-emerald-500 mr-2 mt-0.5">✓</span>
                    <span className="text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Method</h2>
            
            <div className="space-y-3">
              <label className="block p-4 border border-slate-200 rounded-lg cursor-pointer hover:border-medical-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      defaultChecked
                      className="text-medical-600 focus:ring-medical-500"
                    />
                    <div className="w-12 h-8 bg-slate-700 rounded flex items-center justify-center text-xs font-bold text-white">
                      VISA
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">•••• 4242</p>
                      <p className="text-xs text-slate-600">Expires 12/25</p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">Default</span>
                </div>
              </label>
              
              <button className="w-full p-4 border border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-slate-400 hover:text-slate-700 transition-colors">
                + Add New Payment Method
              </button>
            </div>
          </div>

          {/* Terms */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Subscription Terms:</span> Your subscription will automatically renew each month. 
              You can cancel anytime from your subscription page. Changes take effect at the next billing cycle.
            </p>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">{planDetails.name}</span>
                <span className="font-medium text-slate-900">${planDetails.price}/mo</span>
              </div>
              
              {/* Show proration if upgrading mid-cycle */}
              <div className="flex justify-between text-xs text-slate-500">
                <span>Prorated charge (today)</span>
                <span>$12.50</span>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-900">Due Today</span>
                  <span className="font-semibold text-slate-900">$12.50</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Then ${planDetails.price}/month starting Jan 1</p>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full mt-6 py-3 bg-medical-600 text-white rounded-lg font-medium hover:bg-medical-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Complete Checkout'
              )}
            </button>

            {/* Security Badge */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Secure payment powered by Stripe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}