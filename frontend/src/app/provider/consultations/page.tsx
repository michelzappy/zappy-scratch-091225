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
    }
  ];

  const filteredConsultations = consultations.filter(c => 
    filterStatus === 'all' || c.status === filterStatus
  );

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-red-500';
    if (severity >= 6) return 'bg-orange-400';
    return 'bg-green-400';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-medium text-gray-900">Consultations</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {filteredConsultations.filter(c => c.status === 'pending').length} pending, 
                {' '}{filteredConsultations.filter(c => c.status === 'completed').length} completed today
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Status Filter */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                {['pending', 'completed', 'all'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition ${
                      filterStatus === status
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
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
                className="text-sm border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              >
                <option value="priority">Priority</option>
                <option value="time">Wait Time</option>
                <option value="value">Value</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Consultation List */}
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
            <div className="col-span-3">Patient</div>
            <div className="col-span-3">Complaint</div>
            <div className="col-span-1">Priority</div>
            <div className="col-span-1">Time</div>
            <div className="col-span-1">Value</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Action</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {filteredConsultations.map((consultation) => (
              <div 
                key={consultation.id}
                className="grid grid-cols-12 gap-4 px-6 py-3 hover:bg-gray-50 transition cursor-pointer items-center"
                onClick={() => router.push(`/provider/consultation/${consultation.id}`)}
              >
                {/* Patient */}
                <div className="col-span-3 flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {consultation.patient.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    {consultation.severity >= 8 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{consultation.patient}</p>
                    <p className="text-xs text-gray-500">{consultation.age}{consultation.gender}</p>
                  </div>
                </div>

                {/* Complaint */}
                <div className="col-span-3">
                  <p className="text-sm text-gray-900">{consultation.complaint}</p>
                  {consultation.hasPhotos && (
                    <span className="text-xs text-blue-600">📷 Photos included</span>
                  )}
                </div>

                {/* Priority */}
                <div className="col-span-1">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                    consultation.priority === 'high' 
                      ? 'bg-red-100 text-red-700'
                      : consultation.priority === 'medium'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {consultation.priority}
                  </span>
                </div>

                {/* Time */}
                <div className="col-span-1">
                  <p className="text-sm text-gray-600">
                    {consultation.status === 'pending' ? consultation.waitTime : consultation.completedAt}
                  </p>
                </div>

                {/* Value */}
                <div className="col-span-1">
                  <p className="text-sm font-medium text-gray-900">${consultation.value}</p>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                      consultation.status === 'pending'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {consultation.status}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 text-xs rounded ${
                      consultation.subscription === 'Premium'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {consultation.subscription}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div className="col-span-1">
                  <button className="text-sm font-medium text-gray-900 hover:text-gray-600">
                    Review →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          {filteredConsultations.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-500">No consultations found</p>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">AVG WAIT TIME</p>
            <p className="text-xl font-light text-gray-900 mt-1">18 min</p>
            <p className="text-xs text-green-600 mt-1">↓ 5 min from yesterday</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">COMPLETION RATE</p>
            <p className="text-xl font-light text-gray-900 mt-1">92%</p>
            <p className="text-xs text-green-600 mt-1">↑ 3% from last week</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">AVG VALUE</p>
            <p className="text-xl font-light text-gray-900 mt-1">$147</p>
            <p className="text-xs text-gray-500 mt-1">Stable</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">SATISFACTION</p>
            <p className="text-xl font-light text-gray-900 mt-1">4.9/5</p>
            <p className="text-xs text-green-600 mt-1">↑ 0.1 this month</p>
          </div>
        </div>
      </div>
    </div>
  );
}
