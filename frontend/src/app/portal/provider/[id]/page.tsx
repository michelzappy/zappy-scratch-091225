'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Provider {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  department: string;
  licenseNumber: string;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  availability: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  credentials: {
    degree: string;
    boardCertifications: string[];
    yearsOfExperience: number;
  };
  consultationStats: {
    totalConsultations: number;
    thisMonth: number;
    averageRating: number;
    completionRate: number;
  };
  recentConsultations: Array<{
    id: string;
    patientName: string;
    date: string;
    type: string;
    status: string;
  }>;
}

export default function ProviderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const providerId = params.id as string;
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProvider();
  }, [providerId]);

  const fetchProvider = async () => {
    // Mock data - in production, fetch from API
    const mockProvider: Provider = {
      id: providerId,
      name: 'Dr. Sarah Smith',
      email: 'dr.smith@clinic.com',
      phone: '+1 (555) 123-4567',
      specialty: 'General Medicine',
      department: 'Internal Medicine',
      licenseNumber: 'MD123456789',
      status: 'active',
      joinDate: '2020-03-15',
      availability: {
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        wednesday: '9:00 AM - 5:00 PM',
        thursday: '9:00 AM - 5:00 PM',
        friday: '9:00 AM - 3:00 PM',
        saturday: 'Unavailable',
        sunday: 'Unavailable'
      },
      credentials: {
        degree: 'MD - Johns Hopkins University',
        boardCertifications: ['Internal Medicine', 'Family Medicine'],
        yearsOfExperience: 8
      },
      consultationStats: {
        totalConsultations: 1247,
        thisMonth: 89,
        averageRating: 4.8,
        completionRate: 97.3
      },
      recentConsultations: [
        {
          id: '1',
          patientName: 'John Doe',
          date: '2024-01-15T10:30:00Z',
          type: 'Follow-up',
          status: 'completed'
        },
        {
          id: '2',
          patientName: 'Jane Smith',
          date: '2024-01-15T14:00:00Z',
          type: 'Initial Consultation',
          status: 'completed'
        },
        {
          id: '3',
          patientName: 'Mike Johnson',
          date: '2024-01-16T09:00:00Z',
          type: 'Urgent Care',
          status: 'in-progress'
        }
      ]
    };

    setProvider(mockProvider);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConsultationStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading provider information...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Provider not found</p>
          <Link href="/portal/providers" className="mt-4 inline-block text-purple-600 hover:text-purple-700">
            ← Back to Providers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/portal/providers"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Providers
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Provider Details</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href={`/portal/provider/${providerId}/edit`}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
              >
                Edit Provider
              </Link>
              <button className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm">
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Header Card */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-purple-600">
                {provider.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{provider.name}</h2>
                  <p className="text-lg text-gray-600">{provider.specialty}</p>
                  <p className="text-sm text-gray-500">{provider.department}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(provider.status)}`}>
                  {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{provider.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-900">{provider.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">License</p>
                  <p className="text-gray-900">{provider.licenseNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'schedule', label: 'Schedule' },
              { key: 'consultations', label: 'Recent Consultations' },
              { key: 'performance', label: 'Performance' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Cards */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-sm">📊</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Total Consultations</p>
                    <p className="text-2xl font-bold text-gray-900">{provider.consultationStats.totalConsultations}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-sm">📈</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">{provider.consultationStats.thisMonth}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-sm">⭐</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Average Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{provider.consultationStats.averageRating}/5</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-sm">✅</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Completion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{provider.consultationStats.completionRate}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Credentials */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Credentials</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Education</p>
                  <p className="text-gray-900">{provider.credentials.degree}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Experience</p>
                  <p className="text-gray-900">{provider.credentials.yearsOfExperience} years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Board Certifications</p>
                  <div className="mt-1">
                    {provider.credentials.boardCertifications.map((cert, index) => (
                      <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Join Date</p>
                  <p className="text-gray-900">{new Date(provider.joinDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Weekly Schedule</h3>
            <div className="space-y-3">
              {Object.entries(provider.availability).map(([day, hours]) => (
                <div key={day} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <span className="text-gray-900 font-medium capitalize">{day}</span>
                  <span className={`text-sm ${hours === 'Unavailable' ? 'text-gray-500' : 'text-green-600'}`}>
                    {hours}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consultations Tab */}
        {activeTab === 'consultations' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Consultations</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {provider.recentConsultations.map((consultation) => (
                    <tr key={consultation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {consultation.patientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(consultation.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {consultation.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConsultationStatusColor(consultation.status)}`}>
                          {consultation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-purple-600 hover:text-purple-700 mr-3">View</button>
                        <button className="text-gray-600 hover:text-gray-700">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Patient Satisfaction</span>
                  <span className="text-gray-900 font-medium">{provider.consultationStats.averageRating}/5.0</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(provider.consultationStats.averageRating / 5) * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="text-gray-900 font-medium">{provider.consultationStats.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${provider.consultationStats.completionRate}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Monthly Goal Progress</span>
                  <span className="text-gray-900 font-medium">{provider.consultationStats.thisMonth}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${provider.consultationStats.thisMonth}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Feedback</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-green-400 pl-4">
                  <p className="text-sm text-gray-600">"Excellent care and very thorough explanation."</p>
                  <p className="text-xs text-gray-500 mt-1">- Patient Review, Jan 14</p>
                </div>
                <div className="border-l-4 border-blue-400 pl-4">
                  <p className="text-sm text-gray-600">"Dr. Smith was very professional and helpful."</p>
                  <p className="text-xs text-gray-500 mt-1">- Patient Review, Jan 12</p>
                </div>
                <div className="border-l-4 border-green-400 pl-4">
                  <p className="text-sm text-gray-600">"Quick response time and clear instructions."</p>
                  <p className="text-xs text-gray-500 mt-1">- Patient Review, Jan 10</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}