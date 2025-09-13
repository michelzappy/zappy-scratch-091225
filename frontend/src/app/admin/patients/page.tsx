'use client';

import { useState } from 'react';

export default function AdminPatients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock patient data
  const patients = [
    {
      id: 'PAT-001',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '(555) 123-4567',
      status: 'active',
      lastVisit: '2024-01-08',
      totalVisits: 12,
      subscription: 'Premium',
      conditions: ['Weight Management', 'Anxiety']
    },
    {
      id: 'PAT-002',
      name: 'Michael Chen',
      email: 'mchen@email.com',
      phone: '(555) 234-5678',
      status: 'active',
      lastVisit: '2024-01-09',
      totalVisits: 8,
      subscription: 'Basic',
      conditions: ['Hair Loss']
    },
    {
      id: 'PAT-003',
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      phone: '(555) 345-6789',
      status: 'inactive',
      lastVisit: '2023-12-15',
      totalVisits: 5,
      subscription: 'None',
      conditions: ['Skin Care', 'Acne']
    },
    {
      id: 'PAT-004',
      name: 'James Wilson',
      email: 'jwilson@email.com',
      phone: '(555) 456-7890',
      status: 'active',
      lastVisit: '2024-01-07',
      totalVisits: 15,
      subscription: 'Premium',
      conditions: ['Testosterone Therapy', 'Weight Management']
    },
    {
      id: 'PAT-005',
      name: 'Lisa Martinez',
      email: 'lmartinez@email.com',
      phone: '(555) 567-8901',
      status: 'pending',
      lastVisit: '2024-01-09',
      totalVisits: 1,
      subscription: 'Trial',
      conditions: ['Women\'s Health']
    },
    {
      id: 'PAT-006',
      name: 'Robert Brown',
      email: 'rbrown@email.com',
      phone: '(555) 678-9012',
      status: 'active',
      lastVisit: '2024-01-06',
      totalVisits: 20,
      subscription: 'Premium',
      conditions: ['Hair Loss', 'ED']
    }
  ];

  // Filter patients based on search and status
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          patient.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Patients</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and view all patient records</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Total Patients</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">2,847</p>
          <p className="text-xs text-green-600 mt-2">+12% from last month</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Active Patients</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">2,134</p>
          <p className="text-xs text-gray-500 mt-2">75% of total</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">New This Month</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">342</p>
          <p className="text-xs text-green-600 mt-2">+23% growth</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Avg. Satisfaction</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">4.8</p>
          <p className="text-xs text-gray-500 mt-2">⭐⭐⭐⭐⭐</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
          <button className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition">
            Add Patient
          </button>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conditions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Visit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                      <p className="text-xs text-gray-500">{patient.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm text-gray-900">{patient.email}</p>
                      <p className="text-xs text-gray-500">{patient.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      patient.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : patient.status === 'inactive'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      patient.subscription === 'Premium'
                        ? 'bg-purple-100 text-purple-800'
                        : patient.subscription === 'Basic'
                        ? 'bg-blue-100 text-blue-800'
                        : patient.subscription === 'Trial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.subscription}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {patient.conditions.map((condition, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                        >
                          {condition}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm text-gray-900">{patient.lastVisit}</p>
                      <p className="text-xs text-gray-500">{patient.totalVisits} total visits</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        View
                      </button>
                      <span className="text-gray-300">|</span>
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        Message
                      </button>
                      <span className="text-gray-300">|</span>
                      <button className="text-sm text-gray-600 hover:text-gray-700">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing 1 to {filteredPatients.length} of {patients.length} results
            </p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-1 bg-gray-900 text-white rounded-md text-sm">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                3
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
