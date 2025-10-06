'use client';

import { useUser } from '@stackframe/stack';
import { SignIn } from '@stackframe/stack';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Force dynamic rendering for Stack Auth
export const dynamic = 'force-dynamic';

export default function PortalLoginPage() {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // User is authenticated, redirect to portal dashboard
      router.push('/portal/dashboard');
    }
  }, [user, router]);

  // Show loading state while checking authentication
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

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
            Provider & Admin Access
          </p>
        </div>

        {/* Stack Auth Sign In Component */}
        <SignIn />

        {/* Footer Links */}
        <div className="text-center">
          <Link href="/patient/login" className="text-sm text-gray-600 hover:text-gray-900">
            Patient Portal
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          © 2024 Zappy Health. All rights reserved.
        </p>
      </div>
    </div>
  );
}
