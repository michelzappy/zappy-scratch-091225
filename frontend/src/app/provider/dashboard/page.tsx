'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProviderDashboard() {
  const router = useRouter();
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');

  // Pending consultations with priority scoring
  const pendingConsultations = [
    {
      id: '1',
      patient: 'Emily Johnson',
      age: 28,
      gender: 'F',
      complaint: 'Severe acne flare-up',
      severity: 9,
      waitTime: '12m',
      value: 147,
      subscription: 'Premium',
      photo: true
    },
    {
      id: '2', 
      patient: 'Michael Chen',
      age: 35,
      gender: 'M',
      complaint: 'Hair loss progression',
      severity: 6,
      waitTime: '25m',
      value: 89,
      subscription: 'Essential'
    },
    {
      id: '3',
      patient: 'Sarah Williams',
      age: 42,
      gender: 'F',
      complaint: 'Weight loss consultation',
      severity: 5,
      waitTime: '1h',
      value: 299,
      subscription: 'Premium'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Elegant Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-gray-900">Good afternoon, Dr. Smith</h1>
              <p className="text-sm text-gray-500 mt-1">Thursday, January 12, 2024 • 2:47 PM PST</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Admin Portal Button - Prominent */}
              <button
                onClick={() => router.push('/admin/medications')}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Admin Portal</span>
                </div>
              </button>
              
              {/* Time Range Selector */}
              <div className="flex items-center space-x-2">
                {['today', 'week', 'month'].map(range => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition ${
                      selectedTimeRange === range
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-6">
        {/* Refined Metrics Bar */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">PENDING</span>
              <span className="text-xs text-orange-600">↑ 3</span>
            </div>
            <p className="text-2xl font-light text-gray-900">12</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">COMPLETED</span>
              <span className="text-xs text-green-600">+15%</span>
            </div>
            <p className="text-2xl font-light text-gray-900">47</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">AVG TIME</span>
              <span className="text-xs text-blue-600">-2m</span>
            </div>
            <p className="text-2xl font-light text-gray-900">8m</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">REVENUE</span>
              <span className="text-xs text-green-600">+24%</span>
            </div>
            <p className="text-2xl font-light text-gray-900">$3.2k</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">CONVERSION</span>
              <span className="text-xs text-green-600">+5%</span>
            </div>
            <p className="text-2xl font-light text-gray-900">92%</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">NPS SCORE</span>
              <span className="text-xs text-green-600">+2</span>
            </div>
            <p className="text-2xl font-light text-gray-900">94</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Consultation Queue - Refined */}
          <div className="col-span-2">
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-900">Consultation Queue</h2>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-gray-500">Sort by:</span>
                    <select className="border-0 text-gray-900 font-medium focus:ring-0 cursor-pointer">
                      <option>Priority</option>
                      <option>Wait Time</option>
                      <option>Value</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {pendingConsultations.map((consultation, idx) => (
                  <div
                    key={consultation.id}
                    className="px-5 py-3 hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => router.push(`/provider/consultation/${consultation.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {consultation.patient.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          {consultation.severity >= 8 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900">{consultation.patient}</p>
                            <span className="text-xs text-gray-500">{consultation.age}{consultation.gender}</span>
                            {consultation.photo && (
                              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">📷</span>
                            )}
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              consultation.subscription === 'Premium' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {consultation.subscription}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">{consultation.complaint}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Wait</p>
                          <p className="text-sm font-medium text-gray-900">{consultation.waitTime}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Value</p>
                          <p className="text-sm font-medium text-gray-900">${consultation.value}</p>
                        </div>
                        <div className={`w-1 h-8 rounded-full ${
                          consultation.severity >= 8 ? 'bg-red-400' :
                          consultation.severity >= 6 ? 'bg-orange-400' :
                          'bg-green-400'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="px-5 py-3 border-t border-gray-100">
                <button className="text-xs font-medium text-gray-600 hover:text-gray-900">
                  View all 12 pending →
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Activity & Quick Actions */}
          <div className="space-y-6">
            {/* Recent Activity - Compact */}
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-medium text-gray-900">Recent Activity</h2>
              </div>
              <div className="px-5 py-3 space-y-3">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-900">Rx approved for James Wilson</p>
                    <p className="text-xs text-gray-500">2 min ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-900">Follow-up scheduled with Anna Lee</p>
                    <p className="text-xs text-gray-500">15 min ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-900">Lab results received for David Kim</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions - Elegant */}
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-medium text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-3 space-y-1">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition flex items-center justify-between group">
                  <span>Review pending labs</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 group-hover:bg-gray-200">3</span>
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition flex items-center justify-between group">
                  <span>Refill requests</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 group-hover:bg-gray-200">7</span>
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition">
                  Message center
                </button>
              </div>
            </div>

            {/* Performance Snapshot */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 text-white">
              <h3 className="text-xs font-medium text-gray-400 mb-3">PERFORMANCE SNAPSHOT</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-300">Consultations/hour</span>
                  <span className="text-sm font-medium">7.5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-300">Avg response time</span>
                  <span className="text-sm font-medium">8m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-300">Patient satisfaction</span>
                  <span className="text-sm font-medium">4.9/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-300">Revenue/patient</span>
                  <span className="text-sm font-medium">$127</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
