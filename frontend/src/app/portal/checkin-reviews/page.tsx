'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

interface CheckIn {
  id: string;
  patientName: string;
  type: 'monthly' | 'quarterly' | 'symptom-update';
  submittedAt: string;
  status: 'pending' | 'reviewed' | 'action-required';
  severity: 'low' | 'medium' | 'high';
  symptoms: string[];
}

type FilterType = 'all' | 'pending' | 'action-required' | 'reviewed' | 'high-severity';

export default function CheckInReviewsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('provider');
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCheckIns, setSelectedCheckIns] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState('today');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole') as UserRole;
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    if (role) {
      setUserRole(role);
      if (role === 'admin') {
        // Regular admins might not have access
        router.push('/portal/dashboard');
        return;
      }
    }

    fetchCheckIns();
  }, [router]);

  const fetchCheckIns = async () => {
    // Mock data
    const mockCheckIns: CheckIn[] = [
      {
        id: '1',
        patientName: 'Sarah Johnson',
        type: 'monthly',
        submittedAt: '2024-01-15T09:00:00',
        status: 'pending',
        severity: 'medium',
        symptoms: ['Increased redness', 'Mild irritation']
      },
      {
        id: '2',
        patientName: 'Michael Chen',
        type: 'symptom-update',
        submittedAt: '2024-01-14T15:30:00',
        status: 'action-required',
        severity: 'high',
        symptoms: ['Severe flaking', 'Pain', 'Bleeding']
      },
      {
        id: '3',
        patientName: 'Emily Davis',
        type: 'quarterly',
        submittedAt: '2024-01-13T11:00:00',
        status: 'reviewed',
        severity: 'low',
        symptoms: ['Stable condition']
      },
      {
        id: '4',
        patientName: 'Robert Wilson',
        type: 'monthly',
        submittedAt: '2024-01-15T08:30:00',
        status: 'pending',
        severity: 'low',
        symptoms: ['Improving condition']
      },
      {
        id: '5',
        patientName: 'Jessica Martinez',
        type: 'symptom-update',
        submittedAt: '2024-01-15T10:00:00',
        status: 'action-required',
        severity: 'high',
        symptoms: ['New symptoms appeared', 'Worsening']
      },
      {
        id: '6',
        patientName: 'David Thompson',
        type: 'quarterly',
        submittedAt: '2024-01-14T14:00:00',
        status: 'reviewed',
        severity: 'medium',
        symptoms: ['Stable with minor issues']
      }
    ];
    
    setCheckIns(mockCheckIns);
    setLoading(false);
  };

  // Filter counts
  const filterCounts = {
    all: checkIns.length,
    pending: checkIns.filter(c => c.status === 'pending').length,
    'action-required': checkIns.filter(c => c.status === 'action-required').length,
    reviewed: checkIns.filter(c => c.status === 'reviewed').length,
    'high-severity': checkIns.filter(c => c.severity === 'high').length
  };

  // Apply filters
  let filteredCheckIns = checkIns.filter(checkIn => {
    const matchesSearch = checkIn.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          checkIn.symptoms.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesFilter = true;
    if (activeFilter !== 'all') {
      if (activeFilter === 'high-severity') {
        matchesFilter = checkIn.severity === 'high';
      } else {
        matchesFilter = checkIn.status === activeFilter;
      }
    }
    
    return matchesSearch && matchesFilter;
  });

  const toggleCheckInSelection = (checkInId: string) => {
    const newSelection = new Set(selectedCheckIns);
    if (newSelection.has(checkInId)) {
      newSelection.delete(checkInId);
    } else {
      newSelection.add(checkInId);
    }
    setSelectedCheckIns(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedCheckIns.size === filteredCheckIns.length) {
      setSelectedCheckIns(new Set());
    } else {
      setSelectedCheckIns(new Set(filteredCheckIns.map(c => c.id)));
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'action-required': return 'bg-red-100 text-red-800';
      case 'reviewed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate metrics
  const reviewedToday = 8; // Mock value
  const avgResponseTime = '2.5 hrs';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const filters = [
    { id: 'all', label: 'All Check-ins', count: filterCounts.all },
    { id: 'pending', label: 'Pending', count: filterCounts.pending },
    { id: 'action-required', label: 'Action Required', count: filterCounts['action-required'] },
    { id: 'reviewed', label: 'Reviewed', count: filterCounts.reviewed },
    { id: 'high-severity', label: 'High Severity', count: filterCounts['high-severity'] }
  ];

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900">Check-in Reviews</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            Reviewed Today: <span className="font-semibold text-gray-900">{reviewedToday}</span> • 
            Avg Response: <span className="font-semibold text-gray-900 ml-1">{avgResponseTime}</span>
          </span>
        </div>
      </div>

      {/* Stripe-style Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as FilterType)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${activeFilter === filter.id
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            {filter.label}
            <span className={`ml-1.5 ${activeFilter === filter.id ? 'text-gray-300' : 'text-gray-500'}`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Integrated Search and Actions Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search patients or symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
        </div>

        {/* Date Range Filter */}
        <select 
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>

        {/* Type Filter */}
        <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500">
          <option value="">All Types</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="symptom-update">Symptom Update</option>
        </select>

        {/* Severity Filter */}
        <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500">
          <option value="">All Severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <div className="flex-1"></div>

        {/* Action Buttons */}
        <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700">
          <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Export
        </button>
        
        <button 
          onClick={() => router.push('/portal/settings')}
          className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 font-medium"
        >
          Configure Alerts
        </button>
      </div>

      {/* Bulk Actions Bar (show when items selected) */}
      {selectedCheckIns.size > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm text-gray-700 font-medium">
            {selectedCheckIns.size} selected
          </span>
          <button className="text-sm text-gray-600 hover:text-gray-900">Mark Reviewed</button>
          <button className="text-sm text-gray-600 hover:text-gray-900">Assign Provider</button>
          <button className="text-sm text-gray-600 hover:text-gray-900">Export</button>
          <button className="text-sm text-red-600 hover:text-red-700">Archive</button>
          <div className="flex-1"></div>
          <button 
            onClick={() => setSelectedCheckIns(new Set())}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Compact Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-8 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedCheckIns.size === filteredCheckIns.length && filteredCheckIns.length > 0}
                    onChange={toggleAllSelection}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Symptoms
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCheckIns.map((checkIn) => (
                <tr key={checkIn.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedCheckIns.has(checkIn.id)}
                      onChange={() => toggleCheckInSelection(checkIn.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      onClick={() => router.push(`/portal/patient/${checkIn.id}`)}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      {checkIn.patientName}
                    </button>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="text-sm text-gray-900 capitalize">
                      {checkIn.type.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(checkIn.status)}`}>
                      {checkIn.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getSeverityColor(checkIn.severity)}`}>
                      {checkIn.severity}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {checkIn.symptoms.join(', ')}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {new Date(checkIn.submittedAt).toLocaleString([], { 
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm">
                    <button 
                      onClick={() => router.push(`/portal/checkin/${checkIn.id}`)}
                      className="text-gray-600 hover:text-gray-900 mr-2"
                    >
                      Review
                    </button>
                    {checkIn.status === 'action-required' && (
                      <button 
                        onClick={() => {
                          alert(`Taking action for ${checkIn.patientName}`);
                          router.push(`/portal/patient/${checkIn.id}`);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Take Action
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer */}
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Showing {filteredCheckIns.length} of {checkIns.length} check-ins
            </span>
            <div className="flex items-center gap-2">
              <button className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900">Previous</button>
              <span className="px-2 py-1 text-sm text-gray-700">Page 1 of 1</span>
              <button className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
