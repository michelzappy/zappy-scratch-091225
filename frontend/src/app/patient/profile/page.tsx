'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'billing'>('profile');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
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
                  ? 'bg-medical-50 text-medical-700 border-b-2 border-medical-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
                  <h3 className="font-semibold text-slate-900">John Doe</h3>
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
                    className="text-sm text-medical-600 hover:text-medical-700 mt-1"
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
                      defaultValue="John"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Doe"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue="john.doe@example.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      defaultValue="(555) 123-4567"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
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
                    defaultValue="123 Main Street"
                    placeholder="Street Address"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      defaultValue="San Francisco"
                      placeholder="City"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                    />
                    <input
                      type="text"
                      defaultValue="94102"
                      placeholder="ZIP"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Two-Factor Authentication</h3>
                <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">SMS Authentication</p>
                    <p className="text-xs text-slate-600 mt-1">Get codes via text message</p>
                  </div>
                  <button 
                    onClick={() => {
                      // Handle 2FA setup
                      console.log('Setting up two-factor authentication');
                      // TODO: Navigate to 2FA setup flow
                    }}
                    className="px-4 py-2 bg-medical-600 text-white text-sm rounded-lg hover:bg-medical-700 transition-colors"
                  >
                    Enable
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              {[
                { title: '📦 Order Updates', description: 'Shipping and delivery alerts' },
                { title: '💊 Dose Reminders', description: 'Daily medication reminders' },
                { title: '🔄 Refill Alerts', description: 'When to reorder' },
                { title: '👨‍⚕️ Provider Messages', description: 'Messages from doctors' },
                { title: '🎯 Special Offers', description: 'Deals and promotions' },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-600"></div>
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
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-slate-700 rounded flex items-center justify-center text-xs font-bold text-white">
                        VISA
                      </div>
                      <div>
                        <p className="text-sm font-medium">•••• 4242</p>
                        <p className="text-xs text-slate-600">Expires 12/26</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                      Primary
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      // Handle adding payment method
                      console.log('Adding new payment method');
                      // TODO: Navigate to payment method setup
                    }}
                    className="w-full py-2.5 px-4 border-2 border-dashed border-slate-300 text-slate-600 rounded-xl hover:border-slate-400 hover:text-slate-700 transition-colors text-sm"
                  >
                    + Add Payment Method
                  </button>
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
                    <div key={idx} className="flex items-center justify-between py-2.5 px-3 hover:bg-slate-50 rounded-lg transition-colors">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{charge.date}</p>
                        <p className="text-xs text-slate-600">{charge.desc}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{charge.amount}</p>
                        <button 
                          onClick={() => {
                            // Handle receipt download
                            console.log(`Downloading receipt for ${charge.date} - ${charge.amount}`);
                            // TODO: Generate and download receipt PDF
                          }}
                          className="text-xs text-medical-600 hover:text-medical-700"
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
          className="w-full lg:w-auto px-6 py-3 bg-medical-600 text-white rounded-xl font-medium hover:bg-medical-700 transition-colors shadow-sm"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
