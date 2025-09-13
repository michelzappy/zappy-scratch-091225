'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Mock authentication - in production, this would call your auth API
      if (email === 'admin@telehealth.com' && password === 'Admin@2024!Secure') {
        // Store admin session
        localStorage.setItem('adminToken', 'mock-admin-token');
        localStorage.setItem('userRole', 'admin');
        router.push('/admin/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick access for testing
  const quickAccess = () => {
    localStorage.setItem('adminToken', 'mock-admin-token');
    localStorage.setItem('userRole', 'admin');
    router.push('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-medical-600 text-white rounded-full mb-4">
            <span className="text-2xl font-bold">🏥</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Portal</h1>
          <p className="text-sm text-slate-600 mt-2">Sign in to manage the platform</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500"
                placeholder="admin@telehealth.com"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500"
                placeholder="Enter your password"
                required
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-medical-600 border-slate-300 rounded focus:ring-medical-500"
                />
                <span className="ml-2 text-sm text-slate-600">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-medical-600 hover:text-medical-700"
              >
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-medical-600 text-white font-medium rounded-lg hover:bg-medical-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              This is a secure admin area. All activities are logged and monitored.
              Unauthorized access attempts will be reported.
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 font-medium mb-1">Demo Credentials</p>
          <p className="text-xs text-yellow-700">Email: admin@telehealth.com</p>
          <p className="text-xs text-yellow-700">Password: Admin@2024!Secure</p>
          
          {/* Quick Access Button for Testing */}
          <button
            onClick={quickAccess}
            className="mt-3 w-full py-2 bg-yellow-600 text-white text-sm font-medium rounded hover:bg-yellow-700 transition"
          >
            Quick Access (Skip Login)
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-6 text-center space-x-4">
          <button
            onClick={() => router.push('/patient/login')}
            className="text-sm text-slate-600 hover:text-medical-600"
          >
            Patient Login →
          </button>
          <button
            onClick={() => router.push('/provider/login')}
            className="text-sm text-slate-600 hover:text-medical-600"
          >
            Provider Login →
          </button>
        </div>
      </div>
    </div>
  );
}
