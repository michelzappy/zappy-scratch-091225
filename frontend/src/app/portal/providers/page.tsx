'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, api } from '@/lib/api';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

interface Provider {
  id: string;
  name: string;
  email: string;
  specialty: string;
  licenseNumber: string;
  status: 'active' | 'inactive' | 'pending';
  patientsCount: number;
  joinedDate: string;
  rating?: number;
  consultationsToday?: number;
}

type FilterType = 'all' | 'active' | 'pending' | 'inactive';

export default function ProvidersPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [specialtyFilter, setSpecialtyFilter] = useState('');

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      
  // Get providers from API (unwrapped)
  const providersData = await api.get<any[]>('/api/providers');
      
      // Transform API data to match our interface
      const transformedProviders: Provider[] = providersData.map((item: any) => ({
        id: item.id || item.provider_id,
        name: item.name || item.full_name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown Provider',
        email: item.email || item.contact_email || '',
        specialty: item.specialty || item.specialization || item.medical_specialty || 'General',
        licenseNumber: item.license_number || item.medical_license || item.license || '',
        status: item.status || item.account_status || 'active',
        patientsCount: item.patients_count || item.patient_count || item.total_patients || 0,
        joinedDate: item.joined_date || item.created_at || item.registration_date || new Date().toISOString().split('T')[0],
        rating: item.rating || item.average_rating || item.provider_rating || 0,
        consultationsToday: item.consultations_today || item.todays_consultations || item.daily_consultations || 0
      }));
      
      setProviders(transformedProviders);
      
    } catch (err: any) {
      console.error('Error fetching providers:', err?.error || err);
      setError(err?.error || 'Failed to load providers');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole') as UserRole;
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    // Check if user has admin access
    if (role === 'provider') {
      // Regular providers don't have access to providers management
      router.push('/portal/dashboard');
      return;
    }
    
    // Admin, provider-admin, and super-admin can access
    if (role === 'admin' || role === 'provider-admin' || role === 'super-admin') {
      setUserRole(role);
      fetchProviders();
    } else {
      // Default redirect if no valid role
      router.push('/portal/dashboard');
    }
  }, [router]);

  // Filter counts
  const filterCounts = {
    all: providers.length,
    active: providers.filter(p => p.status === 'active').length,
    pending: providers.filter(p => p.status === 'pending').length,
    inactive: providers.filter(p => p.status === 'inactive').length
  };

  // Apply filters
  let filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          provider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          provider.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (activeFilter !== 'all') {
      matchesFilter = provider.status === activeFilter;
    }
    
    let matchesSpecialty = true;
    if (specialtyFilter) {
      matchesSpecialty = provider.specialty === specialtyFilter;
    }
    
    return matchesSearch && matchesFilter && matchesSpecialty;
  });

  const toggleProviderSelection = (providerId: string) => {
    const newSelection = new Set(selectedProviders);
    if (newSelection.has(providerId)) {
      newSelection.delete(providerId);
    } else {
      newSelection.add(providerId);
    }
    setSelectedProviders(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedProviders.size === filteredProviders.length) {
      setSelectedProviders(new Set());
    } else {
      setSelectedProviders(new Set(filteredProviders.map(p => p.id)));
    }
  };

  const exportProviders = () => {
    // Prepare data for export
    const dataToExport = selectedProviders.size > 0 
      ? filteredProviders.filter(p => selectedProviders.has(p.id))
      : filteredProviders;

    if (dataToExport.length === 0) {
      alert('No providers to export');
      return;
    }

    // Convert to CSV format
    const headers = ['Name', 'Email', 'Specialty', 'License Number', 'Status', 'Patients Count', 'Joined Date', 'Rating', 'Consultations Today'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(provider => [
        provider.name,
        provider.email,
        provider.specialty,
        provider.licenseNumber,
        provider.status,
        provider.patientsCount,
        provider.joinedDate,
        provider.rating || 'N/A',
        provider.consultationsToday || 0
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const filename = `providers_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate metrics
  const totalPatients = providers.reduce((sum, p) => sum + p.patientsCount, 0);
  const avgLoad = providers.length > 0 ? Math.round(totalPatients / providers.filter(p => p.status === 'active').length) : 0;

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
            onClick={fetchProviders}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filters = [
    { id: 'all', label: 'All Providers', count: filterCounts.all },
    { id: 'active', label: 'Active', count: filterCounts.active },
    { id: 'pending', label: 'Pending', count: filterCounts.pending },
    { id: 'inactive', label: 'Inactive', count: filterCounts.inactive }
  ];

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900">Providers</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            Total Patients: <span className="font-semibold text-gray-900">{totalPatients}</span> • 
            Avg Load: <span className="font-semibold text-gray-900 ml-1">{avgLoad}</span>
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
              placeholder="Search providers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
        </div>

        {/* Specialty Filter */}
        <select 
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          <option value="">All Specialties</option>
          <option value="Dermatology">Dermatology</option>
          <option value="Internal Medicine">Internal Medicine</option>
          <option value="Endocrinology">Endocrinology</option>
          <option value="Psychiatry">Psychiatry</option>
          <option value="Weight Management">Weight Management</option>
        </select>

        {/* Load Filter */}
        <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500">
          <option value="">All Loads</option>
          <option value="low">Low (0-50)</option>
          <option value="medium">Medium (50-100)</option>
          <option value="high">High (100+)</option>
        </select>

        {/* More Filters */}
        <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700">
          <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          More filters
        </button>

        <div className="flex-1"></div>

        {/* Action Buttons */}
        <button 
          onClick={() => exportProviders()}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700">
          <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Export
        </button>
        
        <button 
          onClick={() => router.push('/portal/providers/new')}
          className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 font-medium"
        >
          Add Provider
        </button>
      </div>

      {/* Bulk Actions Bar (show when items selected) */}
      {selectedProviders.size > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm text-gray-700 font-medium">
            {selectedProviders.size} selected
          </span>
          <button className="text-sm text-gray-600 hover:text-gray-900">Activate</button>
          <button className="text-sm text-gray-600 hover:text-gray-900">Deactivate</button>
          <button onClick={() => exportProviders()} className="text-sm text-gray-600 hover:text-gray-900">Export</button>
          <button className="text-sm text-gray-600 hover:text-gray-900">Send Message</button>
          <div className="flex-1"></div>
          <button 
            onClick={() => setSelectedProviders(new Set())}
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
                    checked={selectedProviders.size === filteredProviders.length && filteredProviders.length > 0}
                    onChange={toggleAllSelection}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialty
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patients
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Today
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProviders.map((provider) => (
                <tr key={provider.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedProviders.has(provider.id)}
                      onChange={() => toggleProviderSelection(provider.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      onClick={() => router.push(`/portal/provider/${provider.id}`)}
                      className="text-left hover:text-blue-600"
                    >
                      <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                      <div className="text-xs text-gray-500">{provider.email}</div>
                    </button>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{provider.specialty}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{provider.licenseNumber}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(provider.status)}`}>
                      {provider.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{provider.patientsCount}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {provider.consultationsToday || 0}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {provider.rating ? (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">{provider.rating}</span>
                        <svg className="w-3 h-3 text-yellow-500 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm">
                    <button 
                      onClick={() => router.push(`/portal/provider/${provider.id}`)}
                      className="text-gray-600 hover:text-gray-900 mr-2"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => router.push(`/portal/provider/${provider.id}/edit`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Manage
                    </button>
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
              Showing {filteredProviders.length} of {providers.length} providers
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
