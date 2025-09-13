'use client';

import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import LineChart from '@/components/LineChart';

// Import refactored components
import MetricsGrid from './components/MetricsGrid';
import PatientIssuesList from './components/PatientIssuesList';
import PendingConsultations from './components/PendingConsultations';
import QuickActions from './components/QuickActions';
import ProblemCategories from './components/ProblemCategories';
import RecentActivity from './components/RecentActivity';
import useDashboardData from './hooks/useDashboardData';

export default function UnifiedDashboardPage() {
  const router = useRouter();
  const {
    userRole,
    userName,
    loading,
    period,
    setPeriod,
    patientIssues,
    pendingConsultations,
    clinicalMetrics,
    businessMetrics,
    problemCategories,
    chartData
  } = useDashboardData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const isAdmin = userRole === 'admin' || userRole === 'provider-admin' || userRole === 'super-admin';
  const isProvider = userRole === 'provider' || userRole === 'provider-admin';
  const hasHighPriorityIssues = patientIssues.filter(i => i.priority === 'high').length > 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'Operations Dashboard' : `Welcome back, ${userName}`}
          </h1>
          <p className="text-gray-600 mt-1">
            {userRole === 'provider' && "Here's your clinical overview for today"}
            {userRole === 'admin' && "Patient care management and support overview"}
            {userRole === 'provider-admin' && "Combined clinical and operations overview"}
            {userRole === 'super-admin' && "System and business overview"}
          </p>
        </div>
        {isAdmin && (
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
      {isAdmin && hasHighPriorityIssues && (
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

      {/* Metrics Grids */}
      {isProvider && (
        <MetricsGrid title="Clinical Metrics" metrics={clinicalMetrics} />
      )}
      
      {isAdmin && (
        <MetricsGrid title="Business Metrics" metrics={businessMetrics} />
      )}

      {/* Admin Operations Section */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PatientIssuesList issues={patientIssues} />
          <PendingConsultations consultations={pendingConsultations} />
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

        <QuickActions userRole={userRole} />
      </div>

      {/* Problem Categories for Admins */}
      {isAdmin && (
        <ProblemCategories categories={problemCategories} />
      )}

      {/* Recent Activity */}
      <RecentActivity userRole={userRole} />
    </div>
  );
}
