'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProviderPatients() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all');

  const patients = [
    {
      id: '1',
      name: 'Emily Johnson',
      age: 28,
      gender: 'F',
      lastVisit: '2024-01-10',
      totalVisits: 8,
      subscription: 'Premium',
      status: 'active',
      conditions: ['Acne vulgaris', 'Mild anxiety'],
      revenue: 1847,
      compliance: 95
    },
    {
      id: '2',
      name: 'Michael Chen',
      age: 35,
      gender: 'M',
      lastVisit: '2024-01-08',
      totalVisits: 4,
      subscription: 'Essential',
      status: 'active',
      conditions: ['Hair loss', 'Hypertension'],
      revenue: 456,
      compliance: 88
    },
    {
      id: '3',
      name: 'Sarah Williams',
      age: 42,
      gender: 'F',
      lastVisit: '2023-12-15',
      totalVisits: 12,
      subscription: 'Premium',
      status: 'inactive',
      conditions: ['Weight management', 'PCOS'],
      revenue: 2340,
      compliance: 78
    },
    {
      id: '4',
      name: 'James Wilson',
      age: 31,
      gender: 'M',
      lastVisit: '2024-01-11',
      totalVisits: 2,
      subscription: 'Essential',
      status: 'active',
      conditions: ['ED'],
      revenue: 178,
      compliance: 100
    }
  ];

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterBy === 'all' || 
      (filterBy === 'active' && patient.status === 'active') ||
      (filterBy === 'premium' && patient.subscription === 'Premium');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-medium text-gray-900">Patients</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {filteredPatients.length} total • {filteredPatients.filter(p => p.status === 'active').length} active
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              />
              
              {/* Filter */}
              <select 
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="text-sm border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              >
                <option value="all">All Patients</option>
                <option value="active">Active Only</option>
                <option value="premium">Premium Only</option>
              </select>

              {/* Add Patient */}
              <button className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition">
                + Add Patient
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Patient List */}
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
            <div className="col-span-3">Patient</div>
            <div className="col-span-2">Conditions</div>
            <div className="col-span-1">Last Visit</div>
            <div className="col-span-1">Visits</div>
            <div className="col-span-1">Revenue</div>
            <div className="col-span-1">Compliance</div>
            <div className="col-span-2">Subscription</div>
            <div className="col-span-1">Action</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {filteredPatients.map((patient) => (
              <div 
                key={patient.id}
                className="grid grid-cols-12 gap-4 px-6 py-3 hover:bg-gray-50 transition cursor-pointer items-center"
                onClick={() => router.push(`/provider/patient/${patient.id}`)}
              >
                {/* Patient */}
                <div className="col-span-3 flex items-center space-x-3">
                  <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                    <p className="text-xs text-gray-500">{patient.age}{patient.gender}</p>
                  </div>
                </div>

                {/* Conditions */}
                <div className="col-span-2">
                  <div className="flex flex-wrap gap-1">
                    {patient.conditions.slice(0, 2).map((condition, idx) => (
                      <span key={idx} className="inline-flex px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Last Visit */}
                <div className="col-span-1">
                  <p className="text-sm text-gray-600">{patient.lastVisit}</p>
                </div>

                {/* Total Visits */}
                <div className="col-span-1">
                  <p className="text-sm font-medium text-gray-900">{patient.totalVisits}</p>
                </div>

                {/* Revenue */}
                <div className="col-span-1">
                  <p className="text-sm font-medium text-gray-900">${patient.revenue}</p>
                </div>

                {/* Compliance */}
                <div className="col-span-1">
                  <span className={`text-sm font-medium ${
                    patient.compliance >= 90 ? 'text-green-600' :
                    patient.compliance >= 75 ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {patient.compliance}%
                  </span>
                </div>

                {/* Subscription */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-0.5 text-xs rounded ${
                      patient.subscription === 'Premium'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {patient.subscription}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 text-xs rounded ${
                      patient.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {patient.status}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div className="col-span-1">
                  <button className="text-sm font-medium text-gray-900 hover:text-gray-600">
                    View →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">TOTAL PATIENTS</p>
            <p className="text-xl font-light text-gray-900 mt-1">347</p>
            <p className="text-xs text-green-600 mt-1">↑ 12 this month</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">AVG LTV</p>
            <p className="text-xl font-light text-gray-900 mt-1">$1,847</p>
            <p className="text-xs text-green-600 mt-1">↑ $234 from last month</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">RETENTION</p>
            <p className="text-xl font-light text-gray-900 mt-1">89%</p>
            <p className="text-xs text-gray-500 mt-1">3 month average</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">PREMIUM %</p>
            <p className="text-xl font-light text-gray-900 mt-1">42%</p>
            <p className="text-xs text-green-600 mt-1">↑ 5% this quarter</p>
          </div>
        </div>
      </div>
    </div>
  );
}
