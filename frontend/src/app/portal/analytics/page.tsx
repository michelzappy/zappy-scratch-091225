'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/Card';

export default function AnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  
  // Check if coming from plans page
  const planId = searchParams.get('plan');
  const condition = searchParams.get('condition');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    // Check if user has admin access
    if (role === 'provider') {
      // Regular providers don't have access to analytics
      router.push('/portal/dashboard');
      return;
    }
    
    // Admin, provider-admin, and super-admin can access
    if (role === 'admin' || role === 'provider-admin' || role === 'super-admin') {
      setLoading(false);
    } else {
      // Default redirect if no valid role
      router.push('/portal/dashboard');
    }
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
        <h1 className="text-2xl font-bold text-gray-900">
          {planId ? `Plan Analytics - ${condition || 'All Conditions'}` : 'Analytics'}
        </h1>
        <p className="text-gray-600 mt-1">
          {planId ? `Performance metrics for plan ${planId}` : 'Business intelligence and performance metrics'}
        </p>
      </div>

      {/* Plan-specific banner if coming from plans page */}
      {planId && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">Viewing Plan Analytics</h3>
              <p className="text-sm text-blue-700 mt-1">
                Plan ID: {planId} • Condition: {condition || 'All'}
              </p>
            </div>
            <button
              onClick={() => router.push('/portal/analytics')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All Analytics →
            </button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">{planId ? 'Plan Revenue' : 'Monthly Revenue'}</p>
          <p className="text-2xl font-bold text-gray-900">{planId ? '$12,840' : '$48,352'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">{planId ? 'Subscribers' : 'Growth Rate'}</p>
          <p className="text-2xl font-bold text-green-600">{planId ? '142' : '+12.5%'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">{planId ? 'Conversion Rate' : 'Patient Satisfaction'}</p>
          <p className="text-2xl font-bold text-blue-600">{planId ? '68%' : '4.8/5.0'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">{planId ? 'Retention Rate' : 'Provider Efficiency'}</p>
          <p className="text-2xl font-bold text-purple-600">{planId ? '94%' : '92%'}</p>
        </Card>
      </div>

      {/* Time Period Selector */}
      <div className="flex space-x-2">
        {[
          { value: '7d', label: '7 Days' },
          { value: '30d', label: '30 Days' },
          { value: '90d', label: '90 Days' },
          { value: 'ytd', label: 'YTD' }
        ].map((period) => (
          <button
            key={period.value}
            onClick={() => setSelectedPeriod(period.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              selectedPeriod === period.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {planId ? `Revenue Trends - ${condition} Plan` : 'Revenue Trends'}
        </h3>
        <div className="h-64 flex items-end space-x-2">
          {[65, 72, 78, 85, 79, 92, 88, 95, 101, 98, 105, 112].map((height, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t hover:from-blue-600 hover:to-blue-500 transition-colors"
                style={{ height: `${(height / 112) * 100}%` }}
              />
              <span className="text-xs text-gray-500 mt-2">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Total Revenue</p>
            <p className="text-xl font-bold text-gray-900">$1,248,352</p>
          </div>
          <div>
            <p className="text-gray-500">Average Order</p>
            <p className="text-xl font-bold text-gray-900">$142</p>
          </div>
          <div>
            <p className="text-gray-500">Growth Rate</p>
            <p className="text-xl font-bold text-green-600">+18.3%</p>
          </div>
        </div>
      </Card>

      {/* Condition Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Condition</h3>
          <div className="space-y-4">
            {[
              { name: 'Weight Loss', value: 35, color: 'bg-purple-500' },
              { name: 'Hair Loss', value: 28, color: 'bg-blue-500' },
              { name: 'Men\'s Health', value: 22, color: 'bg-green-500' },
              { name: 'Women\'s Health', value: 15, color: 'bg-pink-500' }
            ].map((condition) => (
              <div key={condition.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{condition.name}</span>
                  <span className="font-medium">{condition.value}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${condition.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${condition.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Demographics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Age 18-25</span>
              <span className="text-sm font-medium">12%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Age 26-35</span>
              <span className="text-sm font-medium">38%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Age 36-45</span>
              <span className="text-sm font-medium">28%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Age 46-55</span>
              <span className="text-sm font-medium">15%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Age 56+</span>
              <span className="text-sm font-medium">7%</span>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Male</span>
                <span className="text-sm font-medium">62%</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-600">Female</span>
                <span className="text-sm font-medium">38%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Provider Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Provider Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Provider</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Consultations</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Avg Response Time</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Patient Rating</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Dr. Sarah Johnson', consultations: 342, responseTime: '12m', rating: 4.9, revenue: 48520 },
                { name: 'Dr. Michael Chen', consultations: 298, responseTime: '15m', rating: 4.8, revenue: 42340 },
                { name: 'Dr. Emily Williams', consultations: 276, responseTime: '18m', rating: 4.9, revenue: 39180 },
                { name: 'Dr. David Miller', consultations: 254, responseTime: '14m', rating: 4.7, revenue: 36070 }
              ].map((provider, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-900">{provider.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{provider.consultations}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{provider.responseTime}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className="text-yellow-500">★</span> {provider.rating}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">${provider.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Medication Analytics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Medications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">By Volume</h4>
            <div className="space-y-3">
              {[
                { name: 'Semaglutide', units: 1234, growth: '+15%' },
                { name: 'Finasteride', units: 987, growth: '+8%' },
                { name: 'Tretinoin', units: 856, growth: '+12%' },
                { name: 'Sildenafil', units: 743, growth: '+5%' }
              ].map((med, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{med.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{med.units} units</span>
                    <span className="text-xs text-green-600">{med.growth}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">By Revenue</h4>
            <div className="space-y-3">
              {[
                { name: 'Semaglutide', revenue: 98720, margin: '42%' },
                { name: 'Tretinoin', revenue: 51360, margin: '58%' },
                { name: 'Finasteride', revenue: 39480, margin: '65%' },
                { name: 'Minoxidil', revenue: 28440, margin: '70%' }
              ].map((med, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{med.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">${med.revenue.toLocaleString()}</span>
                    <span className="text-xs text-gray-500">{med.margin} margin</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Geographic Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { state: 'California', patients: 2834, revenue: 402280 },
            { state: 'Texas', patients: 2156, revenue: 306196 },
            { state: 'Florida', patients: 1892, revenue: 268664 },
            { state: 'New York', patients: 1654, revenue: 234868 },
            { state: 'Illinois', patients: 1243, revenue: 176506 },
            { state: 'Pennsylvania', patients: 987, revenue: 140154 },
            { state: 'Arizona', patients: 876, revenue: 124392 },
            { state: 'Ohio', patients: 765, revenue: 108630 }
          ].map((state) => (
            <div key={state.state} className="text-center">
              <p className="text-sm font-medium text-gray-900">{state.state}</p>
              <p className="text-2xl font-bold text-gray-800">{state.patients.toLocaleString()}</p>
              <p className="text-xs text-gray-500">patients</p>
              <p className="text-sm text-green-600 font-medium">${(state.revenue / 1000).toFixed(0)}K</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
