'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Skip layout for login page
  if (pathname === '/provider/login') {
    return <>{children}</>;
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/provider/dashboard',
      icon: '◉',
      badge: null
    },
    {
      name: 'Consultations',
      href: '/provider/consultations',
      icon: '◐',
      badge: 12
    },
    {
      name: 'Patients',
      href: '/provider/patients',
      icon: '◑',
      badge: null
    },
    {
      name: 'Messages',
      href: '/provider/messages',
      icon: '◒',
      badge: 3
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Ultra-Refined Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-56'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-gray-900 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">Z</span>
              </div>
              <span className="text-sm font-medium text-gray-900">Zappy Health</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 hover:bg-gray-100 rounded transition text-gray-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={sidebarCollapsed ? "M13 5l7 7-7 7" : "M11 19l-7-7 7-7"} />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm
                    ${isActive 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`text-lg ${isActive ? 'text-white' : 'text-gray-400'}`}>
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && (
                      <span className="font-medium">{item.name}</span>
                    )}
                  </div>
                  {!sidebarCollapsed && item.badge && (
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full ${
                      isActive ? 'bg-white text-gray-900' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          {!sidebarCollapsed && (
            <div className="my-6 border-t border-gray-200"></div>
          )}

          {/* Secondary Nav */}
          {!sidebarCollapsed && (
            <div className="space-y-1">
              <Link
                href="/provider/checkin-reviews"
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <span className="text-lg text-gray-400 mr-3">✓</span>
                <span>Check-in Reviews</span>
              </Link>
              <Link
                href="/provider/prescriptions"
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <span className="text-lg text-gray-400 mr-3">◓</span>
                <span>Prescriptions</span>
              </Link>
              <Link
                href="/provider/analytics"
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <span className="text-lg text-gray-400 mr-3">◔</span>
                <span>Analytics</span>
              </Link>
            </div>
          )}
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 p-4">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">JS</span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900">Dr. Jane Smith</p>
                <p className="text-xs text-gray-500">Dermatology</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => router.push('/admin/medications')}
                className="flex-1 px-2 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition text-center"
              >
                Admin
              </button>
              <button
                onClick={() => router.push('/provider/login')}
                className="flex-1 px-2 py-1.5 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition text-center"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
