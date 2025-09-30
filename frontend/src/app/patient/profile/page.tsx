'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'billing'>('profile');
  const [showSuccess, setShowSuccess] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showCodeSent, setShowCodeSent] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showCardAdded, setShowCardAdded] = useState(false);
  const [showReceiptDownloaded, setShowReceiptDownloaded] = useState(false);
  const [showReceipt, setShowReceipt] = useState<{ date: string; amount: string; desc: string } | null>(null);
  const [newCardDetails, setNewCardDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardholderName: ''
  });
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      type: 'VISA',
      last4: '4242',
      expiry: '12/26',
      isPrimary: true
    }
  ]);

  // Profile form data
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    streetAddress: '123 Main Street',
    city: 'San Francisco',
    zipCode: '94102'
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    orderUpdates: true,
    doseReminders: true,
    refillAlerts: true,
    providerMessages: true,
    specialOffers: true
  });

  const handleSave = () => {
    // Show success message for any tab
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // Save notification settings to sessionStorage (temporary cache)
    if (activeTab === 'notifications') {
      sessionStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    }

    // In a real app, you would save different data based on the active tab
    // if (activeTab === 'profile') {
    //   apiClient.profile.update(profileData).then(...).catch(...);
    // } else if (activeTab === 'security') {
    //   apiClient.security.update(securityData).then(...).catch(...);
    // } else if (activeTab === 'notifications') {
    //   apiClient.notifications.update(notificationSettings).then(...).catch(...);
    // } else if (activeTab === 'billing') {
    //   apiClient.billing.update(billingData).then(...).catch(...);
    // }
  };

  const updateProfileField = (field: keyof typeof profileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Profile & Settings</h1>
        <p className="text-sm text-slate-600 mt-1">Manage your account information</p>
      </div>

      {showSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl">
          <p className="text-sm font-medium">✓ Changes saved successfully</p>
        </div>
      )}

      {showCodeSent && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-white shadow-lg rounded-xl p-4 flex items-start gap-3 max-w-sm border border-slate-200">
                  <div className="flex-shrink-0 w-10 h-10 bg-coral-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-coral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Verification code sent</p>
              <p className="text-sm text-slate-600 mt-0.5">Check your messages at {phoneNumber}</p>
            </div>
            <button
              onClick={() => setShowCodeSent(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showCardAdded && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-white shadow-lg rounded-xl p-4 flex items-start gap-3 max-w-sm border border-slate-200">
            <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Payment method added</p>
              <p className="text-sm text-slate-600 mt-0.5">Your new card has been saved successfully</p>
            </div>
            <button
              onClick={() => setShowCardAdded(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showReceiptDownloaded && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-white shadow-lg rounded-xl p-4 flex items-start gap-3 max-w-sm border border-slate-200">
            <div className="flex-shrink-0 w-10 h-10 bg-medical-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-medical-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Receipt downloaded</p>
              <p className="text-sm text-slate-600 mt-0.5">Check your downloads folder</p>
            </div>
            <button
              onClick={() => setShowReceiptDownloaded(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Mobile-First Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200">
          {[
            { id: 'profile', label: 'Profile', icon: '👤' },
            { id: 'security', label: 'Security', icon: '🔒' },
            { id: 'notifications', label: 'Alerts', icon: '🔔' },
            { id: 'billing', label: 'Billing', icon: '💳' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[100px] px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-coral-50 text-coral-700 border-b-2 border-coral-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-cream-100'
              }`}
            >
              <span className="lg:hidden text-lg">{tab.icon}</span>
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 lg:p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Photo - Mobile First */}
              <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
                <img
                  src="/Alex.webp"
                  alt="Profile"
                  className="w-16 h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 border-white shadow-md"
                />
                <div>
                  <h3 className="font-semibold text-slate-900">{profileData.firstName} {profileData.lastName}</h3>
                  <button 
                    onClick={() => {
                      // Handle photo change
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                        console.log('Photo selected:', file.name);
                        // Upload photo to server via API
                        const formData = new FormData();
                        formData.append('profile_photo', file);
                        apiClient.files.upload(formData)
                          .then(() => console.log('Profile photo uploaded successfully'))
                          .catch(err => console.error('Failed to upload photo:', err));
                        }
                      };
                      input.click();
                    }}
                    className="text-sm text-coral-600 hover:text-coral-700 mt-1"
                  >
                    Change Photo
                  </button>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => updateProfileField('firstName', e.target.value)}
                      className="w-full px-3 py-2 bg-cream-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => updateProfileField('lastName', e.target.value)}
                      className="w-full px-3 py-2 bg-cream-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => updateProfileField('email', e.target.value)}
                      className="w-full px-3 py-2 bg-cream-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => updateProfileField('phone', e.target.value)}
                      className="w-full px-3 py-2 bg-cream-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Shipping Address</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={profileData.streetAddress}
                    onChange={(e) => updateProfileField('streetAddress', e.target.value)}
                    placeholder="Street Address"
                    className="w-full px-3 py-2 bg-cream-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:bg-white transition-colors"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={profileData.city}
                      onChange={(e) => updateProfileField('city', e.target.value)}
                      placeholder="City"
                      className="w-full px-3 py-2 bg-cream-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:bg-white transition-colors"
                    />
                    <input
                      type="text"
                      value={profileData.zipCode}
                      onChange={(e) => updateProfileField('zipCode', e.target.value)}
                      placeholder="ZIP"
                      className="w-full px-3 py-2 bg-cream-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Change Password</h3>
                <div className="space-y-3 max-w-md">
                  <input
                    type="password"
                    placeholder="Current Password"
                    className="w-full px-3 py-2 bg-cream-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:bg-white transition-colors"
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    className="w-full px-3 py-2 bg-cream-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    className="w-full px-3 py-2 bg-cream-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Two-Factor Authentication</h3>
                {!show2FASetup ? (
                  <div className="bg-cream-100 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">SMS Authentication</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {is2FAEnabled ? 'Enabled - Codes sent to your phone' : 'Get codes via text message'}
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        if (is2FAEnabled) {
                          // Handle disable
                          if (confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
                            setIs2FAEnabled(false);
                            setShowSuccess(true);
                            setTimeout(() => setShowSuccess(false), 3000);
                          }
                        } else {
                          // Handle enable
                          setShow2FASetup(true);
                        }
                      }}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                        is2FAEnabled 
                          ? 'bg-red-600 text-white hover:bg-red-700' 
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {is2FAEnabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-cream-100 rounded-xl p-4 space-y-4">
                    {!isVerifying ? (
                      <>
                        <p className="text-sm text-slate-700">Enter your phone number to receive verification codes</p>
                        <input
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 transition-colors"
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              if (phoneNumber.trim()) {
                                setIsVerifying(true);
                                // In a real app, this would send SMS
                                setShowCodeSent(true);
                                // Auto-hide the notification after 5 seconds
                                setTimeout(() => {
                                  setShowCodeSent(false);
                                }, 5000);
                              }
                            }}
                            disabled={!phoneNumber.trim()}
                            className="px-4 py-3 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                          >
                            Send Code
                          </button>
                          <button 
                            onClick={() => {
                              setShow2FASetup(false);
                              setPhoneNumber('');
                              setVerificationCode('');
                              setIsVerifying(false);
                            }}
                            className="px-4 py-3 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-slate-700">Enter the 6-digit code sent to {phoneNumber}</p>
                        <input
                          type="text"
                          placeholder="123456"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-coral-500 transition-colors"
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              if (verificationCode.length === 6) {
                                setIs2FAEnabled(true);
                                setShow2FASetup(false);
                                setShowSuccess(true);
                                setPhoneNumber('');
                                setVerificationCode('');
                                setIsVerifying(false);
                                setTimeout(() => setShowSuccess(false), 3000);
                              }
                            }}
                            disabled={verificationCode.length !== 6}
                            className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                          >
                            Verify
                          </button>
                          <button 
                            onClick={() => {
                              setIsVerifying(false);
                              setVerificationCode('');
                            }}
                            className="px-4 py-2 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300 transition-colors"
                          >
                            Back
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              {[
                { id: 'orderUpdates', title: '📦 Order Updates', description: 'Shipping and delivery alerts' },
                { id: 'doseReminders', title: '💊 Dose Reminders', description: 'Daily medication reminders' },
                { id: 'refillAlerts', title: '🔄 Refill Alerts', description: 'When to reorder' },
                { id: 'providerMessages', title: '👨‍⚕️ Provider Messages', description: 'Messages from doctors' },
                { id: 'specialOffers', title: '🎯 Special Offers', description: 'Deals and promotions' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationSettings[item.id as keyof typeof notificationSettings]}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        [item.id]: e.target.checked
                      }))}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral-500"></div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Payment Methods */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Payment Methods</h3>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 bg-cream-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-8 rounded flex items-center justify-center text-xs font-bold text-white ${
                          method.type === 'VISA' ? 'bg-slate-700' : 
                          method.type === 'MASTERCARD' ? 'bg-red-600' : 
                          method.type === 'AMEX' ? 'bg-coral-500' : 'bg-gray-600'
                        }`}>
                          {method.type === 'MASTERCARD' ? 'MC' : method.type}
                        </div>
                        <div>
                          <p className="text-sm font-medium">•••• {method.last4}</p>
                          <p className="text-xs text-slate-600">Expires {method.expiry}</p>
                        </div>
                      </div>
                      {method.isPrimary && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                  {!showAddPayment ? (
                    <button 
                      onClick={() => setShowAddPayment(true)}
                      className="w-full py-2.5 px-4 border-2 border-dashed border-slate-300 text-slate-600 rounded-xl hover:border-slate-400 hover:text-slate-700 transition-colors text-sm"
                    >
                      + Add Payment Method
                    </button>
                  ) : (
                    <div className="bg-cream-100 rounded-xl p-4 space-y-4">
                      <h4 className="text-sm font-medium text-slate-900">Add New Payment Method</h4>
                      
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={newCardDetails.cardholderName}
                          onChange={(e) => {
                            // Only allow letters and spaces
                            const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                            setNewCardDetails(prev => ({ ...prev, cardholderName: value }));
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={newCardDetails.cardNumber}
                          onChange={(e) => {
                            // Only allow numbers, remove any non-numeric characters
                            const value = e.target.value.replace(/[^\d\s]/g, '').replace(/\s/g, '');
                            const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                            if (value.length <= 16) {
                              setNewCardDetails(prev => ({ ...prev, cardNumber: formatted }));
                            }
                          }}
                          onKeyPress={(e) => {
                            // Prevent non-numeric key presses (except space which we handle in onChange)
                            if (!/[\d\s]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-medical-500 transition-colors"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={newCardDetails.expiry}
                            onChange={(e) => {
                              // Only allow numbers and forward slash
                              let value = e.target.value.replace(/[^\d/]/g, '').replace(/\D/g, '');
                              if (value.length >= 2) {
                                value = value.slice(0, 2) + '/' + value.slice(2, 4);
                              }
                              if (value.length <= 5) {
                                setNewCardDetails(prev => ({ ...prev, expiry: value }));
                              }
                            }}
                            onKeyPress={(e) => {
                              // Only allow digits
                              if (!/\d/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            CVV
                          </label>
                          <input
                            type="text"
                            placeholder="123"
                            value={newCardDetails.cvv}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              if (value.length <= 4) {
                                setNewCardDetails(prev => ({ ...prev, cvv: value }));
                              }
                            }}
                            onKeyPress={(e) => {
                              // Only allow digits
                              if (!/\d/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 transition-colors"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // Validate card details
                            if (newCardDetails.cardholderName && 
                                newCardDetails.cardNumber.replace(/\s/g, '').length === 16 && 
                                newCardDetails.expiry.length === 5 && 
                                newCardDetails.cvv.length >= 3) {
                              
                              // Detect card type based on first digit
                              const firstDigit = newCardDetails.cardNumber.charAt(0);
                              let cardType = 'VISA';
                              if (firstDigit === '5') cardType = 'MASTERCARD';
                              else if (firstDigit === '3') cardType = 'AMEX';
                              else if (firstDigit === '6') cardType = 'DISCOVER';
                              
                              // Add new payment method to the list
                              const newMethod = {
                                id: Date.now(), // Simple ID generation
                                type: cardType,
                                last4: newCardDetails.cardNumber.replace(/\s/g, '').slice(-4),
                                expiry: newCardDetails.expiry,
                                isPrimary: paymentMethods.length === 0
                              };
                              
                              setPaymentMethods(prev => [...prev, newMethod]);
                              
                              // Show passive success notification
                              setShowCardAdded(true);
                              setTimeout(() => setShowCardAdded(false), 5000);
                              
                              // Reset form
                              setShowAddPayment(false);
                              setNewCardDetails({
                                cardNumber: '',
                                expiry: '',
                                cvv: '',
                                cardholderName: ''
                              });
                              
                              // In a real app, save to backend
                              // apiClient.billing.addPaymentMethod({...newCardDetails, type: cardType})
                            } else {
                              alert('Please fill in all card details correctly');
                            }
                          }}
                          className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          Add Card
                        </button>
                        <button
                          onClick={() => {
                            setShowAddPayment(false);
                            setNewCardDetails({
                              cardNumber: '',
                              expiry: '',
                              cvv: '',
                              cardholderName: ''
                            });
                          }}
                          className="px-4 py-2 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Charges */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Charges</h3>
                <div className="space-y-2">
                  {[
                    { date: 'Dec 9', amount: '$299', desc: 'Monthly' },
                    { date: 'Nov 9', amount: '$299', desc: 'Monthly' },
                    { date: 'Oct 9', amount: '$328', desc: 'Monthly + Extra' },
                  ].map((charge, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2.5 px-3 hover:bg-cream-100 rounded-lg transition-colors">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{charge.date}</p>
                        <p className="text-xs text-slate-600">{charge.desc}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{charge.amount}</p>
                        <button 
                          onClick={() => setShowReceipt(charge)}
                          className="text-xs text-coral-600 hover:text-coral-700"
                        >
                          Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button - Mobile Optimized */}
      <div className="fixed bottom-20 lg:relative lg:bottom-auto left-0 right-0 p-4 bg-white border-t border-slate-200 lg:border-0 lg:p-0">
        <button 
          onClick={handleSave}
          className="w-full lg:w-auto px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-sm"
        >
          Save Changes
        </button>
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Receipt Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Payment Receipt</h2>
                <button
                  onClick={() => setShowReceipt(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Receipt Content */}
            <div className="p-6" id="receipt-content">
              {/* Company Info */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-coral-600">Zappy Health</h3>
                <p className="text-sm text-slate-600 mt-1">Your Telehealth Partner</p>
              </div>

              {/* Receipt Details */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Receipt #</span>
                  <span className="text-sm font-medium">{Date.now().toString().slice(-8)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Date</span>
                  <span className="text-sm font-medium">{showReceipt.date}, 2024</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Patient</span>
                  <span className="text-sm font-medium">{profileData.firstName} {profileData.lastName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Email</span>
                  <span className="text-sm font-medium">{profileData.email}</span>
                </div>
              </div>

              {/* Service Details */}
              <div className="bg-cream-100 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Service Details</h4>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-slate-600">{showReceipt.desc} Subscription</span>
                  <span className="text-sm font-medium">{showReceipt.amount}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-emerald-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Total Paid</p>
                    <p className="text-xs text-emerald-700 mt-1">
                      Via {paymentMethods[0]?.type || 'VISA'} ending in {paymentMethods[0]?.last4 || '4242'}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-emerald-900">{showReceipt.amount}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-slate-500">
                <p>Thank you for your payment!</p>
                <p className="mt-2">Questions? Contact support@zappyhealth.com</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  // Generate receipt HTML content
                  const receiptHTML = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="UTF-8">
                      <title>Receipt - Zappy Health</title>
                      <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { 
                          font-family: Arial, sans-serif; 
                          line-height: 1.6;
                          color: #333;
                          background: white;
                        }
                        .container {
                          max-width: 600px;
                          margin: 0 auto;
                          padding: 40px;
                        }
                        .header {
                          text-align: center;
                          margin-bottom: 40px;
                          padding-bottom: 20px;
                          border-bottom: 2px solid #e5e7eb;
                        }
                        .logo {
                          font-size: 28px;
                          font-weight: bold;
                          color: #0891b2;
                          margin-bottom: 8px;
                        }
                        .subtitle {
                          color: #64748b;
                          font-size: 14px;
                        }
                        .section {
                          margin-bottom: 30px;
                        }
                        .row {
                          display: flex;
                          justify-content: space-between;
                          padding: 12px 0;
                          border-bottom: 1px solid #f1f5f9;
                        }
                        .label {
                          color: #64748b;
                          font-size: 14px;
                        }
                        .value {
                          font-weight: 500;
                          font-size: 14px;
                          color: #1e293b;
                        }
                        .service-box {
                          background: #f8fafc;
                          padding: 20px;
                          border-radius: 8px;
                          margin: 20px 0;
                        }
                        .total-box {
                          background: #ecfdf5;
                          padding: 20px;
                          border-radius: 8px;
                          margin: 20px 0;
                          text-align: center;
                        }
                        .total-label {
                          color: #047857;
                          font-size: 16px;
                          margin-bottom: 8px;
                        }
                        .total-amount {
                          color: #047857;
                          font-size: 32px;
                          font-weight: bold;
                        }
                        .footer {
                          text-align: center;
                          margin-top: 40px;
                          padding-top: 20px;
                          border-top: 2px solid #e5e7eb;
                          color: #64748b;
                          font-size: 12px;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <div class="header">
                          <div class="logo">Zappy Health</div>
                          <div class="subtitle">Payment Receipt</div>
                        </div>
                        
                        <div class="section">
                          <div class="row">
                            <span class="label">Receipt Number</span>
                            <span class="value">#${Date.now().toString().slice(-8)}</span>
                          </div>
                          <div class="row">
                            <span class="label">Date</span>
                            <span class="value">${showReceipt.date}, 2024</span>
                          </div>
                          <div class="row">
                            <span class="label">Patient Name</span>
                            <span class="value">${profileData.firstName} ${profileData.lastName}</span>
                          </div>
                          <div class="row">
                            <span class="label">Email</span>
                            <span class="value">${profileData.email}</span>
                          </div>
                        </div>
                        
                        <div class="service-box">
                          <div class="row" style="border: none;">
                            <span class="label">Service</span>
                            <span class="value">${showReceipt.desc} Subscription</span>
                          </div>
                          <div class="row" style="border: none; margin-bottom: 0;">
                            <span class="label">Payment Method</span>
                            <span class="value">${paymentMethods[0]?.type || 'VISA'} ending in ${paymentMethods[0]?.last4 || '4242'}</span>
                          </div>
                        </div>
                        
                        <div class="total-box">
                          <div class="total-label">Total Paid</div>
                          <div class="total-amount">${showReceipt.amount}</div>
                        </div>
                        
                        <div class="footer">
                          <p>Thank you for your payment!</p>
                          <p style="margin-top: 10px;">Zappy Health Inc.</p>
                          <p>support@zappyhealth.com | 1-800-ZAPPY</p>
                        </div>
                      </div>
                    </body>
                    </html>
                  `;
                  
                  // Create a blob and download it
                  const blob = new Blob([receiptHTML], { type: 'text/html' });
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `zappy-receipt-${showReceipt.date.replace(/\s/g, '-')}-${Date.now()}.html`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                  
                  // Show success notification
                  setShowReceiptDownloaded(true);
                  setTimeout(() => setShowReceiptDownloaded(false), 3000);
                }}
                className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
              >
                Download Receipt
              </button>
              <button
                onClick={() => setShowReceipt(null)}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
