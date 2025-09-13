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
      lastVisit: 'Jan 10, 2024',
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
      lastVisit: 'Jan 8, 2024',
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
      lastVisit: 'Dec 15, 2023',
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
      lastVisit: 'Jan 11, 2024',
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

  const stats = {
    total: 347,
    active: 289,
    avgLTV: '$1,847',
    retention: '89%',
    premium: '42%'
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Patients</h1>
        <p className="text-sm text-slate-600 mt-1">
          {filteredPatients.length} total • {filteredPatients.filter(p => p.status === 'active').length} active
        </p>
      </div>

      {/* Search and Filters - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search patients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
        />
        
        <select 
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-medical-500"
        >
          <option value="all">All Patients</option>
          <option value="active">Active Only</option>
          <option value="premium">Premium Only</option>
        </select>
      </div>

      {/* Stats Cards - Mobile Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Total</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.total}</p>
          <p className="text-xs text-emerald-600 mt-1">↑ 12 new</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Active</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{stats.active}</p>
          <p className="text-xs text-slate-500 mt-1">83%</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Avg LTV</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.avgLTV}</p>
          <p className="text-xs text-emerald-600 mt-1">↑ $234</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Retention</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.retention}</p>
          <p className="text-xs text-slate-500 mt-1">3mo avg</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 col-span-2 lg:col-span-1">
          <p className="text-xs text-slate-600">Premium</p>
          <p className="text-xl font-bold text-purple-600 mt-1">{stats.premium}</p>
          <p className="text-xs text-emerald-600 mt-1">↑ 5%</p>
        </div>
      </div>

      {/* Patient Cards - Mobile First */}
      <div className="space-y-3">
        {filteredPatients.map((patient) => (
          <div 
            key={patient.id}
            onClick={() => router.push(`/provider/patient/${patient.id}`)}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                {/* Patient Avatar */}
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-slate-600">
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                
                {/* Patient Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-sm text-slate-900">{patient.name}</h3>
                    <span className="text-xs text-slate-500">{patient.age}{patient.gender}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      patient.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {patient.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      patient.subscription === 'Premium'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {patient.subscription}
                    </span>
                  </div>
                  
                  {/* Conditions */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {patient.conditions.map((condition, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Compliance Badge */}
              <div className="text-center">
                <span className={`text-lg font-bold ${
                  patient.compliance >= 90 ? 'text-emerald-600' :
                  patient.compliance >= 75 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {patient.compliance}%
                </span>
                <p className="text-xs text-slate-500">compliance</p>
              </div>
            </div>

            {/* Bottom Info */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span>📅 {patient.lastVisit}</span>
                <span>🔄 {patient.totalVisits} visits</span>
                <span className="font-medium text-slate-900">${patient.revenue}</span>
              </div>
              
              <button className="text-sm font-medium text-medical-600 hover:text-medical-700">
                View Details →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPatients.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="text-4xl mb-4">👥</div>
          <p className="text-sm text-slate-600">No patients found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Quick Actions - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button className="bg-white rounded-xl border-2 border-medical-200 p-4 text-center hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="text-2xl mb-2">📊</div>
          <p className="text-sm font-semibold text-medical-700">Export List</p>
        </button>
        
        <button className="bg-white rounded-xl border-2 border-emerald-200 p-4 text-center hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="text-2xl mb-2">📧</div>
          <p className="text-sm font-semibold text-emerald-700">Bulk Message</p>
        </button>
        
        <button className="bg-white rounded-xl border-2 border-purple-200 p-4 text-center hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="text-2xl mb-2">🏷️</div>
          <p className="text-sm font-semibold text-purple-700">Tag Patients</p>
        </button>
        
        <button className="bg-white rounded-xl border-2 border-blue-200 p-4 text-center hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="text-2xl mb-2">➕</div>
          <p className="text-sm font-semibold text-blue-700">Add Patient</p>
        </button>
      </div>
    </div>
  );
}
