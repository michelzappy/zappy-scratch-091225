'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import LineChart from '@/components/LineChart';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

interface PatientIssue {
  id: string;
  patient: string;
  issue: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'assigned' | 'in-progress' | 'resolved';
}

interface PendingConsultation {
  id: string;
  patient: string;
  condition: string;
  submitted: string;
  provider: string;
  status: 'new' | 'reviewing' | 'completed';
}

export default function UnifiedDashboardPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('provider');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');

  // Admin-specific state
  const [patientIssues, setPatientIssues] = useState<PatientIssue[]>([]);
  const [pendingConsultations, setPendingConsultations] = useState<PendingConsultation[]>([]);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/portal/login');
      return;
    }

    // Get user data
    const storedRole = localStorage.getItem('userRole') as UserRole;
    const storedUserData = localStorage.getItem('userData');
    
    if (storedRole) {
      setUserRole(storedRole);
      
      // Load admin-specific data
      if (storedRole === 'admin' || storedRole === 'provider-admin' || storedRole === 'super-admin') {
        loadAdminData();
      }
    }
    
    if (storedUserData) {
      const userData = JSON.parse(storedUserData);
      setUserName(userData.name || 'User');
    }

    setLoading(false);
  }, [router]);

  const loadAdminData = () => {
    // Mock patient issues
    setPatientIssues([
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
    ]);

    // Mock pending consultations
    setPendingConsultations([
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
    ]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Clinical metrics (for providers)
  const clinicalMetrics = [
    { 
      label: 'Active Consultations', 
      value: '12', 
      urgent: userRole !== 'provider' ? 3 : 0,
      description: 'awaiting response',
      change: '+3', 
      changeType: 'increase' as const 
    },
    { 
      label: 'Patients Today', 
      value: '8', 
      urgent: 0,
      description: '',
      change: '+2', 
      changeType: 'increase' as const 
    },
    { 
      label: 'Pending Reviews', 
      value: '5', 
      urgent: userRole !== 'provider' ? 2 : 0,
      description: 'need attention',
      change: '-1', 
      changeType: 'decrease' as const 
    },
    { 
      label: 'Messages', 
      value: '3', 
      urgent: 0,
      description: '',
      change: '0', 
      changeType: 'neutral' as const 
    },
  ];

  // Business metrics (for admins)
  const businessMetrics = [
    { label: 'Total Revenue', value: '$48,352', change: '+12%', changeType: 'increase' as const },
    { label: 'Active Users', value: '1,243', change: '+8%', changeType: 'increase' as const },
    { label: 'Support Tickets', value: '27', urgent: 5, description: 'high priority', change: '-5', changeType: 'decrease' as const },
    { label: 'Provider Utilization', value: '87%', change: '+3%', changeType: 'increase' as const },
  ];

  // Problem categories for admins
  const problemCategories = [
    { category: 'Medication Issues', count: 23, percentage: 35 },
    { category: 'Platform Access', count: 18, percentage: 27 },
    { category: 'Billing Problems', count: 12, percentage: 18 },
    { category: 'Consultation Delays', count: 8, percentage: 12 },
    { category: 'Shipping Issues', count: 5, percentage: 8 }
  ];

  // Sample chart data
  const rawData = userRole === 'provider' ? 
    [12, 19, 15, 25, 22, 30, 28] : 
    [4200, 5100, 4800, 6200, 5900, 7100, 6800];
  
  const chartData = rawData.map((value, index) => ({
    x: index,
    y: value
  }));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-green-100 text-green-800';
      case 'new': return 'bg-purple-100 text-purple-800';
      case 'reviewing': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {userRole === 'admin' || userRole === 'provider-admin' || userRole === 'super-admin' 
              ? 'Operations Dashboard' 
              : `Welcome back, ${userName}`}
          </h1>
          <p className="text-gray-600 mt-1">
            {userRole === 'provider' && "Here's your clinical overview for today"}
            {userRole === 'admin' && "Patient care management and support overview"}
            {userRole === 'provider-admin' && "Combined clinical and operations overview"}
            {userRole === 'super-admin' && "System and business overview"}
          </p>
        </div>
        {(userRole === 'admin' || userRole === 'provider-admin' || userRole === 'super-admin') && (
          <div className="flex items-center gap-3">
            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <button 
              onClick={() => router.push('/portal/messages')}
              className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
            >
              Priority Queue
            </button>
          </div>
        )}
      </div>

      {/* Status Banner for Admins */}
      {(userRole === 'admin' || userRole === 'provider-admin' || userRole === 'super-admin') && 
       patientIssues.filter(i => i.priority === 'high').length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                {patientIssues.filter(i => i.priority === 'high').length} Items Need Your Attention
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                {patientIssues.filter(i => i.priority === 'high' && i.status === 'pending').length} patients with urgent questions • 
                {' '}{pendingConsultations.filter(c => c.provider === 'Unassigned').length} consultations awaiting assignment
              </p>
            </div>
            <button 
              onClick={() => router.push('/portal/messages')}
              className="ml-3 text-sm font-medium text-blue-800 hover:text-blue-900"
            >
              Review →
            </button>
          </div>
        </Card>
      )}

      {/* Metrics Grid - Clinical (for providers and provider-admin) */}
      {(userRole === 'provider' || userRole === 'provider-admin') && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Clinical Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {clinicalMetrics.map((metric, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{metric.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                    {metric.urgent > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {metric.urgent} {metric.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    {metric.urgent > 0 && (
                      <span className="mb-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {metric.urgent} urgent
                      </span>
                    )}
                    <div className={`text-sm font-medium ${
                      metric.changeType === 'increase' ? 'text-green-600' :
                      metric.changeType === 'decrease' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {metric.change}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Grid - Business (for admins) */}
      {(userRole === 'admin' || userRole === 'provider-admin' || userRole === 'super-admin') && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {businessMetrics.map((metric, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">{metric.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                    {metric.description && (
                      <p className="text-xs text-gray-500 mt-1">{metric.urgent} {metric.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    {metric.urgent && metric.urgent > 0 && (
                      <span className="mb-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {metric.urgent} urgent
                      </span>
                    )}
                    <div className={`text-sm font-medium ${
                      metric.changeType === 'increase' ? 'text-green-600' :
                      metric.changeType === 'decrease' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {metric.change}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Admin Operations Section */}
      {(userRole === 'admin' || userRole === 'provider-admin' || userRole === 'super-admin') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Support Queue */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Patient Support Queue</h2>
                <button 
                  onClick={() => router.push('/portal/messages')}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  View all →
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {patientIssues.map((issue) => (
                <div key={issue.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-gray-600">{issue.id}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                          {issue.priority}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(issue.status)}`}>
                          {issue.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{issue.patient}</p>
                      <p className="text-sm text-gray-600 mt-1">{issue.issue}</p>
                      <p className="text-xs text-gray-500 mt-1">{issue.time}</p>
                    </div>
                    <button 
                      onClick={() => router.push(`/portal/patient/${issue.id}`)}
                      className="ml-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Handle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pending Consultations */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Pending Consultations</h2>
                <button 
                  onClick={() => router.push('/portal/consultations')}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  View all →
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {pendingConsultations.map((consultation) => (
                <div key={consultation.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-gray-600">{consultation.id}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(consultation.status)}`}>
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
                    <button 
                      onClick={() => router.push(`/portal/consultation/${consultation.id}`)}
                      className="ml-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Chart and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {userRole === 'provider' ? 'Weekly Consultations' : 'Weekly Revenue'}
          </h3>
          <LineChart data={chartData} height={250} />
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {(userRole === 'provider' || userRole === 'provider-admin') && (
              <>
                <button 
                  onClick={() => router.push('/portal/consultations')}
                  className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-left"
                >
                  <span className="text-xl mb-2 block">📋</span>
                  <p className="text-sm font-medium text-gray-900">Consultations</p>
                </button>
                <button 
                  onClick={() => router.push('/portal/messages')}
                  className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-left"
                >
                  <span className="text-xl mb-2 block">💬</span>
                  <p className="text-sm font-medium text-gray-900">Messages</p>
                </button>
              </>
            )}
            {(userRole === 'admin' || userRole === 'provider-admin' || userRole === 'super-admin') && (
              <>
                <button 
                  onClick={() => alert('Emergency response activated')}
                  className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-left"
                >
                  <span className="text-xl mb-2 block">🚨</span>
                  <p className="text-sm font-medium text-gray-900">Emergency</p>
                </button>
                <button 
                  onClick={() => router.push('/portal/analytics')}
                  className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-left"
                >
                  <span className="text-xl mb-2 block">📊</span>
                  <p className="text-sm font-medium text-gray-900">Analytics</p>
                </button>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Problem Categories for Admins */}
      {(userRole === 'admin' || userRole === 'provider-admin' || userRole === 'super-admin') && (
        <Card className="p-6">
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
                    className="bg-gray-900 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {(userRole === 'provider' || userRole === 'provider-admin') && (
            <>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">New consultation from Sarah Johnson</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Prescription approved for Michael Chen</p>
                  <p className="text-xs text-gray-500">15 minutes ago</p>
                </div>
              </div>
            </>
          )}
          {(userRole === 'admin' || userRole === 'provider-admin' || userRole === 'super-admin') && (
            <>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">High priority support ticket from Emily Davis</p>
                  <p className="text-xs text-gray-500">10 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">3 consultations need provider assignment</p>
                  <p className="text-xs text-gray-500">30 minutes ago</p>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
