'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProviderDashboard() {
  const router = useRouter();

  // Pending consultations - simplified
  const pendingConsultations = [
    {
      id: '1',
      patient: 'Emily Johnson',
      age: 28,
      gender: 'F',
      complaint: 'Severe acne flare-up',
      severity: 'high',
      waitTime: '12m',
      value: 147,
      tier: 'Premium',
      hasPhoto: true
    },
    {
      id: '2', 
      patient: 'Michael Chen',
      age: 35,
      gender: 'M',
      complaint: 'Hair loss progression',
      severity: 'medium',
      waitTime: '25m',
      value: 89,
      tier: 'Essential'
    },
    {
      id: '3',
      patient: 'Sarah Williams',
      age: 42,
      gender: 'F',
      complaint: 'Weight loss consultation',
      severity: 'low',
      waitTime: '1h',
      value: 299,
      tier: 'Premium'
    },
    {
      id: '4',
      patient: 'James Wilson',
      age: 31,
      gender: 'M',
      complaint: 'ED consultation',
      severity: 'medium',
      waitTime: '1h 15m',
      value: 59,
      tier: 'Essential'
    },
    {
      id: '5',
      patient: 'Lisa Chen',
      age: 29,
      gender: 'F',
      complaint: 'Anxiety management',
      severity: 'low',
      waitTime: '1h 30m',
      value: 89,
      tier: 'Essential'
    },
    {
      id: '6',
      patient: 'Robert Davis',
      age: 45,
      gender: 'M',
      complaint: 'Hypertension follow-up',
      severity: 'medium',
      waitTime: '2h',
      value: 129,
      tier: 'Premium'
    }
  ];

  const unreadMessages = 5;
  const totalPending = 12;

  return (
    <div className="space-y-4 pb-20 lg:pb-8">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Dr. Smith • {totalPending} waiting</h1>
        </div>
        <div className="flex items-center gap-2">
          {unreadMessages > 0 && (
            <button 
              onClick={() => router.push('/provider/messages')}
              className="relative px-3 py-1.5 bg-white border border-slate-200 rounded text-sm hover:shadow transition"
            >
              <span className="text-slate-700">Messages</span>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadMessages}
              </span>
            </button>
          )}
          <button 
            onClick={() => router.push('/provider/consultations')}
            className="px-3 py-1.5 bg-medical-600 text-white rounded text-sm hover:bg-medical-700 transition"
          >
            All →
          </button>
        </div>
      </div>

      {/* Compact Consultation List */}
      <div>
        <h2 className="text-sm font-medium text-slate-600 mb-2">Queue</h2>
        
        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
          {pendingConsultations.map((consultation) => (
            <div
              key={consultation.id}
              className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => router.push(`/provider/consultation/${consultation.id}`)}
            >
              {/* Compact Avatar */}
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-slate-600">
                  {consultation.patient.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              
              {/* Compact Info - Grouped Together */}
              <div className="flex items-center gap-4 flex-1">
                <div className="min-w-[140px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm text-slate-900">
                      {consultation.patient}
                    </span>
                    <span className="text-xs text-slate-500">
                      {consultation.age}{consultation.gender}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate max-w-[200px]">
                    {consultation.complaint}
                  </p>
                </div>
                
                {/* Tags */}
                <div className="flex items-center gap-1.5">
                  {consultation.severity === 'high' && (
                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                      !
                    </span>
                  )}
                  {consultation.hasPhoto && (
                    <span className="text-xs text-blue-600">📷</span>
                  )}
                  <span className="text-xs text-slate-500">{consultation.waitTime}</span>
                  <span className="text-xs font-medium text-slate-700">${consultation.value}</span>
                </div>
              </div>
              
              {/* Action */}
              <button className="px-3 py-1.5 bg-medical-600 text-white rounded text-xs font-medium hover:bg-medical-700 transition">
                Review
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* More Consultations Indicator */}
      <div className="text-center">
        <button 
          onClick={() => router.push('/provider/consultations')}
          className="text-sm text-medical-600 hover:text-medical-700"
        >
          View all {totalPending} consultations →
        </button>
      </div>

      {/* Minimal Footer */}
      <div className="pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/provider/patients')}
              className="hover:text-slate-700 transition"
            >
              Patients
            </button>
            <button 
              onClick={() => router.push('/admin/medications')}
              className="hover:text-slate-700 transition"
            >
              Settings
            </button>
          </div>
          <div>
            Today: 47 completed • 8 min avg
          </div>
        </div>
      </div>
    </div>
  );
}
