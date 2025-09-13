'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';

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

export default function CheckInReviewsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('provider');
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

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
    ];
    
    setCheckIns(mockCheckIns);
    setLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Check-in Reviews</h1>
        <p className="text-gray-600 mt-1">Review patient check-ins and symptom updates</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-600">
            {checkIns.filter(c => c.status === 'pending').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Action Required</p>
          <p className="text-2xl font-bold text-red-600">
            {checkIns.filter(c => c.status === 'action-required').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">High Severity</p>
          <p className="text-2xl font-bold text-orange-600">
            {checkIns.filter(c => c.severity === 'high').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Reviewed Today</p>
          <p className="text-2xl font-bold text-green-600">8</p>
        </Card>
      </div>

      {/* Check-ins List */}
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
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Symptoms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {checkIns.map((checkIn) => (
                <tr key={checkIn.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => router.push(`/portal/patient/${checkIn.id}`)}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline"
                    >
                      {checkIn.patientName}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 capitalize">
                      {checkIn.type.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      checkIn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      checkIn.status === 'action-required' ? 'bg-red-100 text-red-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {checkIn.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(checkIn.severity)}`}>
                      {checkIn.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {checkIn.symptoms.join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(checkIn.submittedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => router.push(`/portal/checkin/${checkIn.id}`)}
                      className="text-gray-600 hover:text-gray-900 mr-3"
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
      </Card>
    </div>
  );
}
