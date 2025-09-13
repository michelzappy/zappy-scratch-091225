'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminProvidersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [providers] = useState([
    {
      id: 'PRV-001',
      name: 'Dr. Emily Chen',
      email: 'emily.chen@telehealth.com',
      specialty: 'Family Medicine',
      status: 'active',
      licenseNumber: 'MD-123456',
      licenseState: 'CA',
      licenseExpiry: '2025-12-31',
      patientsCount: 145,
      consultationsCount: 892,
      rating: 4.8,
      availability: 'available',
      joinedDate: '2023-01-15',
      lastActive: '2024-12-09T14:30:00Z',
    },
    {
      id: 'PRV-002',
      name: 'Dr. Michael Rodriguez',
      email: 'm.rodriguez@telehealth.com',
      specialty: 'Internal Medicine',
      status: 'active',
      licenseNumber: 'MD-789012',
      licenseState: 'NY',
      licenseExpiry: '2024-06-30',
      patientsCount: 234,
      consultationsCount: 1456,
      rating: 4.9,
      availability: 'busy',
      joinedDate: '2022-08-20',
      lastActive: '2024-12-09T15:45:00Z',
    },
    {
      id: 'PRV-003',
      name: 'Dr. Sarah Johnson',
      email: 'sjohnson@telehealth.com',
      specialty: 'Psychiatry',
      status: 'active',
      licenseNumber: 'MD-345678',
      licenseState: 'TX',
      licenseExpiry: '2025-03-15',
      patientsCount: 89,
      consultationsCount: 567,
      rating: 4.7,
      availability: 'offline',
      joinedDate: '2023-05-10',
      lastActive: '2024-12-08T18:00:00Z',
    },
    {
      id: 'PRV-004',
      name: 'Dr. James Wilson',
      email: 'j.wilson@telehealth.com',
      specialty: 'Dermatology',
      status: 'pending',
      licenseNumber: 'MD-567890',
      licenseState: 'FL',
      licenseExpiry: '2025-09-30',
      patientsCount: 0,
      consultationsCount: 0,
      rating: 0,
      availability: 'offline',
      joinedDate: '2024-12-05',
      lastActive: null,
    },
    {
      id: 'PRV-005',
      name: 'Dr. Lisa Park',
      email: 'l.park@telehealth.com',
      specialty: 'Pediatrics',
      status: 'inactive',
      licenseNumber: 'MD-234567',
      licenseState: 'WA',
      licenseExpiry: '2024-01-31',
      patientsCount: 156,
      consultationsCount: 923,
      rating: 4.6,
      availability: 'offline',
      joinedDate: '2022-03-12',
      lastActive: '2024-10-15T12:00:00Z',
    },
  ]);

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      active: { bg: 'bg-green-100', text: 'text-green-800' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800' },
      suspended: { bg: 'bg-red-100', text: 'text-red-800' },
    };
    const config = statusConfig[status] || statusConfig.inactive;
    return `${config.bg} ${config.text}`;
  };

  const getAvailabilityBadge = (availability: string) => {
    const availConfig: any = {
      available: { bg: 'bg-green-100', text: 'text-green-800', icon: '🟢' },
      busy: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🟡' },
      offline: { bg: 'bg-gray-100', text: 'text-gray-800', icon: '⚫' },
    };
    const config = availConfig[availability] || availConfig.offline;
    return config;
  };

  const getLicenseStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'text-red-600', message: 'Expired' };
    } else if (daysUntilExpiry < 30) {
      return { status: 'expiring', color: 'text-yellow-600', message: `Expires in ${daysUntilExpiry} days` };
    } else {
      return { status: 'valid', color: 'text-green-600', message: 'Valid' };
    }
  };

  const filteredProviders = providers.filter(provider => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return provider.status === 'active';
    if (activeTab === 'pending') return provider.status === 'pending';
    if (activeTab === 'inactive') return provider.status === 'inactive';
    return true;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Provider Management</h1>
              <p className="text-sm text-gray-500 mt-1">Manage healthcare providers and their credentials</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </Link>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Add Provider
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Total Providers</p>
            <p className="text-2xl font-bold text-gray-900">{providers.length}</p>
            <p className="text-sm text-green-600 mt-1">+2 this month</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Active Providers</p>
            <p className="text-2xl font-bold text-green-600">
              {providers.filter(p => p.status === 'active').length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Currently active</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-600">
              {providers.filter(p => p.status === 'pending').length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Requires review</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">License Expiring</p>
            <p className="text-2xl font-bold text-red-600">
              {providers.filter(p => {
                const status = getLicenseStatus(p.licenseExpiry);
                return status.status === 'expiring' || status.status === 'expired';
              }).length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Within 30 days</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['all', 'active', 'pending', 'inactive'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
                {tab === 'all' && <span className="ml-2 text-gray-400">({providers.length})</span>}
                {tab === 'active' && <span className="ml-2 text-gray-400">({providers.filter(p => p.status === 'active').length})</span>}
                {tab === 'pending' && <span className="ml-2 text-gray-400">({providers.filter(p => p.status === 'pending').length})</span>}
                {tab === 'inactive' && <span className="ml-2 text-gray-400">({providers.filter(p => p.status === 'inactive').length})</span>}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Providers Table */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Availability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metrics
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProviders.map((provider) => {
                const licenseStatus = getLicenseStatus(provider.licenseExpiry);
                const availabilityConfig = getAvailabilityBadge(provider.availability);
                
                return (
                  <tr key={provider.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium text-sm">
                              {provider.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                          <div className="text-xs text-gray-500">{provider.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{provider.specialty}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{provider.licenseNumber}</div>
                      <div className="text-xs text-gray-500">{provider.licenseState}</div>
                      <div className={`text-xs ${licenseStatus.color}`}>{licenseStatus.message}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(provider.status)}`}>
                        {provider.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2">{availabilityConfig.icon}</span>
                        <span className={`text-sm ${availabilityConfig.text}`}>
                          {provider.availability}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {provider.patientsCount} patients
                      </div>
                      <div className="text-xs text-gray-500">
                        {provider.consultationsCount} consultations
                      </div>
                      {provider.rating > 0 && (
                        <div className="text-xs text-yellow-600">
                          ⭐ {provider.rating}/5.0
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(provider.lastActive)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                      {provider.status === 'pending' && (
                        <button className="text-green-600 hover:text-green-900 mr-3">Approve</button>
                      )}
                      {provider.status === 'active' && (
                        <button className="text-yellow-600 hover:text-yellow-900 mr-3">Suspend</button>
                      )}
                      <button className="text-gray-600 hover:text-gray-900">Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredProviders.length}</span> of{' '}
            <span className="font-medium">{providers.length}</span> results
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 bg-indigo-50 border-indigo-500 text-indigo-600">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
