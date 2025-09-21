'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: 'dev@admin.com', // Pre-fill with dev account for testing
    password: 'dev123456',   // Pre-fill with dev password for testing
    rememberMe: false,
    twoFactorCode: ''
  });
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already authenticated as admin
    if (authService.isAuthenticated() && authService.isAdmin()) {
      router.push('/portal/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authService.loginAdmin(
        formData.email,
        formData.password,
        formData.twoFactorCode || undefined
      );
      
      // Check if 2FA is required
      if ('requiresTwoFactor' in result) {
        setShowTwoFactor(true);
        setError('');
        setLoading(false);
        return;
      }
      
      // Success - redirect to portal dashboard
      router.push('/portal/dashboard');
      
    } catch (err: any) {
      const errorMessage = err.message || 'Invalid credentials. Please try again.';
      
      if (errorMessage.includes('2FA') || errorMessage.includes('two-factor')) {
        setError('Invalid two-factor authentication code.');
      } else {
        setError(errorMessage);
      }
      
      console.error('Admin login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setShowTwoFactor(false);
    setFormData(prev => ({
      ...prev,
      twoFactorCode: ''
    }));
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m0-8V7a4 4 0 118 0v4M5 11h14l-1 7H6l-1-7z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {showTwoFactor ? 'Two-Factor Authentication' : 'Administrator Access'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showTwoFactor 
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Secure access to system administration'
            }
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {!showTwoFactor ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Administrator Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter your admin email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-red-600 hover:text-red-500">
                    Emergency access?
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-4">
                  Signed in as: <strong>{formData.email}</strong>
                </div>
              </div>

              <div>
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700">
                  Authentication Code
                </label>
                <input
                  id="twoFactorCode"
                  name="twoFactorCode"
                  type="text"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={formData.twoFactorCode}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 text-center text-lg font-mono"
                  placeholder="000000"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm text-red-600 hover:text-red-500"
                >
                  ← Back to login
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {showTwoFactor ? 'Verifying...' : 'Authenticating...'}
                </>
              ) : (
                showTwoFactor ? 'Verify & Sign In' : 'Sign In as Admin'
              )}
            </button>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p><strong>⚠️ Administrator Access Only</strong></p>
              <p>This portal provides system-wide administrative capabilities.</p>
              <p>All access attempts are logged and monitored.</p>
              <p>Unauthorized access will be reported to security.</p>
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs text-gray-400">
              Need different access?{' '}
              <button
                type="button"
                onClick={() => router.push('/patient/login')}
                className="text-red-600 hover:text-red-500"
              >
                Patient Portal
              </button>{' '}
              |{' '}
              <button
                type="button"
                onClick={() => router.push('/provider/login')}
                className="text-red-600 hover:text-red-500"
              >
                Provider Portal
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
