'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { authService } from '@/lib/auth';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy');

// Medication catalog (like Hims/Ro)
const MEDICATIONS = {
  'sildenafil': {
    name: 'Sildenafil',
    genericFor: 'Viagra®',
    category: 'ED',
    image: '💊',
    dosages: [
      { strength: '20mg', quantity: 10, price: 30, pricePerDose: 3 },
      { strength: '20mg', quantity: 30, price: 70, pricePerDose: 2.33 },
      { strength: '50mg', quantity: 10, price: 40, pricePerDose: 4 },
      { strength: '50mg', quantity: 30, price: 90, pricePerDose: 3 },
      { strength: '100mg', quantity: 10, price: 50, pricePerDose: 5 },
      { strength: '100mg', quantity: 30, price: 120, pricePerDose: 4 },
    ]
  },
  'finasteride': {
    name: 'Finasteride',
    genericFor: 'Propecia®',
    category: 'Hair Loss',
    image: '💊',
    dosages: [
      { strength: '1mg', quantity: 30, price: 25, pricePerDose: 0.83 },
      { strength: '1mg', quantity: 90, price: 60, pricePerDose: 0.67 },
    ]
  },
  'minoxidil': {
    name: 'Minoxidil',
    genericFor: 'Rogaine®',
    category: 'Hair Loss',
    image: '🧴',
    dosages: [
      { strength: '5%', quantity: 1, price: 35, unit: 'bottle', pricePerDose: 35 },
      { strength: '5%', quantity: 3, price: 90, unit: 'bottles', pricePerDose: 30 },
    ]
  }
};

interface CheckoutFormProps {
  consultationId?: string | null;
  prescriptions?: any[];
}

function CheckoutForm({ consultationId, prescriptions = [] }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<'medication' | 'billing' | 'payment'>('medication');
  
  // Medication selection
  const [selectedMedication, setSelectedMedication] = useState('sildenafil');
  const [selectedDosage, setSelectedDosage] = useState(0);
  const [isSubscription, setIsSubscription] = useState(true); // Default to subscription like Hims
  
  // Billing information
  const [billingDetails, setBillingDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Shipping information
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Pre-fill user data if logged in
  useEffect(() => {
    const user = authService.getUser();
    if (user) {
      setBillingDetails(prev => ({
        ...prev,
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      }));
    }
  }, []);

  // Calculate pricing
  const medication = MEDICATIONS[selectedMedication as keyof typeof MEDICATIONS];
  const dosage = medication?.dosages[selectedDosage];
  const basePrice = dosage?.price || 0;
  const subscriptionDiscount = isSubscription ? 0.15 : 0; // 15% off for subscriptions
  const subtotal = basePrice;
  const discount = subtotal * subscriptionDiscount;
  const shipping = subtotal >= 50 ? 0 : 5;
  const tax = (subtotal - discount) * 0.08;
  const total = subtotal - discount + shipping + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: `${billingDetails.firstName} ${billingDetails.lastName}`,
          email: billingDetails.email,
          phone: billingDetails.phone,
          address: {
            line1: billingDetails.address,
            line2: billingDetails.address2,
            city: billingDetails.city,
            state: billingDetails.state,
            postal_code: billingDetails.zipCode,
            country: 'US',
          },
        },
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      // Create order through API
      const orderData = {
        paymentMethodId: paymentMethod.id,
        consultationId,
        items: [{
          medicationId: selectedMedication,
          name: medication.name,
          dosage: dosage.strength,
          quantity: dosage.quantity,
          price: basePrice,
          isSubscription,
        }],
        shippingAddress: sameAsShipping ? billingDetails : {
          ...billingDetails,
          ...shippingAddress
        },
        billingAddress: billingDetails,
        totals: {
          subtotal,
          discount,
          shipping,
          tax,
          total
        }
      };

      const result = await api.post<any>('/api/orders', orderData);

      if ((result as any)?.success === false) {
        throw new Error((result as any)?.error || 'Order processing failed');
      }
      
      if ((result as any)?.orderId) {
        // Show success message
        toast.success('Order placed successfully!');
        
        // Redirect to order confirmation
        router.push(`/patient/orders/${(result as any).orderId}?success=true`);
      } else {
        throw new Error('Order processing failed');
      }
    } catch (err: any) {
      const message = err?.error || err?.message || 'Payment processing failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        <button
          type="button"
          onClick={() => setActiveStep('medication')}
          className={`flex-1 py-3 text-center text-sm font-medium transition-all ${
            activeStep === 'medication' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } rounded-l-lg`}
        >
          <span className="hidden sm:inline">1. </span>Medication
        </button>
        <button
          type="button"
          onClick={() => billingDetails.firstName && setActiveStep('billing')}
          disabled={!billingDetails.firstName}
          className={`flex-1 py-3 text-center text-sm font-medium transition-all ${
            activeStep === 'billing' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } ${!billingDetails.firstName && 'opacity-50 cursor-not-allowed'}`}
        >
          <span className="hidden sm:inline">2. </span>Shipping
        </button>
        <button
          type="button"
          onClick={() => billingDetails.address && setActiveStep('payment')}
          disabled={!billingDetails.address}
          className={`flex-1 py-3 text-center text-sm font-medium transition-all ${
            activeStep === 'payment' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } rounded-r-lg ${!billingDetails.address && 'opacity-50 cursor-not-allowed'}`}
        >
          <span className="hidden sm:inline">3. </span>Payment
        </button>
      </div>

      {/* Step 1: Medication Selection */}
      {activeStep === 'medication' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Your Medication</h2>
          
          {/* Medication Options */}
          <div className="space-y-4 mb-6">
            {Object.entries(MEDICATIONS).map(([key, med]) => (
              <label
                key={key}
                className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedMedication === key 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="medication"
                  value={key}
                  checked={selectedMedication === key}
                  onChange={(e) => {
                    setSelectedMedication(e.target.value);
                    setSelectedDosage(0);
                  }}
                  className="sr-only"
                />
                <div className="flex items-start">
                  <span className="text-3xl mr-4">{med.image}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{med.name}</h3>
                    <p className="text-sm text-gray-600">Generic for {med.genericFor}</p>
                    <p className="text-xs text-gray-500 mt-1">{med.category}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Dosage Selection */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3">Select Dosage & Quantity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {medication?.dosages.map((dose, idx) => (
                <label
                  key={idx}
                  className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedDosage === idx 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="dosage"
                    value={idx}
                    checked={selectedDosage === idx}
                    onChange={(e) => setSelectedDosage(parseInt(e.target.value))}
                    className="sr-only"
                  />
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{dose.strength}</p>
                      <p className="text-sm text-gray-600">
                        {dose.quantity} {'unit' in dose ? dose.unit : 'pills'}
                      </p>
                      <p className="text-xs text-gray-500">
                        ${dose.pricePerDose.toFixed(2)} per dose
                      </p>
                    </div>
                    <p className="text-lg font-bold">${dose.price}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Subscription Option */}
          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={isSubscription}
                onChange={(e) => setIsSubscription(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <div className="ml-3">
                <p className="font-semibold text-green-900">Subscribe & Save 15%</p>
                <p className="text-sm text-green-700">Free shipping + auto-refill every month</p>
                <p className="text-xs text-green-600 mt-1">Cancel anytime, no commitment</p>
              </div>
            </label>
          </div>

          <button
            type="button"
            onClick={() => setActiveStep('billing')}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue to Shipping
          </button>
        </div>
      )}

      {/* Step 2: Billing/Shipping Information */}
      {activeStep === 'billing' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={billingDetails.firstName}
                onChange={(e) => setBillingDetails({ ...billingDetails, firstName: e.target.value })}
                aria-label="First name for billing"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                value={billingDetails.lastName}
                onChange={(e) => setBillingDetails({ ...billingDetails, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={billingDetails.email}
                onChange={(e) => setBillingDetails({ ...billingDetails, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                required
                value={billingDetails.phone}
                onChange={(e) => setBillingDetails({ ...billingDetails, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                required
                value={billingDetails.address}
                onChange={(e) => setBillingDetails({ ...billingDetails, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apartment, suite, etc. (optional)
              </label>
              <input
                type="text"
                value={billingDetails.address2}
                onChange={(e) => setBillingDetails({ ...billingDetails, address2: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                required
                value={billingDetails.city}
                onChange={(e) => setBillingDetails({ ...billingDetails, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                required
                value={billingDetails.state}
                onChange={(e) => setBillingDetails({ ...billingDetails, state: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select State</option>
                <option value="CA">California</option>
                <option value="NY">New York</option>
                <option value="TX">Texas</option>
                <option value="FL">Florida</option>
                {/* Add all states */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code
              </label>
              <input
                type="text"
                required
                pattern="[0-9]{5}"
                value={billingDetails.zipCode}
                onChange={(e) => setBillingDetails({ ...billingDetails, zipCode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={() => setActiveStep('medication')}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setActiveStep('payment')}
              className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {activeStep === 'payment' && (
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between pb-4 border-b">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">{medication?.image}</span>
                  <div>
                    <h3 className="font-semibold">{medication?.name}</h3>
                    <p className="text-sm text-gray-600">
                      {dosage?.strength} • {dosage?.quantity} {dosage && 'unit' in dosage ? dosage.unit : 'pills'}
                    </p>
                    {isSubscription && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Subscribe & Save (15% off)
                      </p>
                    )}
                  </div>
                </div>
                <p className="font-semibold">${basePrice.toFixed(2)}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Subscription Discount (15%)</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                    {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">${total.toFixed(2)}</span>
                </div>
                {isSubscription && (
                  <p className="text-xs text-gray-600 mt-1">
                    Then ${total.toFixed(2)}/month. Cancel anytime.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Information</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Details
              </label>
              <div className="p-4 border border-gray-300 rounded-lg">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                      invalid: {
                        color: '#9e2146',
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Billing address same as shipping */}
            <label className="flex items-center mb-6">
              <input
                type="checkbox"
                checked={sameAsShipping}
                onChange={(e) => setSameAsShipping(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm">Billing address same as shipping</span>
            </label>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setActiveStep('billing')}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!stripe || processing}
                className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Complete Order - $${total.toFixed(2)}`
                )}
              </button>
            </div>

            {/* Security Badge */}
            <div className="mt-6 flex items-center justify-center text-xs text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Your payment information is encrypted and secure</span>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🔒</div>
              <p className="text-xs text-gray-600">HIPAA Compliant</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-xs text-gray-600">FDA Approved</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🚚</div>
              <p className="text-xs text-gray-600">Free Shipping</p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const consultationId = searchParams.get('consultationId');
  const medication = searchParams.get('medication');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm mb-4">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Order</h1>
          <p className="text-gray-600 mt-2">Secure checkout • Free shipping on orders $50+</p>
        </div>

        {/* Checkout Form */}
        <Elements stripe={stripePromise}>
          <CheckoutForm consultationId={consultationId} prescriptions={[]} />
        </Elements>

        {/* Customer Support */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            Need help? Call us at{' '}
            <a href="tel:1-888-555-0123" className="font-medium text-blue-600 hover:text-blue-700">
              1-888-555-0123
            </a>
            {' '}or{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-700">
              chat with support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
