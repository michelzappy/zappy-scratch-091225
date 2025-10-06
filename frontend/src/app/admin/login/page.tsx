'use client';

import { useUser } from '@stackframe/stack';
import { SignIn } from '@stackframe/stack';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Force dynamic rendering for Stack Auth
export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // User is authenticated, redirect to portal dashboard
      // The portal dashboard has role-based access control
      router.push('/portal/dashboard');
    }
  }, [user, router]);

  // Show loading state while checking authentication
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

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
            Administrator Access
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Secure access to system administration
          </p>
        </div>
        
        {/* Stack Auth Sign In Component */}
        <SignIn />

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
            <Link
              href="/patient/login"
              className="text-red-600 hover:text-red-500"
            >
              Patient Portal
            </Link>{' '}
            |{' '}
            <Link
              href="/portal/login"
              className="text-red-600 hover:text-red-500"
            >
              Provider Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
