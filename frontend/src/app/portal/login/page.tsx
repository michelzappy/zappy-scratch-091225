'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@/components/Alert';
import { authService } from '@/lib/auth';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

// JWT utility for demo tokens
const createDemoJWT = (user: any) => {
  // Simple JWT creation for demo purposes (not cryptographically secure)
  const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));
  const payload = btoa(JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    metadata: user.metadata || {},
    verified: user.verified,
    created_at: user.created_at || new Date().toISOString(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (3600 * 24) // 24 hours
  }));
  
  // Demo signature - in production this would be HMAC-SHA256
  const signature = btoa('demo-signature-' + user.id);
  
  return `${header}.${payload}.${signature}`;
};

export default function UnifiedLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use auth service for proper API communication
      const response = await authService.login(email, password, 'provider');
      
      // Redirect to dashboard - auth service handles token storage
      router.push('/portal/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo login functions for testing - using auth service
  const demoLogin = (role: UserRole, name: string, title: string) => {
    // Create mock user data in the correct format
    const mockUser = {
      id: `demo-${role}-${Date.now()}`,
      email: email || `${role}@zappyhealth.com`,
      firstName: name.split(' ')[0] || 'Demo',
      lastName: name.split(' ').slice(1).join(' ') || 'User',
      role: role, // Keep the role as is
      verified: true,
      metadata: {
        title: title,
        providerStatus: role.includes('provider') ? 'active' : undefined
      },
      created_at: new Date().toISOString()
    };

    // Create proper JWT tokens for demo mode
    const accessToken = createDemoJWT(mockUser);
    const refreshToken = createDemoJWT({
      ...mockUser,
      tokenVersion: 0,
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 3600) // 30 days
    });

    // Store auth data using the same keys as auth service
    localStorage.setItem('telehealth_access_token', accessToken);
    localStorage.setItem('telehealth_refresh_token', refreshToken);
    localStorage.setItem('telehealth_user', JSON.stringify(mockUser));
    
    router.push('/portal/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div>
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">Z</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Zappy Health Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="bg-white shadow-xl rounded-lg px-8 py-8 space-y-6">
            {error && (
              <Alert type="danger" title="Login Failed" message={error} />
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-gray-600 hover:text-gray-900">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Demo Access Section */}
        <div className="bg-white shadow-xl rounded-lg px-8 py-6">
          <p className="text-xs text-gray-500 text-center mb-4">
            Quick demo access (development only)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => demoLogin('provider', 'Dr. Jane Smith', 'Dermatologist')}
              className="px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition"
            >
              Provider Login
            </button>
            <button
              onClick={() => demoLogin('admin', 'John Admin', 'Administrator')}
              className="px-3 py-2 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition"
            >
              Admin Login
            </button>
            <button
              onClick={() => demoLogin('provider-admin', 'Dr. Sarah Jones', 'Medical Director')}
              className="px-3 py-2 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition"
            >
              Provider+Admin
            </button>
            <button
              onClick={() => demoLogin('super-admin', 'System Admin', 'Super Administrator')}
              className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
            >
              Super Admin
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          © 2024 Zappy Health. All rights reserved.
        </p>
      </div>
    </div>
  );
}
