'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProviderConsultations() {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState('pending');
  const [sortBy, setSortBy] = useState('priority');

  const consultations = [
    {
      id: '1',
      patient: 'Emily Johnson',
      age: 28,
      gender: 'F',
      complaint: 'Severe acne with scarring',
      status: 'pending',
      priority: 'high',
      waitTime: '12 min',
      submittedAt: '2:35 PM',
      value: 147,
      subscription: 'Premium',
      hasPhotos: true,
      severity: 9
    },
    {
      id: '2',
      patient: 'Michael Chen',
      age: 35,
      gender: 'M',
      complaint: 'Hair loss - 6 months',
      status: 'pending',
      priority: 'medium',
      waitTime: '25 min',
      submittedAt: '2:22 PM',
      value: 89,
      subscription: 'Essential',
      hasPhotos: false,
      severity: 6
    },
    {
      id: '3',
      patient: 'Sarah Williams',
      age: 42,
      gender: 'F',
      complaint: 'Weight management',
      status: 'pending',
      priority: 'low',
      waitTime: '1 hr',
      submittedAt: '1:47 PM',
      value: 299,
      subscription: 'Premium',
      hasPhotos: false,
      severity: 5
    },
    {
      id: '4',
      patient: 'James Wilson',
      age: 31,
      gender: 'M',
      complaint: 'ED consultation',
      status: 'completed',
      priority: 'medium',
      completedAt: '1:30 PM',
      value: 59,
      subscription: 'Essential',
      hasPhotos: false,
      severity: 6
    },
    {
      id: '5',
      patient: 'Lisa Brown',
      age: 26,
      gender: 'F',
      complaint: 'Rosacea treatment',
      status: 'completed',
      priority: 'low',
      completedAt: '12:45 PM',
      value: 79,
      subscription: 'Essential',
      hasPhotos: true,
      severity: 4
    }
  ];

  const filteredConsultations = consultations.filter(c => 
    filterStatus === 'all' || c.status === filterStatus
  );

  const stats = {
    avgWait: '18 min',
    waitChange: '↓ 5 min',
    completion: '92%',
    completionChange: '↑ 3%',
    avgValue: '$147',
    satisfaction: '4.9/5'
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Consultations</h1>
        <p className="text-sm text-slate-600 mt-1">
          {filteredConsultations.filter(c => c.status === 'pending').length} pending, 
          {' '}{filteredConsultations.filter(c => c.status === 'completed').length} completed today
        </p>
      </div>

      {/* Filters - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status Filter */}
        <div className="flex bg-white rounded-lg border border-slate-200 p-1">
          {['pending', 'completed', 'all'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`flex-1 px-3 py-1.5 text-sm font-medium rounded transition ${
                filterStatus === status
                  ? 'bg-medical-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-medical-500"
        >
          <option value="priority">Sort: Priority</option>
          <option value="time">Sort: Wait Time</option>
          <option value="value">Sort: Value</option>
        </select>
      </div>

      {/* Consultation Cards - Mobile First */}
      <div className="space-y-3">
        {filteredConsultations.map((consultation) => (
          <div 
            key={consultation.id}
            onClick={() => router.push(`/provider/consultation/${consultation.id}`)}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                {/* Patient Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-slate-600">
                      {consultation.patient.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  {consultation.severity >= 8 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                
                {/* Patient Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-sm text-slate-900">{consultation.patient}</h3>
                    <span className="text-xs text-slate-500">{consultation.age}{consultation.gender}</span>
                    {consultation.hasPhotos && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        📷 Photo
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      consultation.subscription === 'Premium'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {consultation.subscription}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{consultation.complaint}</p>
                </div>
              </div>

              {/* Priority Badge */}
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                consultation.priority === 'high' 
                  ? 'bg-red-100 text-red-700'
                  : consultation.priority === 'medium'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {consultation.priority === 'high' ? 'Urgent' : 
                 consultation.priority === 'medium' ? 'Moderate' : 'Low'}
              </span>
            </div>

            {/* Bottom Info */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500">
                  ⏱ {consultation.status === 'pending' ? consultation.waitTime : consultation.completedAt}
                </span>
                <span className="text-xs font-medium text-emerald-600">
                  ${consultation.value}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                  consultation.status === 'pending'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {consultation.status === 'pending' ? 'Pending' : 'Completed'}
                </span>
                <button className="text-sm font-medium text-medical-600 hover:text-medical-700">
                  Review →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredConsultations.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-sm text-slate-600">No consultations found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters</p>
        </div>
      )}

      {/* Stats Summary - Mobile Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Avg Wait Time</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.avgWait}</p>
          <p className="text-xs text-emerald-600 mt-1">{stats.waitChange}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Completion</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.completion}</p>
          <p className="text-xs text-emerald-600 mt-1">{stats.completionChange}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Avg Value</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.avgValue}</p>
          <p className="text-xs text-slate-500 mt-1">Stable</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Satisfaction</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.satisfaction}</p>
          <p className="text-xs text-emerald-600 mt-1">↑ 0.1</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-slate-200 lg:hidden">
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => setFilterStatus('pending')}
            className="py-2 px-4 bg-medical-600 text-white rounded-lg text-sm font-medium"
          >
            View Pending
          </button>
          <button className="py-2 px-4 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium">
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
}
