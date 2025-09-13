'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';

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

export default function PrescriptionsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('provider');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'expired'>('all');

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
    ];
    
    setPrescriptions(mockPrescriptions);
    setLoading(false);
  };

  const filteredPrescriptions = prescriptions.filter(p => 
    filter === 'all' || p.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-600 mt-1">Manage patient prescriptions and refills</p>
        </div>
        <button 
          onClick={() => {
            alert('New Prescription feature coming soon!');
            // router.push('/portal/prescriptions/new');
          }}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
        >
          New Prescription
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Prescriptions</p>
          <p className="text-2xl font-bold text-gray-900">
            {prescriptions.filter(p => p.status === 'active').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600">
            {prescriptions.filter(p => p.status === 'pending').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Expiring Soon</p>
          <p className="text-2xl font-bold text-orange-600">5</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Refills Needed</p>
          <p className="text-2xl font-bold text-blue-600">
            {prescriptions.filter(p => p.refillsRemaining === 0).length}
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
          All
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'active' 
              ? 'bg-gray-900 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'pending' 
              ? 'bg-gray-900 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('expired')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'expired' 
              ? 'bg-gray-900 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Expired
        </button>
      </div>

      {/* Prescriptions Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medication
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dosage & Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Refills
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPrescriptions.map((prescription) => (
                <tr key={prescription.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => router.push(`/portal/patient/${prescription.id}`)}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline"
                    >
                      {prescription.patientName}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {prescription.medication}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{prescription.dosage}</div>
                    <div className="text-sm text-gray-500">{prescription.frequency}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(prescription.status)}`}>
                      {prescription.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {prescription.refillsRemaining} / {prescription.refills}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(prescription.expiryDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => router.push(`/portal/prescription/${prescription.id}`)}
                      className="text-gray-600 hover:text-gray-900 mr-3"
                    >
                      View
                    </button>
                    {prescription.status === 'pending' && (
                      <button 
                        onClick={() => {
                          // Update status and notify
                          const updatedPrescriptions = prescriptions.map(p => 
                            p.id === prescription.id ? {...p, status: 'active' as const} : p
                          );
                          setPrescriptions(updatedPrescriptions);
                          alert(`Approved prescription for ${prescription.patientName}`);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Approve
                      </button>
                    )}
                    {prescription.refillsRemaining === 0 && (
                      <button 
                        onClick={() => {
                          alert(`Renew prescription for ${prescription.patientName}`);
                          // router.push(`/portal/prescription/${prescription.id}/renew`);
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        Renew
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
