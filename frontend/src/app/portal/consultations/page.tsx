'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';

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

export default function ConsultationsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('provider');
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    // Check authentication and role
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole') as UserRole;
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    if (role) {
      setUserRole(role);
      // Check if user has access to this page
      if (role === 'admin') {
        // Regular admins might not have access to consultations
        // You could redirect them or show limited view
      }
    }

    // Fetch consultations (mock data for now)
    fetchConsultations();
  }, [router]);

  const fetchConsultations = async () => {
    // Mock data - replace with actual API call
    const mockConsultations: Consultation[] = [
      {
        id: '1',
        patientName: 'Sarah Johnson',
        type: 'Acne Treatment',
        status: 'pending',
        priority: 'high',
        date: '2024-01-15T10:00:00',
        provider: 'Dr. Smith'
      },
      {
        id: '2',
        patientName: 'Michael Chen',
        type: 'Follow-up',
        status: 'in-progress',
        priority: 'medium',
        date: '2024-01-15T11:00:00',
        provider: 'Dr. Jones'
      },
      {
        id: '3',
        patientName: 'Emily Davis',
        type: 'Initial Consultation',
        status: 'pending',
        priority: 'urgent',
        date: '2024-01-15T14:00:00',
        provider: 'Dr. Smith'
      },
      {
        id: '4',
        patientName: 'Robert Wilson',
        type: 'Prescription Renewal',
        status: 'completed',
        priority: 'low',
        date: '2024-01-14T16:00:00',
        provider: 'Dr. Brown'
      },
    ];
    
    setConsultations(mockConsultations);
    setLoading(false);
  };

  const filteredConsultations = consultations.filter(c => 
    filter === 'all' || c.status === filter
  );

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultations</h1>
          <p className="text-gray-600 mt-1">Manage patient consultations and appointments</p>
        </div>
        <button
          onClick={() => router.push('/patient/new-consultation')}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
        >
          New Consultation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Today</p>
          <p className="text-2xl font-bold text-gray-900">{consultations.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {consultations.filter(c => c.status === 'pending').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">
            {consultations.filter(c => c.status === 'in-progress').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {consultations.filter(c => c.status === 'completed').length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'all' 
              ? 'bg-gray-900 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          All ({consultations.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'pending' 
              ? 'bg-gray-900 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Pending ({consultations.filter(c => c.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('in-progress')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'in-progress' 
              ? 'bg-gray-900 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          In Progress ({consultations.filter(c => c.status === 'in-progress').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'completed' 
              ? 'bg-gray-900 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Completed ({consultations.filter(c => c.status === 'completed').length})
        </button>
      </div>

      {/* Consultations List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConsultations.map((consultation) => (
                <tr key={consultation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => router.push(`/portal/patient/${consultation.id}`)}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline"
                    >
                      {consultation.patientName}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{consultation.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(consultation.status)}`}>
                      {consultation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(consultation.priority)}`}>
                      {consultation.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {consultation.provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(consultation.date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => router.push(`/portal/consultation/${consultation.id}`)}
                      className="text-gray-600 hover:text-gray-900 mr-3"
                    >
                      View
                    </button>
                    {consultation.status === 'pending' && (
                      <button 
                        onClick={() => {
                          // Update status and navigate
                          const updatedConsultations = consultations.map(c => 
                            c.id === consultation.id ? {...c, status: 'in-progress' as const} : c
                          );
                          setConsultations(updatedConsultations);
                          router.push(`/portal/consultation/${consultation.id}`);
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
      </Card>
    </div>
  );
}
