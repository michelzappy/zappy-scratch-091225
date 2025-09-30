'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import TreatmentPlanDashboard from '@/components/TreatmentPlanDashboard';
import NextStepHero from '@/components/NextStepHero';

export default function PatientDashboard() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [patientData, setPatientData] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [urgentActions, setUrgentActions] = useState<any[]>([]);
  const [nextDelivery, setNextDelivery] = useState<any>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const [patient, programsData, orders, stats] = await Promise.all([
          apiClient.patients.getProfile().catch(() => ({ data: null })),
          apiClient.patients.getPrograms().catch(() => ({ data: [] })),
          apiClient.patients.getOrders({ limit: 1 }).catch(() => ({ data: [] })),
          apiClient.patients.getStats().catch(() => ({ data: {} }))
        ]);

        setPatientData(patient.data);
        setPrograms(programsData.data || []);
        setNextDelivery(orders.data?.[0] || null);
        setUnreadMessages(stats.data?.unread_messages || 0);

        const actions: any[] = [];
        
        programsData.data?.forEach((program: any) => {
          const daysUntilRefill = program.days_until_refill || 0;
          if (daysUntilRefill <= 7 && daysUntilRefill >= 0) {
            actions.push({
              type: 'refill',
              priority: daysUntilRefill <= 3 ? 'urgent' : 'important',
              message: `Refill due in ${daysUntilRefill} days`,
              program: program,
              action: `/patient/refill-checkin?prescription=${program.id}`
            });
          }
        });

        if (stats.data?.unread_messages > 0) {
          actions.push({
            type: 'message',
            priority: 'normal',
            message: `${stats.data.unread_messages} unread message${stats.data.unread_messages > 1 ? 's' : ''}`,
            action: '/patient/messages'
          });
        }

        setUrgentActions(actions);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const patientName = patientData ? `${patientData.first_name}` : 'there';

  return (
    <div className="min-h-screen bg-cream-100">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Simple Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {patientName}</h1>
            <p className="text-slate-600 mt-1">Here's your health overview</p>
          </div>
          {unreadMessages > 0 && (
            <Link href="/patient/messages" className="flex items-center gap-2 px-4 py-3 bg-coral-100 text-coral-700 rounded-lg hover:bg-coral-200 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">{unreadMessages} new</span>
            </Link>
          )}
        </div>

        {/* Next Step Hero - Primary Action */}
        <NextStepHero 
          action={{
            type: 'medication',
            title: 'Take Your Medicine',
            subtitle: 'Semaglutide 0.5mg - Tomorrow, 9:00 AM',
            actionUrl: '/patient/orders',
            actionLabel: 'Mark as Taken',
            secondaryActionLabel: 'Set Reminder'
          }}
        />

        {/* Treatment Plan Dashboard Widget */}
        <TreatmentPlanDashboard />
      </div>
    </div>
  );
}
