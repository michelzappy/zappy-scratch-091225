'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

export default function TestRolesPage() {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<UserRole>('provider');
  
  useEffect(() => {
    const storedRole = localStorage.getItem('userRole') as UserRole;
    if (storedRole) {
      setCurrentRole(storedRole);
    }
  }, []);

  const changeRole = (role: UserRole) => {
    localStorage.setItem('userRole', role);
    setCurrentRole(role);
    
    // Set sample user data for each role
    const userData = {
      provider: { name: 'Dr. Sarah Smith', title: 'Primary Care Physician' },
      admin: { name: 'John Admin', title: 'Office Manager' },
      'provider-admin': { name: 'Dr. Michael Chen', title: 'Medical Director' },
      'super-admin': { name: 'Alex System', title: 'IT Administrator' }
    };
    
    localStorage.setItem('userData', JSON.stringify(userData[role]));
  };

  const navigateToPortal = () => {
    router.push('/portal/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Portal Role Testing</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Current Role</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Active Role:</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              currentRole === 'provider' ? 'bg-blue-100 text-blue-800' :
              currentRole === 'admin' ? 'bg-purple-100 text-purple-800' :
              currentRole === 'provider-admin' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {currentRole === 'provider-admin' ? 'Provider + Admin' : currentRole}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Role to Test</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Provider Role */}
            <div className={`border rounded-lg p-4 cursor-pointer transition ${
              currentRole === 'provider' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`} onClick={() => changeRole('provider')}>
              <h3 className="font-semibold text-blue-700">Provider</h3>
              <p className="text-sm text-gray-600 mt-1">Clinical access only</p>
              <ul className="text-xs mt-2 space-y-1">
                <li>✓ Dashboard</li>
                <li>✓ Consultations</li>
                <li>✓ Patients (clinical)</li>
                <li>✓ Messages</li>
                <li className="text-red-600">✗ No admin features</li>
              </ul>
            </div>

            {/* Admin Role */}
            <div className={`border rounded-lg p-4 cursor-pointer transition ${
              currentRole === 'admin' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
            }`} onClick={() => changeRole('admin')}>
              <h3 className="font-semibold text-purple-700">Admin</h3>
              <p className="text-sm text-gray-600 mt-1">Administrative access only</p>
              <ul className="text-xs mt-2 space-y-1">
                <li>✓ Dashboard</li>
                <li>✓ Patients (limited)</li>
                <li>✓ Messages</li>
                <li>✓ All admin features</li>
                <li className="text-red-600">✗ No consultations</li>
              </ul>
            </div>

            {/* Provider-Admin Role */}
            <div className={`border rounded-lg p-4 cursor-pointer transition ${
              currentRole === 'provider-admin' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
            }`} onClick={() => changeRole('provider-admin')}>
              <h3 className="font-semibold text-green-700">Provider-Admin</h3>
              <p className="text-sm text-gray-600 mt-1">Both clinical & admin access</p>
              <ul className="text-xs mt-2 space-y-1">
                <li>✓ All clinical features</li>
                <li>✓ All admin features</li>
                <li>✓ Section headers shown</li>
              </ul>
            </div>

            {/* Super-Admin Role */}
            <div className={`border rounded-lg p-4 cursor-pointer transition ${
              currentRole === 'super-admin' ? 'border-gray-700 bg-gray-100' : 'border-gray-200 hover:border-gray-300'
            }`} onClick={() => changeRole('super-admin')}>
              <h3 className="font-semibold text-gray-700">Super-Admin</h3>
              <p className="text-sm text-gray-600 mt-1">System administrator</p>
              <ul className="text-xs mt-2 space-y-1">
                <li>✓ Everything Provider-Admin has</li>
                <li>✓ System configuration</li>
                <li>✓ Advanced settings</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Expected Navigation Items</h2>
          <div className="space-y-2">
            {currentRole === 'provider' && (
              <div className="text-sm">
                <p className="font-medium mb-2">You should see only:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• Dashboard</li>
                  <li>• Consultations</li>
                  <li>• Patients</li>
                  <li>• Messages</li>
                </ul>
                <p className="mt-3 text-red-600 font-medium">You should NOT see:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• Orders, Providers, Medications, Protocols, Plans, Forms, Pharmacy, Analytics, Settings</li>
                </ul>
              </div>
            )}
            
            {currentRole === 'admin' && (
              <div className="text-sm">
                <p className="font-medium mb-2">You should see:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• Dashboard</li>
                  <li>• Patients (limited view)</li>
                  <li>• Messages</li>
                  <li>• Orders</li>
                  <li>• Providers</li>
                  <li>• Medications</li>
                  <li>• Protocols</li>
                  <li>• Plans</li>
                  <li>• Forms</li>
                  <li>• Pharmacy</li>
                  <li>• Analytics</li>
                  <li>• Settings</li>
                </ul>
                <p className="mt-3 text-red-600 font-medium">You should NOT see:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• Consultations (clinical-only feature)</li>
                </ul>
              </div>
            )}
            
            {(currentRole === 'provider-admin' || currentRole === 'super-admin') && (
              <div className="text-sm">
                <p className="font-medium mb-2">You should see everything in two sections:</p>
                <p className="font-medium mt-2">Clinical Section:</p>
                <ul className="space-y-1 text-gray-600 ml-4">
                  <li>• Dashboard</li>
                  <li>• Consultations</li>
                  <li>• Patients</li>
                  <li>• Messages</li>
                </ul>
                <p className="font-medium mt-2">Administration Section:</p>
                <ul className="space-y-1 text-gray-600 ml-4">
                  <li>• Orders</li>
                  <li>• Providers</li>
                  <li>• Medications</li>
                  <li>• Protocols</li>
                  <li>• Plans</li>
                  <li>• Forms</li>
                  <li>• Pharmacy</li>
                  <li>• Analytics</li>
                  <li>• Settings</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={navigateToPortal}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
          >
            Go to Portal with {currentRole} Role
          </button>
        </div>
      </div>
    </div>
  );
}
