'use client';

import { SignUp } from '@stackframe/stack';
import Link from 'next/link';

// Force dynamic rendering for Stack Auth
export const dynamic = 'force-dynamic';

export default function PatientRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-coral-600 mb-4">
            Zappy
          </h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Create Your Account
          </h2>
          <p className="text-gray-600">
            Join our telehealth platform to get started with your care
          </p>
        </div>
        
        {/* Stack Auth Sign Up Component */}
        <SignUp />

        <div className="text-center">
          <span className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/patient/login"
              className="font-medium text-coral-600 hover:text-coral-700"
            >
              Sign in here
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
