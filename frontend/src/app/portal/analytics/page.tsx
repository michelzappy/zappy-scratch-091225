'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    if (role === 'provider') {
      router.push('/portal/dashboard');
      return;
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Business intelligence and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Monthly Revenue</p>
          <p className="text-2xl font-bold text-gray-900">$48,352</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Growth Rate</p>
          <p className="text-2xl font-bold text-green-600">+12.5%</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Patient Satisfaction</p>
          <p className="text-2xl font-bold text-blue-600">4.8/5.0</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Provider Efficiency</p>
          <p className="text-2xl font-bold text-purple-600">92%</p>
        </Card>
      </div>

      <Card className="p-6">
        <p className="text-gray-500">Detailed analytics dashboard coming soon...</p>
      </Card>
    </div>
  );
}
