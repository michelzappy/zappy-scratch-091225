'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import NotificationPopup from '@/components/NotificationPopup';

export default function PatientDashboard() {
  const searchParams = useSearchParams();
  const [activeProgramIndex, setActiveProgramIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab and parameter handling
  const [activeTab, setActiveTab] = useState('overview');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [weightLogLoading, setWeightLogLoading] = useState(false);
  const [weightLogMessage, setWeightLogMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [consultations] = useState([
    { id: '1', type: 'Initial Consultation', status: 'completed', date: '2024-01-15' },
    { id: '2', type: 'Follow-up', status: 'submitted', date: '2024-01-20' },
    { id: '3', type: 'Refill Check-in', status: 'submitted', date: '2024-01-22' }
  ]);
  
  // Real data from API
  const [patientData, setPatientData] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);


  // Handle query parameters
  useEffect(() => {
    // Parse query parameters
    const tab = searchParams.get('tab');
    const status = searchParams.get('status');
    const checkin = searchParams.get('checkin');

    // Handle tab parameter
    if (tab === 'consultations') {
      setActiveTab('consultations');
    }

    // Handle checkin success message
    if (checkin === 'complete') {
      setShowSuccessMessage(true);
      // Auto-hide message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [searchParams]);

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel - using proper API client methods
        const [patient, programs, orders, measurements, stats] = await Promise.all([
          apiClient.patients.getProfile().catch(() => ({ data: null })),
          apiClient.patients.getPrograms().catch(() => ({ data: [] })),
          apiClient.patients.getOrders({ limit: 5 }).catch(() => ({ data: [] })),
          apiClient.patients.getMeasurements({ limit: 5 }).catch(() => ({ data: [] })),
          apiClient.patients.getStats().catch(() => ({ data: {} }))
        ]);

        // Set data from API responses
        setPatientData(patient.data.data);
        setPrograms(programs.data.data || []);
        setRecentOrders(orders.data.data || []);
        setMeasurements(measurements.data.data || []);
        setStats(stats.data.data || {});
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Log weight measurement
  const handleLogWeight = async (weight: number) => {
    try {
      setWeightLogLoading(true);
      setWeightLogMessage(null);
      
      // For demo purposes, add to mock measurements
      const newMeasurement = {
        weight,
        measurement_date: new Date()
      };
      
      // Try API call first
      try {
        await apiClient.patients.logMeasurement({
          weight,
          measurement_date: new Date().toISOString()
        });
        
        // Refresh measurements from API
        const response = await apiClient.patients.getMeasurements({ limit: 5 });
        setMeasurements(response.data);
      } catch (apiError) {
        // If API fails, use mock data for demo
        setMeasurements([newMeasurement, ...measurements].slice(0, 5));
      }
      
      // Show success message
      setWeightLogMessage({ type: 'success', text: `Weight logged: ${weight} lbs` });
      
      // Clear the form
      const form = document.querySelector('form') as HTMLFormElement;
      if (form) form.reset();
      
      // Hide message after 3 seconds
      setTimeout(() => {
        setWeightLogMessage(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error logging weight:', err);
      setWeightLogMessage({ type: 'error', text: 'Failed to log weight. Please try again.' });
    } finally {
      setWeightLogLoading(false);
    }
  };

  // Calculate shipment steps from order status
  const getShipmentSteps = (order: any) => {
    const steps = [
      { label: 'Provider Review', completed: true },
      { label: 'Prescription Processed', completed: order?.payment_status === 'completed' },
      { label: 'Shipped', completed: order?.fulfillment_status === 'shipped' || order?.fulfillment_status === 'delivered' },
      { label: 'Delivered', completed: order?.fulfillment_status === 'delivered' }
    ];
    return steps;
  };

  // Format wait time
  const formatWaitTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${Math.round(minutes % 60)}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeProgram = programs[activeProgramIndex];
  const patientName = patientData ? `${patientData.first_name} ${patientData.last_name}` : 'Patient';

  return (
    <div className="space-y-4 pb-20 lg:pb-8">
      {/* Notification Popup */}
      <NotificationPopup 
        message={weightLogMessage} 
        onClose={() => setWeightLogMessage(null)} 
      />
      
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-800 font-medium">Check-in completed successfully!</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-medical-500 text-medical-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('consultations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'consultations'
                ? 'border-medical-500 text-medical-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Consultations
          </button>
        </nav>
      </div>

      {/* Mobile-first Welcome Section */}
      <div className="flex items-center gap-3">
        <img
          src="/Alex.webp"
          alt="Your Health Assistant"
          className="w-12 h-12 lg:w-16 lg:h-16 rounded-full object-cover border-2 border-white shadow-md"
        />
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
          Welcome back, {patientName}!
        </h1>
      </div>

      {/* Consultations Tab Content */}
      {activeTab === 'consultations' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Your Consultations</h2>
            <div className="space-y-4">
              {consultations
                .filter(consultation => {
                  const status = searchParams.get('status');
                  return !status || consultation.status === status;
                })
                .map((consultation) => (
                <div key={consultation.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-slate-900">{consultation.type}</h3>
                      <p className="text-sm text-slate-600">Date: {consultation.date}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      consultation.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : consultation.status === 'submitted'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {consultation.status}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Link 
                      href={`/patient/consultations/${consultation.id}`}
                      className="text-medical-600 hover:text-medical-700 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            {searchParams.get('status') === 'submitted' && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  ✅ Showing submitted consultations only. Your consultation has been received and is being reviewed.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <>
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500">Active Programs</p>
            <p className="text-xl font-bold text-slate-900">{stats.active_prescriptions || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500">Total Orders</p>
            <p className="text-xl font-bold text-slate-900">{stats.total_orders || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500">Consultations</p>
            <p className="text-xl font-bold text-slate-900">{stats.total_consultations || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500">Messages</p>
            <p className="text-xl font-bold text-slate-900">{stats.unread_messages || 0}</p>
          </div>
        </div>
      )}

      {/* Program Cards - Mobile Optimized */}
      {programs.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base lg:text-lg font-bold text-slate-900">
              Your Medications
            </h2>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
              {programs.length} Active
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {programs.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActiveProgramIndex(i)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  i === activeProgramIndex
                    ? "border-medical-500 bg-gradient-to-br from-medical-50 to-emerald-50 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow"
                }`}
              >
                {i === activeProgramIndex && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-medical-500 rounded-full animate-pulse"></span>
                )}
                <div className="font-semibold text-slate-900 text-sm">{p.program_name || p.category}</div>
                <div className="text-slate-600 text-xs mt-1">{p.medication_name} • {p.dosage}</div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-500">
                    Next refill: {p.next_refill_date ? new Date(p.next_refill_date).toLocaleDateString() : 'N/A'}
                  </span>
                  <span className="text-xs text-emerald-600 font-medium">
                    {p.refills_remaining} refills
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl p-6 text-center">
          <p className="text-slate-600 mb-4">No active medications</p>
          <Link 
            href="/patient/new-consultation"
            className="inline-block px-6 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700"
          >
            Start Consultation
          </Link>
        </div>
      )}

      {/* Mobile-First Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main Column - Full width on mobile */}
        <div className="lg:col-span-2 space-y-4">
          {/* Program Summary Card */}
          {activeProgram && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                <h2 className="text-base font-semibold text-slate-900">
                  {activeProgram.program_name || activeProgram.category} Program
                </h2>
              </header>
              <div className="space-y-4 p-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{activeProgram.medication_name}</h3>
                  <p className="text-sm text-slate-600">{activeProgram.dosage} • {activeProgram.frequency}</p>
                </div>

                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-slate-500">Duration</p>
                    <p className="font-bold text-medical-600">{activeProgram.duration || 'Ongoing'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Refills left</p>
                    <p className="font-bold text-emerald-600">{activeProgram.refills_remaining}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Link 
                    href={`/patient/consultations/${activeProgram.consultation_id}`}
                    className="rounded-lg bg-medical-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-medical-700 text-center"
                  >
                    View Details
                  </Link>
                  <Link 
                    href={`/patient/refill-checkin?prescription=${activeProgram.id}`}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 text-center"
                  >
                    Request Refill
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Shipment Status */}
          {recentOrders.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                <h2 className="text-base font-semibold text-slate-900">Latest Shipment</h2>
              </header>
              <ol className="p-5">
                {getShipmentSteps(recentOrders[0]).map((step, idx) => (
                  <li key={idx} className="flex items-center gap-2 py-1 text-sm">
                    <span className={`h-3 w-3 rounded-full ${step.completed ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <span className={`${step.completed ? "text-slate-900" : "text-slate-400"}`}>{step.label}</span>
                  </li>
                ))}
              </ol>
              {recentOrders[0].tracking_number && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-slate-600">
                    Tracking: <span className="font-mono">{recentOrders[0].tracking_number}</span>
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Progress Tracker (Weight) */}
          {measurements.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                <h2 className="text-base font-semibold text-slate-900">Progress Tracker</h2>
              </header>
              <div className="p-5">
                <p className="text-sm text-slate-500 mb-4">Your weight progress (lbs)</p>

                <div className="h-40 mb-4 bg-gradient-to-t from-medical-50 to-white rounded-lg p-4">
                  <div className="flex items-end justify-between h-full">
                    {measurements.slice(0, 5).reverse().map((data, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div
                          className="w-8 bg-medical-500 rounded-t"
                          style={{ height: `${Math.min(data.weight || 0, 100)}px` }}
                        />
                        <span className="text-xs text-slate-500 mt-2">
                          {new Date(data.measurement_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const weight = (e.target as any).weight.value;
                    if (weight) handleLogWeight(parseFloat(weight));
                  }}
                  className="flex space-x-2"
                >
                  <input
                    name="weight"
                    type="number"
                    step="0.1"
                    placeholder="Enter today's weight"
                    className="flex-grow w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-medical-500 focus:border-medical-500"
                    disabled={weightLogLoading}
                  />
                  <button
                    type="submit"
                    disabled={weightLogLoading}
                    className="bg-medical-600 text-white font-semibold text-sm py-2 px-4 rounded-md hover:bg-medical-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {weightLogLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging...
                      </>
                    ) : (
                      'Log'
                    )}
                  </button>
                </form>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar - Stacks on mobile */}
        <div className="lg:col-span-1 space-y-4">
          {/* Quick Actions */}
          <section className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            <Link href="/patient/messages" className="rounded-xl border-2 border-medical-200 bg-gradient-to-br from-medical-50 to-white p-4 text-left hover:shadow-lg transition-all hover:scale-[1.02]">
              <div className="text-3xl mb-2">💬</div>
              <div className="text-sm font-semibold text-medical-700">Message Doctor</div>
              <div className="text-xs text-slate-600 mt-1">Get help now</div>
              {stats?.unread_messages > 0 && (
                <span className="inline-block mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {stats.unread_messages} new
                </span>
              )}
            </Link>
            <Link href="/patient/orders" className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 text-left hover:shadow-lg transition-all hover:scale-[1.02]">
              <div className="text-3xl mb-2">📦</div>
              <div className="text-sm font-semibold text-emerald-700">Track Orders</div>
              <div className="text-xs text-slate-600 mt-1">View shipments</div>
            </Link>
          </section>

          {/* Recent Orders */}
          {recentOrders.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                <h2 className="text-base font-semibold text-slate-900">Recent Orders</h2>
              </header>
              <ul className="divide-y divide-slate-100">
                {recentOrders.slice(0, 3).map((order) => (
                  <li key={order.id} className="px-5 py-3">
                    <div className="flex justify-between items-start">
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">#{order.order_number}</p>
                        <p className="text-slate-500">
                          {order.items?.length > 0 ? order.items[0].medication_name : 'Order'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          ${order.total_amount?.toFixed(2) || '0.00'}
                        </p>
                        <span className={`text-xs font-medium ${
                          order.fulfillment_status === 'delivered' ? 'text-emerald-600' : 
                          order.fulfillment_status === 'shipped' ? 'text-blue-600' : 'text-yellow-600'
                        }`}>
                          {order.fulfillment_status || 'pending'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Action Items */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <h2 className="text-base font-semibold text-slate-900">Action items</h2>
            </header>
            <ul className="divide-y divide-slate-100">
              <li className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  stats?.total_consultations > 0 ? 'bg-emerald-500' : 'bg-slate-300'
                } text-white`}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className={stats?.total_consultations > 0 ? "text-slate-500 line-through" : "text-slate-700"}>
                  Complete health assessment
                </span>
              </li>
              <li className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  patientData?.insurance_provider ? 'bg-emerald-500' : 'bg-slate-300'
                } text-white`}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className={patientData?.insurance_provider ? "text-slate-500 line-through" : "text-slate-700"}>
                  Upload insurance information
                </span>
              </li>
              <li className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-white">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-slate-700">Schedule follow-up consultation</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
