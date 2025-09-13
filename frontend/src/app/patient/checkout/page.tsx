'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY || 'pk_test_dummy');

function CheckoutForm({ consultationId, prescriptions }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<'billing' | 'payment'>('billing');
  
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
    },
  });

  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    shipping: 5.99,
    tax: 0,
    total: 0,
  });

  const [isSubscription, setIsSubscription] = useState(false);

  useEffect(() => {
    // Calculate totals
    const subtotal = prescriptions.reduce((sum: number, med: any) => 
      sum + (med.price * med.quantity), 0
    );
    const shipping = subtotal >= 50 ? 0 : 5.99;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;

    setOrderSummary({ subtotal, shipping, tax, total });
  }, [prescriptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Simplified for demo - would integrate with actual backend
      const result = await stripe.confirmCardPayment('client_secret_demo', {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: billingDetails.name,
            email: billingDetails.email,
            phone: billingDetails.phone,
            address: billingDetails.address,
          },
        },
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else {
        // Payment succeeded
        router.push('/patient/orders?success=true');
      }
    } catch (err: any) {
      setError('Payment processing unavailable in demo mode');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Progress Steps - Mobile Optimized */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => setActiveStep('billing')}
          className={`flex-1 py-2 text-center text-sm font-medium rounded-l-lg transition-colors ${
            activeStep === 'billing' 
              ? 'bg-medical-600 text-white' 
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          1. Billing
        </button>
        <button
          type="button"
          onClick={() => setActiveStep('payment')}
          className={`flex-1 py-2 text-center text-sm font-medium rounded-r-lg transition-colors ${
            activeStep === 'payment' 
              ? 'bg-medical-600 text-white' 
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          2. Payment
        </button>
      </div>

      {/* Mobile-First Form Sections */}
      {activeStep === 'billing' && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-slate-900 mb-4">Billing Information</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={billingDetails.name}
                onChange={(e) => setBillingDetails({ ...billingDetails, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={billingDetails.email}
                  onChange={(e) => setBillingDetails({ ...billingDetails, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  required
                  value={billingDetails.phone}
                  onChange={(e) => setBillingDetails({ ...billingDetails, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                required
                value={billingDetails.address.line1}
                onChange={(e) => setBillingDetails({
                  ...billingDetails,
                  address: { ...billingDetails.address, line1: e.target.value }
                })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={billingDetails.address.city}
                  onChange={(e) => setBillingDetails({
                    ...billingDetails,
                    address: { ...billingDetails.address, city: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={billingDetails.address.state}
                  onChange={(e) => setBillingDetails({
                    ...billingDetails,
                    address: { ...billingDetails.address, state: e.target.value.toUpperCase() }
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  required
                  value={billingDetails.address.postal_code}
                  onChange={(e) => setBillingDetails({
                    ...billingDetails,
                    address: { ...billingDetails.address, postal_code: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveStep('payment')}
            className="w-full mt-4 py-2.5 px-4 bg-medical-600 text-white rounded-lg font-medium hover:bg-medical-700 transition-colors text-sm"
          >
            Continue to Payment
          </button>
        </div>
      )}

      {activeStep === 'payment' && (
        <>
          {/* Payment Method */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-slate-900 mb-4">Payment Method</h3>
            
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#334155',
                      '::placeholder': {
                        color: '#94a3b8',
                      },
                    },
                    invalid: {
                      color: '#dc2626',
                    },
                  },
                }}
              />
            </div>

            {/* Subscribe & Save Option */}
            <label className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={isSubscription}
                onChange={(e) => setIsSubscription(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <p className="text-sm font-medium text-slate-900">Subscribe & Save 20%</p>
                <p className="text-xs text-slate-600">Auto-refill every month</p>
              </div>
            </label>
          </div>

          {/* Order Summary - Mobile Optimized */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Order Summary</h3>
            
            <div className="space-y-2">
              {prescriptions.map((med: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-slate-600">{med.name} x{med.quantity}</span>
                  <span className="font-medium">${(med.price * med.quantity).toFixed(2)}</span>
                </div>
              ))}
              
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span>${orderSummary.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Shipping</span>
                  <span className={orderSummary.shipping === 0 ? 'text-emerald-600 font-medium' : ''}>
                    {orderSummary.shipping === 0 ? 'FREE' : `$${orderSummary.shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tax</span>
                  <span>${orderSummary.tax.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="text-lg font-bold text-medical-600">
                    ${orderSummary.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!stripe || processing}
            className="w-full py-3 px-4 bg-medical-600 text-white font-medium rounded-xl hover:bg-medical-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {processing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              `Pay $${orderSummary.total.toFixed(2)}`
            )}
          </button>

          {/* Security Badge */}
          <div className="text-center">
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <span>🔒</span>
              <span>Secure payment powered by Stripe</span>
            </p>
          </div>
        </>
      )}

      {/* Trust Badges - Mobile Optimized */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-2xl mb-1">✓</div>
          <p className="text-xs text-slate-600">FDA Approved</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-2xl mb-1">📦</div>
          <p className="text-xs text-slate-600">Free Shipping $50+</p>
        </div>
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const consultationId = searchParams.get('consultationId');
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([
    // Mock prescriptions for demo
    { id: 1, name: 'Semaglutide', price: 149, quantity: 1 },
    { id: 2, name: 'Vitamin D', price: 12, quantity: 1 }
  ]);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Checkout</h1>
        <p className="text-sm text-slate-600 mt-1">Complete your order</p>
      </div>

      {/* Main Content */}
      <Elements stripe={stripePromise}>
        <CheckoutForm consultationId={consultationId} prescriptions={prescriptions} />
      </Elements>

      {/* Help Section - Mobile Fixed */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-slate-200 lg:hidden">
        <button className="w-full py-2 text-medical-600 font-medium text-sm">
          Need help? Contact support →
        </button>
      </div>
    </div>
  );
}
