'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

interface Consultation {
  id: string;
  patientName: string;
  type: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  date: string;
  provider?: string;
}

type FilterType = 'all' | 'pending' | 'in-progress' | 'completed' | 'urgent';

export default function ConsultationsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('provider');
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConsultations, setSelectedConsultations] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState('today');

  useEffect(() => {
    // Try to get role from localStorage, but don't redirect if not found
    const role = localStorage.getItem('userRole') as UserRole;
    
    if (role) {
      setUserRole(role);
    } else {
      // Default to provider if no role is set
      setUserRole('provider');
      // Set default role in localStorage for consistency
      localStorage.setItem('userRole', 'provider');
    }

    fetchConsultations();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchConsultations();
  }, [activeFilter, dateRange]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        fetchConsultations();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching consultations with params:', {
        status: activeFilter !== 'all' ? activeFilter : undefined,
        dateRange,
        search: searchTerm || undefined
      });
      
      // Use provider queue endpoint to get consultations for providers
      const response = await apiClient.consultations.getProviderQueue({
        status: activeFilter !== 'all' ? activeFilter : undefined,
        dateRange,
        search: searchTerm || undefined
      });
      
      console.log('📦 Raw API response:', response);
      console.log('📊 Response data:', response.data);
      
      const consultationsData = response.data?.data || response.data || [];
      
      console.log('🔄 Consultations data to transform:', consultationsData);
      
      // Transform API data to match our interface
      const transformedConsultations: Consultation[] = consultationsData.map((item: any) => ({
        id: item.id,
        patientName: item.patient_name || `${item.first_name || ''} ${item.last_name || ''}`.trim(),
        type: item.consultation_type || item.type || 'General Consultation',
        status: item.status || 'pending',
        priority: item.priority || 'medium',
        date: item.created_at || item.submitted_at || new Date().toISOString(),
        provider: item.provider_name || item.assigned_provider || 'Unassigned'
      }));
      
      console.log('✅ Transformed consultations:', transformedConsultations);
      
      setConsultations(transformedConsultations);
      
    } catch (err) {
      console.error('❌ Error fetching consultations:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response,
        stack: err.stack
      });
      setError('Failed to load consultations');
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter counts
  const filterCounts = {
    all: consultations.length,
    pending: consultations.filter(c => c.status === 'pending').length,
    'in-progress': consultations.filter(c => c.status === 'in-progress').length,
    completed: consultations.filter(c => c.status === 'completed').length,
    urgent: consultations.filter(c => c.priority === 'urgent' || c.priority === 'high').length
  };

  // Apply filters
  let filteredConsultations = consultations.filter(consultation => {
    const matchesSearch = consultation.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          consultation.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (activeFilter !== 'all') {
      if (activeFilter === 'urgent') {
        matchesFilter = consultation.priority === 'urgent' || consultation.priority === 'high';
      } else {
        matchesFilter = consultation.status === activeFilter;
      }
    }
    
    return matchesSearch && matchesFilter;
  });

  const toggleConsultationSelection = (consultationId: string) => {
    const newSelection = new Set(selectedConsultations);
    if (newSelection.has(consultationId)) {
      newSelection.delete(consultationId);
    } else {
      newSelection.add(consultationId);
    }
    setSelectedConsultations(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedConsultations.size === filteredConsultations.length) {
      setSelectedConsultations(new Set());
    } else {
      setSelectedConsultations(new Set(filteredConsultations.map(c => c.id)));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchConsultations}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filters = [
    { id: 'all', label: 'All', count: filterCounts.all },
    { id: 'pending', label: 'Pending', count: filterCounts.pending },
    { id: 'in-progress', label: 'In Progress', count: filterCounts['in-progress'] },
    { id: 'completed', label: 'Completed', count: filterCounts.completed },
    { id: 'urgent', label: 'Urgent/High Priority', count: filterCounts.urgent }
  ];

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900">Consultations</h1>
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
              placeholder="Search consultations..."
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

        {/* Priority Filter */}
        <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500">
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Provider Filter */}
        <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500">
          <option value="">All Providers</option>
          <option value="smith">Dr. Smith</option>
          <option value="jones">Dr. Jones</option>
          <option value="brown">Dr. Brown</option>
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
          onClick={() => router.push('/patient/new-consultation')}
          className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 font-medium"
        >
          New Consultation
        </button>
      </div>

      {/* Bulk Actions Bar (show when items selected) */}
      {selectedConsultations.size > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm text-gray-700 font-medium">
            {selectedConsultations.size} selected
          </span>
          <button className="text-sm text-gray-600 hover:text-gray-900">Reassign</button>
          <button className="text-sm text-gray-600 hover:text-gray-900">Reschedule</button>
          <button className="text-sm text-gray-600 hover:text-gray-900">Export</button>
          <button className="text-sm text-red-600 hover:text-red-700">Cancel</button>
          <div className="flex-1"></div>
          <button 
            onClick={() => setSelectedConsultations(new Set())}
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
                    checked={selectedConsultations.size === filteredConsultations.length && filteredConsultations.length > 0}
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
                  Priority
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConsultations.map((consultation) => (
                <tr key={consultation.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedConsultations.has(consultation.id)}
                      onChange={() => toggleConsultationSelection(consultation.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      onClick={() => router.push(`/portal/patient/${consultation.id}`)}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      {consultation.patientName}
                    </button>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{consultation.type}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(consultation.status)}`}>
                      {consultation.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(consultation.priority)}`}>
                      {consultation.priority}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {consultation.provider}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {new Date(consultation.date).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm">
                    <button 
                      onClick={() => router.push(`/portal/consultation/${consultation.id}`)}
                      className="text-gray-600 hover:text-gray-900 mr-2"
                    >
                      View
                    </button>
                    {consultation.status === 'pending' && (
                      <button
                        onClick={async () => {
                          try {
                            await apiClient.consultations.accept(consultation.id);
                            // Update local state
                            const updatedConsultations = consultations.map(c =>
                              c.id === consultation.id ? {...c, status: 'in-progress' as const} : c
                            );
                            setConsultations(updatedConsultations);
                            router.push(`/portal/consultation/${consultation.id}`);
                          } catch (err) {
                            console.error('Error accepting consultation:', err);
                            alert('Failed to start consultation. Please try again.');
                          }
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Start
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
              Showing {filteredConsultations.length} of {consultations.length} consultations
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
