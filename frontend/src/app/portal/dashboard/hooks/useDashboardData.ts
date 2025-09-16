import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { PatientIssue } from '../components/PatientIssuesList';
import type { PendingConsultation } from '../components/PendingConsultations';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

export default function useDashboardData() {
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

  return {
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
  };
}
