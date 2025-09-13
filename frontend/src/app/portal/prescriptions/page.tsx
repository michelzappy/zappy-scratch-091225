'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

interface Prescription {
  id: string;
  patientName: string;
  medication: string;
  dosage: string;
  frequency: string;
  status: 'active' | 'pending' | 'expired' | 'cancelled';
  prescribedDate: string;
  expiryDate: string;
  refills: number;
  refillsRemaining: number;
}

type FilterType = 'all' | 'active' | 'pending' | 'expired' | 'refill-needed';

export default function PrescriptionsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('provider');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescriptions, setSelectedPrescriptions] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState('30d');

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
        // Regular admins might not have access to prescriptions
        router.push('/portal/dashboard');
        return;
      }
    }

    fetchPrescriptions();
  }, [router]);

  const fetchPrescriptions = async () => {
    // Mock data
    const mockPrescriptions: Prescription[] = [
      {
        id: '1',
        patientName: 'Sarah Johnson',
        medication: 'Tretinoin 0.025%',
        dosage: 'Apply thin layer',
        frequency: 'Once daily at bedtime',
        status: 'active',
        prescribedDate: '2024-01-01',
        expiryDate: '2024-07-01',
        refills: 6,
        refillsRemaining: 4
      },
      {
        id: '2',
        patientName: 'Michael Chen',
        medication: 'Hydrocortisone 2.5%',
        dosage: 'Apply to affected areas',
        frequency: 'Twice daily',
        status: 'pending',
        prescribedDate: '2024-01-15',
        expiryDate: '2024-04-15',
        refills: 3,
        refillsRemaining: 3
      },
      {
        id: '3',
        patientName: 'Emily Davis',
        medication: 'Doxycycline 100mg',
        dosage: '1 tablet',
        frequency: 'Twice daily with food',
        status: 'active',
        prescribedDate: '2023-12-15',
        expiryDate: '2024-03-15',
        refills: 2,
        refillsRemaining: 0
      },
      {
        id: '4',
        patientName: 'Robert Wilson',
        medication: 'Finasteride 1mg',
        dosage: '1 tablet',
        frequency: 'Once daily',
        status: 'active',
        prescribedDate: '2023-10-01',
        expiryDate: '2024-04-01',
        refills: 12,
        refillsRemaining: 6
      },
      {
        id: '5',
        patientName: 'Jessica Martinez',
        medication: 'Adapalene 0.1%',
        dosage: 'Apply thin layer',
        frequency: 'Once daily at night',
        status: 'expired',
        prescribedDate: '2023-06-15',
        expiryDate: '2023-12-15',
        refills: 6,
        refillsRemaining: 2
      },
      {
        id: '6',
        patientName: 'David Thompson',
        medication: 'Phentermine 37.5mg',
        dosage: '1 tablet',
        frequency: 'Once daily before breakfast',
        status: 'active',
        prescribedDate: '2024-01-10',
        expiryDate: '2024-04-10',
        refills: 3,
        refillsRemaining: 2
      }
    ];
    
    setPrescriptions(mockPrescriptions);
    setLoading(false);
  };

  // Filter counts
  const filterCounts = {
    all: prescriptions.length,
    active: prescriptions.filter(p => p.status === 'active').length,
    pending: prescriptions.filter(p => p.status === 'pending').length,
    expired: prescriptions.filter(p => p.status === 'expired').length,
    'refill-needed': prescriptions.filter(p => p.refillsRemaining === 0).length
  };

  // Apply filters
  let filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          prescription.medication.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (activeFilter !== 'all') {
      if (activeFilter === 'refill-needed') {
        matchesFilter = prescription.refillsRemaining === 0;
      } else {
        matchesFilter = prescription.status === activeFilter;
      }
    }
    
    return matchesSearch && matchesFilter;
  });

  const togglePrescriptionSelection = (prescriptionId: string) => {
    const newSelection = new Set(selectedPrescriptions);
    if (newSelection.has(prescriptionId)) {
      newSelection.delete(prescriptionId);
    } else {
      newSelection.add(prescriptionId);
    }
    setSelectedPrescriptions(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedPrescriptions.size === filteredPrescriptions.length) {
      setSelectedPrescriptions(new Set());
    } else {
      setSelectedPrescriptions(new Set(filteredPrescriptions.map(p => p.id)));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApprove = (prescriptionId: string) => {
    const updatedPrescriptions = prescriptions.map(p => 
      p.id === prescriptionId ? {...p, status: 'active' as const} : p
    );
    setPrescriptions(updatedPrescriptions);
  };

  // Calculate expiring soon
  const expiringSoon = prescriptions.filter(p => {
    const daysUntilExpiry = Math.floor((new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const filters = [
    { id: 'all', label: 'All', count: filterCounts.all },
    { id: 'active', label: 'Active', count: filterCounts.active },
    { id: 'pending', label: 'Pending', count: filterCounts.pending },
    { id: 'expired', label: 'Expired', count: filterCounts.expired },
    { id: 'refill-needed', label: 'Refill Needed', count: filterCounts['refill-needed'] }
  ];

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900">Prescriptions</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            <span className="font-semibold text-orange-600">{expiringSoon}</span> expiring soon
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
              placeholder="Search prescriptions..."
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
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>

        {/* Medication Type Filter */}
        <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500">
          <option value="">All Medications</option>
          <option value="topical">Topical</option>
          <option value="oral">Oral</option>
          <option value="injectable">Injectable</option>
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
        <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700">
          <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Export
        </button>
        
        <button 
          onClick={() => router.push('/portal/prescriptions/new')}
          className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 font-medium"
        >
          New Prescription
        </button>
      </div>

      {/* Bulk Actions Bar (show when items selected) */}
      {selectedPrescriptions.size > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm text-gray-700 font-medium">
            {selectedPrescriptions.size} selected
          </span>
          <button className="text-sm text-gray-600 hover:text-gray-900">Approve All</button>
          <button className="text-sm text-gray-600 hover:text-gray-900">Renew</button>
          <button className="text-sm text-gray-600 hover:text-gray-900">Export</button>
          <button className="text-sm text-red-600 hover:text-red-700">Cancel</button>
          <div className="flex-1"></div>
          <button 
            onClick={() => setSelectedPrescriptions(new Set())}
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
                    checked={selectedPrescriptions.size === filteredPrescriptions.length && filteredPrescriptions.length > 0}
                    onChange={toggleAllSelection}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medication
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dosage & Frequency
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Refills
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPrescriptions.map((prescription) => {
                const daysUntilExpiry = Math.floor((new Date(prescription.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;
                
                return (
                  <tr key={prescription.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedPrescriptions.has(prescription.id)}
                        onChange={() => togglePrescriptionSelection(prescription.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button
                        onClick={() => router.push(`/portal/patient/${prescription.id}`)}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {prescription.patientName}
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {prescription.medication}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm text-gray-900">{prescription.dosage}</div>
                      <div className="text-xs text-gray-500">{prescription.frequency}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(prescription.status)}`}>
                        {prescription.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {prescription.refillsRemaining}/{prescription.refills}
                      </div>
                      {prescription.refillsRemaining === 0 && (
                        <div className="text-xs text-red-600">None left</div>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className={`text-sm ${isExpiringSoon ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                        {new Date(prescription.expiryDate).toLocaleDateString()}
                      </div>
                      {isExpiringSoon && (
                        <div className="text-xs text-orange-600">{daysUntilExpiry}d left</div>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm">
                      <button 
                        onClick={() => router.push(`/portal/prescription/${prescription.id}`)}
                        className="text-gray-600 hover:text-gray-900 mr-2"
                      >
                        View
                      </button>
                      {prescription.status === 'pending' && (
                        <button 
                          onClick={() => handleApprove(prescription.id)}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                        >
                          Approve
                        </button>
                      )}
                      {(prescription.refillsRemaining === 0 || isExpiringSoon) && (
                        <button 
                          onClick={() => router.push(`/portal/prescription/${prescription.id}/renew`)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Renew
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer */}
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Showing {filteredPrescriptions.length} of {prescriptions.length} prescriptions
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
