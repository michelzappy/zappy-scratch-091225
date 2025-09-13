'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [period, setPeriod] = useState('today');

  // Patient-focused metrics
  const metrics = [
    {
      label: 'Active Patients',
      value: '2,847',
      urgent: 12,
      description: 'awaiting response',
      color: 'red'
    },
    {
      label: 'Open Consultations',
      value: '43',
      urgent: 8,
      description: 'need provider review',
      color: 'yellow'
    },
    {
      label: 'Support Tickets',
      value: '27',
      urgent: 5,
      description: 'high priority',
      color: 'orange'
    },
    {
      label: 'Pending Prescriptions',
      value: '18',
      urgent: 3,
      description: 'await approval',
      color: 'blue'
    }
  ];

  // Patient support issues
  const patientIssues = [
    {
      id: 'P-12847',
      patient: 'Sarah Johnson',
      issue: 'Question about medication dosage',
      time: '12 min ago',
      priority: 'high',
      status: 'pending'
    },
    {
      id: 'P-12846',
      patient: 'Michael Chen',
      issue: 'Needs prescription refill',
      time: '28 min ago',
      priority: 'medium',
      status: 'in-progress'
    },
    {
      id: 'P-12845',
      patient: 'Emily Davis',
      issue: 'Reporting mild side effects',
      time: '45 min ago',
      priority: 'high',
      status: 'assigned'
    },
    {
      id: 'P-12844',
      patient: 'James Wilson',
      issue: 'Follow-up consultation needed',
      time: '1 hour ago',
      priority: 'low',
      status: 'pending'
    },
    {
      id: 'P-12843',
      patient: 'Lisa Martinez',
      issue: 'Billing inquiry',
      time: '2 hours ago',
      priority: 'low',
      status: 'pending'
    }
  ];

  // Recent consultations needing review
  const pendingConsultations = [
    {
      id: 'C-3421',
      patient: 'Robert Brown',
      condition: 'Hair Loss',
      submitted: '5 min ago',
      provider: 'Unassigned',
      status: 'new'
    },
    {
      id: 'C-3420',
      patient: 'Amanda White',
      condition: 'Weight Management',
      submitted: '18 min ago',
      provider: 'Dr. Smith',
      status: 'reviewing'
    },
    {
      id: 'C-3419',
      patient: 'David Lee',
      condition: 'Testosterone Therapy',
      submitted: '35 min ago',
      provider: 'Dr. Johnson',
      status: 'reviewing'
    },
    {
      id: 'C-3418',
      patient: 'Jennifer Taylor',
      condition: 'Women\'s Health',
      submitted: '1 hour ago',
      provider: 'Unassigned',
      status: 'new'
    }
  ];

  // Problem categories
  const problemCategories = [
    { category: 'Medication Issues', count: 23, percentage: 35 },
    { category: 'Platform Access', count: 18, percentage: 27 },
    { category: 'Billing Problems', count: 12, percentage: 18 },
    { category: 'Consultation Delays', count: 8, percentage: 12 },
    { category: 'Shipping Issues', count: 5, percentage: 8 }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Operations Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Patient care management and support overview</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 transition">
            Priority Queue
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              3 Items Need Your Attention
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              2 patients with questions • 1 consultation awaiting review
            </p>
          </div>
          <button className="ml-3 text-sm font-medium text-blue-800 hover:text-blue-900">
            Review →
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{metric.value}</p>
              </div>
              {metric.urgent > 0 && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  metric.color === 'red' ? 'bg-red-100 text-red-800' :
                  metric.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  metric.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {metric.urgent} urgent
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">{metric.urgent} {metric.description}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Patient Support Queue */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Patient Support Queue</h2>
              <Link href="/admin/support" className="text-sm text-gray-600 hover:text-gray-900">
                View all →
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {patientIssues.map((issue) => (
              <div key={issue.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-gray-600">{issue.id}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        issue.priority === 'high' ? 'bg-blue-100 text-blue-800' :
                        issue.priority === 'medium' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {issue.priority}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        issue.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        issue.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                        issue.status === 'in-progress' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {issue.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{issue.patient}</p>
                    <p className="text-sm text-gray-600 mt-1">{issue.issue}</p>
                    <p className="text-xs text-gray-500 mt-1">{issue.time}</p>
                  </div>
                  <button className="ml-3 text-sm font-medium text-blue-600 hover:text-blue-700">
                    Handle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Consultations */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Pending Consultations</h2>
              <Link href="/admin/consultations" className="text-sm text-gray-600 hover:text-gray-900">
                View all →
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingConsultations.map((consultation) => (
              <div key={consultation.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-gray-600">{consultation.id}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        consultation.status === 'new' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {consultation.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{consultation.patient}</p>
                    <p className="text-sm text-gray-600">{consultation.condition}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">{consultation.submitted}</p>
                      <p className="text-xs text-gray-600">
                        {consultation.provider === 'Unassigned' ? (
                          <span className="text-red-600 font-medium">Needs assignment</span>
                        ) : (
                          consultation.provider
                        )}
                      </p>
                    </div>
                  </div>
                  <button className="ml-3 text-sm font-medium text-blue-600 hover:text-blue-700">
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Problem Categories */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Common Problem Areas</h2>
        <div className="space-y-3">
          {problemCategories.map((category, index) => (
            <div key={index}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700">{category.category}</span>
                <span className="font-medium text-gray-900">{category.count} issues</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition text-left">
          <span className="text-xl mb-2 block">🚨</span>
          <p className="text-sm font-medium text-gray-900">Emergency Response</p>
          <p className="text-xs text-gray-500 mt-1">Handle critical issues</p>
        </button>
        
        <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition text-left">
          <span className="text-xl mb-2 block">💬</span>
          <p className="text-sm font-medium text-gray-900">Message Center</p>
          <p className="text-xs text-gray-500 mt-1">Patient communications</p>
        </button>
        
        <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition text-left">
          <span className="text-xl mb-2 block">📋</span>
          <p className="text-sm font-medium text-gray-900">Provider Queue</p>
          <p className="text-xs text-gray-500 mt-1">Assign consultations</p>
        </button>
        
        <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition text-left">
          <span className="text-xl mb-2 block">📊</span>
          <p className="text-sm font-medium text-gray-900">Analytics</p>
          <p className="text-xs text-gray-500 mt-1">Response metrics</p>
        </button>
      </div>
    </div>
  );
}
