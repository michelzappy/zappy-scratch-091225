'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Consultation {
  id: string;
  quizData?: any;
  status: string;
  createdAt: string;
  providerId?: string;
  urgency?: string;
}

interface Treatment {
  id: string;
  name: string;
  medication: string;
  nextDelivery: string;
  status: string;
  price: string;
}

export default function PatientDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Load consultations
    const saved = localStorage.getItem('consultations');
    if (saved) {
      setConsultations(JSON.parse(saved));
    }

    // Check if just submitted
    if (searchParams.get('status') === 'submitted') {
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 5000);
    }

    // Mock treatments
    setTreatments([
      {
        id: '1',
        name: 'Hair Loss Treatment',
        medication: 'Finasteride 1mg',
        nextDelivery: 'Dec 25, 2024',
        status: 'active',
        price: '$22/month'
      },
      {
        id: '2',
        name: 'Skin Care',
        medication: 'Tretinoin 0.025%',
        nextDelivery: 'Dec 28, 2024',
        status: 'active',
        price: '$45/month'
      }
    ]);
  }, [searchParams]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyBadge = (urgency?: string) => {
    if (!urgency) return null;
    const colors = {
      regular: 'bg-gray-100 text-gray-700',
      urgent: 'bg-orange-100 text-orange-700',
      emergency: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[urgency as keyof typeof colors]}`}>
        {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-purple-600">
              TeleHealth
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/patient/profile" className="text-gray-700 hover:text-gray-900">
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Banner */}
      {showWelcome && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="container mx-auto px-4 py-4">
            <p className="text-green-800 font-medium">
              ✅ Your consultation has been submitted! A provider will review it within 24 hours.
            </p>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600 mt-2">Manage your health journey in one place</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/patient/health-quiz" 
            className="bg-purple-600 text-white rounded-xl p-6 hover:bg-purple-700 transition-all hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Start New Consultation</h3>
                <p className="text-purple-100 text-sm mt-1">Get treatment for a new condition</p>
              </div>
              <svg className="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </Link>

          <Link href="/patient/subscription" 
            className="bg-white border-2 border-purple-600 text-purple-600 rounded-xl p-6 hover:bg-purple-50 transition-all hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Manage Subscriptions</h3>
                <p className="text-gray-600 text-sm mt-1">View and manage your plans</p>
              </div>
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </Link>

          <Link href="/patient/messages" 
            className="bg-white border-2 border-gray-300 text-gray-700 rounded-xl p-6 hover:border-gray-400 transition-all hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Messages</h3>
                <p className="text-gray-600 text-sm mt-1">Chat with your provider</p>
              </div>
              <div className="relative">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  2
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b">
            <div className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'treatments', label: 'Active Treatments' },
                { id: 'consultations', label: 'Consultations' },
                { id: 'prescriptions', label: 'Prescriptions' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-purple-900">Active Treatments</h4>
                    <p className="text-2xl font-bold text-purple-900 mt-1">2</p>
                    <p className="text-xs text-purple-700 mt-1">All delivered on time</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900">Consultations</h4>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{consultations.length}</p>
                    <p className="text-xs text-blue-700 mt-1">1 pending review</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-900">Next Delivery</h4>
                    <p className="text-2xl font-bold text-green-900 mt-1">Dec 25</p>
                    <p className="text-xs text-green-700 mt-1">In 5 days</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {consultations.slice(0, 3).map(consultation => (
                      <div key={consultation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Consultation Request</p>
                            <p className="text-sm text-gray-600">
                              {new Date(consultation.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getUrgencyBadge(consultation.urgency)}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                            {consultation.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Treatments Tab */}
            {activeTab === 'treatments' && (
              <div className="space-y-4">
                {treatments.map(treatment => (
                  <div key={treatment.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{treatment.name}</h3>
                        <p className="text-gray-600 mt-1">{treatment.medication}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-sm text-gray-600">
                            Next delivery: <span className="font-medium text-gray-900">{treatment.nextDelivery}</span>
                          </span>
                          <span className="text-sm text-purple-600 font-medium">
                            {treatment.price}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(treatment.status)}`}>
                          {treatment.status}
                        </span>
                        <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                          Manage →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {treatments.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-gray-600 mb-4">No active treatments</p>
                    <Link href="/patient/health-quiz" className="text-purple-600 hover:text-purple-700 font-medium">
                      Start a consultation →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Consultations Tab */}
            {activeTab === 'consultations' && (
              <div className="space-y-4">
                {consultations.map(consultation => (
                  <div key={consultation.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Consultation #{consultation.id.slice(-6)}
                        </h3>
                        <p className="text-gray-600 mt-1">
                          Submitted on {new Date(consultation.createdAt).toLocaleDateString()}
                        </p>
                        {consultation.quizData && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
                              {consultation.quizData.condition}
                            </span>
                            {consultation.quizData.symptoms?.slice(0, 2).map((symptom: string, i: number) => (
                              <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                {symptom}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getUrgencyBadge(consultation.urgency)}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                          {consultation.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {consultations.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600 mb-4">No consultations yet</p>
                    <Link href="/patient/health-quiz" className="text-purple-600 hover:text-purple-700 font-medium">
                      Start your first consultation →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Prescriptions Tab */}
            {activeTab === 'prescriptions' && (
              <div className="space-y-4">
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-600 mb-4">No prescriptions yet</p>
                  <p className="text-sm text-gray-500">Your prescriptions will appear here after provider review</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
