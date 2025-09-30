'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';

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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Simple Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {patientName}</h1>
            <p className="text-slate-600 mt-1">Here's your health overview</p>
          </div>
          {unreadMessages > 0 && (
            <Link href="/patient/messages" className="flex items-center gap-2 px-4 py-3 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">{unreadMessages} new</span>
            </Link>
          )}
        </div>

        {/* Status Card */}
        {urgentActions.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900 mb-1">Action Required</h3>
                <div className="space-y-2">
                  {urgentActions.map((action, index) => (
                    <Link 
                      key={index}
                      href={action.action}
                      className="block text-sm text-slate-600 hover:text-rose-600"
                    >
                      {action.message}
                      {action.program && ` - ${action.program.medication_name}`}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Programs */}
        {programs.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">My Treatments</h2>
            
            {programs.map((program) => (
              <div key={program.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Left accent bar */}
                <div className="flex">
                  <div className={`w-1.5 ${
                    program.category === 'weight_loss' ? 'bg-rose-500' :
                    program.category === 'strength' ? 'bg-orange-500' :
                    program.category === 'hair_loss' ? 'bg-rose-400' :
                    'bg-rose-500'
                  }`}></div>
                  
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Program Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            program.category === 'weight_loss' ? 'bg-rose-50' :
                            program.category === 'strength' ? 'bg-orange-50' :
                            program.category === 'hair_loss' ? 'bg-rose-50' :
                            'bg-rose-50'
                          }`}>
                            <svg className={`w-5 h-5 ${
                              program.category === 'weight_loss' ? 'text-rose-600' :
                              program.category === 'strength' ? 'text-orange-600' :
                              'text-rose-600'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{program.program_name || program.category}</h3>
                            <p className="text-sm text-slate-500">Since {new Date(program.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                        
                        {/* Medication Details */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Medication</p>
                            <p className="font-medium text-slate-900">{program.medication_name}</p>
                            <p className="text-sm text-slate-600">{program.dosage}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Schedule</p>
                            <p className="font-medium text-slate-900">{program.frequency}</p>
                            <p className="text-sm text-slate-600">{program.duration || 'Ongoing'}</p>
                          </div>
                        </div>

                        {/* Next Dose & Refills */}
                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-slate-500">Next dose: </span>
                            <span className="font-medium text-slate-900">
                              {program.next_dose_date 
                                ? new Date(program.next_dose_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : 'As prescribed'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Refills: </span>
                            <span className="font-medium text-emerald-600">{program.refills_remaining || 0} left</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/patient/refill-checkin?prescription=${program.id}`}
                          className="px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors text-center whitespace-nowrap"
                        >
                          Health Check-in
                        </Link>
                        <Link
                          href={`/patient/consultations/${program.consultation_id}`}
                          className="px-4 py-3 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors text-center whitespace-nowrap"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Active Programs</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              You don't have any active treatment programs. Contact your provider to get started.
            </p>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Link 
            href="/patient/messages"
            className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-medium text-slate-900 mb-1">Messages</h3>
            <p className="text-sm text-slate-500">Chat with provider</p>
          </Link>

          <Link 
            href="/patient/orders"
            className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="font-medium text-slate-900 mb-1">Orders</h3>
            <p className="text-sm text-slate-500">Track deliveries</p>
          </Link>


          <Link 
            href="/patient/help"
            className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-slate-900 mb-1">Help</h3>
            <p className="text-sm text-slate-500">Get support</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
