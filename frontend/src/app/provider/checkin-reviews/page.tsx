'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function ProviderCheckInReviews() {
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [selectedCheckIn, setSelectedCheckIn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchCheckIns();
  }, [filter]);

  const fetchCheckIns = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/refill-checkins?status=${filter}`);
      setCheckIns(response.data || []);
    } catch (error) {
      console.error('Error fetching check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (checkInId: string, requiresConsultation: boolean = false) => {
    setApproving(true);
    try {
      await api.post(`/refill-checkins/${checkInId}/review`, {
        status: requiresConsultation ? 'requires_consultation' : 'approved',
        provider_notes: selectedCheckIn?.providerNotes || '',
        refill_approved: !requiresConsultation
      });
      
      // Refresh list
      await fetchCheckIns();
      setSelectedCheckIn(null);
    } catch (error) {
      console.error('Error approving check-in:', error);
    } finally {
      setApproving(false);
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'text-red-600 font-bold';
    if (severity >= 5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      'pending_review': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'requires_consultation': 'bg-red-100 text-red-800',
      'expired': 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Refill Check-in Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">Review patient check-ins for prescription refills</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {checkIns.filter(c => c.status === 'pending_review').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Awaiting provider review</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">With Red Flags</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {checkIns.filter(c => c.has_red_flags).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Require immediate attention</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Approved Today</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {checkIns.filter(c => c.status === 'approved' && 
              new Date(c.reviewed_at).toDateString() === new Date().toDateString()
            ).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Refills authorized</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Avg Review Time</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">4.2 min</p>
          <p className="text-xs text-gray-500 mt-1">Per check-in</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {['pending', 'red_flags', 'all', 'approved', 'consultation_required'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              filter === f
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check-ins List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Check-ins Queue</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : checkIns.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No check-ins to review</div>
              ) : (
                checkIns.map((checkIn) => (
                  <button
                    key={checkIn.id}
                    onClick={() => setSelectedCheckIn(checkIn)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                      selectedCheckIn?.id === checkIn.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">
                            {checkIn.patient_name}
                          </p>
                          {checkIn.has_red_flags && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Red Flag
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {checkIn.medication_name} • {checkIn.dosage}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Submitted {new Date(checkIn.submitted_at).toLocaleString()}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(checkIn.status)}`}>
                            {checkIn.status.replace('_', ' ')}
                          </span>
                          {checkIn.effectiveness && (
                            <span className="text-xs text-gray-600">
                              Effectiveness: {checkIn.effectiveness}/10
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Check-in Details */}
        <div className="lg:col-span-2">
          {selectedCheckIn ? (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Check-in Review
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Patient: {selectedCheckIn.patient_name} | 
                      Medication: {selectedCheckIn.medication_name}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedCheckIn.status)}`}>
                    {selectedCheckIn.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Red Flags Alert */}
                {selectedCheckIn.has_red_flags && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-red-900 mb-2">
                      ⚠️ Red Flags Detected
                    </h3>
                    <ul className="space-y-1">
                      {selectedCheckIn.red_flags?.map((flag: string, i: number) => (
                        <li key={i} className="text-sm text-red-700">
                          • {flag.replace('_', ' ')}
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-red-600 font-medium mt-3">
                      Consider scheduling a video consultation
                    </p>
                  </div>
                )}

                {/* Compliance */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Medication Compliance</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded p-3">
                    {selectedCheckIn.responses?.taking_as_prescribed || 'Not specified'}
                  </p>
                </div>

                {/* Side Effects */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Side Effects Reported</h3>
                  {selectedCheckIn.side_effects?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCheckIn.side_effects.map((se: any, i: number) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 rounded p-2">
                          <span className="text-sm text-gray-700">{se.effect}</span>
                          <span className={`text-sm font-medium ${getSeverityColor(se.severity)}`}>
                            Severity: {se.severity}/10
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No side effects reported</p>
                  )}
                </div>

                {/* Effectiveness */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Treatment Effectiveness</h3>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Patient Rating:</span>
                      <span className="text-2xl font-bold text-medical-600">
                        {selectedCheckIn.responses?.effectiveness || 0}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-medical-600 h-2 rounded-full"
                        style={{ width: `${(selectedCheckIn.responses?.effectiveness || 0) * 10}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Continue Treatment */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Patient Preference</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded p-3">
                    {selectedCheckIn.responses?.continue_treatment || 'Not specified'}
                  </p>
                </div>

                {/* Health Changes */}
                {selectedCheckIn.responses?.health_changes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Health Changes</h3>
                    <p className="text-sm text-gray-900 bg-gray-50 rounded p-3">
                      {selectedCheckIn.responses.health_changes}
                    </p>
                  </div>
                )}

                {/* Provider Questions */}
                {selectedCheckIn.responses?.provider_questions && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Questions for Provider</h3>
                    <p className="text-sm text-gray-900 bg-blue-50 rounded p-3">
                      {selectedCheckIn.responses.provider_questions}
                    </p>
                  </div>
                )}

                {/* Provider Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider Notes (Optional)
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500"
                    rows={3}
                    placeholder="Add any notes about this check-in..."
                    value={selectedCheckIn.providerNotes || ''}
                    onChange={(e) => setSelectedCheckIn({
                      ...selectedCheckIn,
                      providerNotes: e.target.value
                    })}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleApprove(selectedCheckIn.id, false)}
                    disabled={approving || selectedCheckIn.status !== 'pending_review'}
                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {approving ? 'Processing...' : 'Approve Refill'}
                  </button>
                  <button
                    onClick={() => handleApprove(selectedCheckIn.id, true)}
                    disabled={approving || selectedCheckIn.status !== 'pending_review'}
                    className="flex-1 py-2 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Request Consultation
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <button className="text-sm py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                    View Full History
                  </button>
                  <button className="text-sm py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Send Message
                  </button>
                  <button className="text-sm py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Order Labs
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No check-in selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select a check-in from the queue to review details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {checkIns.filter(c => c.status === 'pending_review' && !c.has_red_flags).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                {checkIns.filter(c => c.status === 'pending_review' && !c.has_red_flags).length} check-ins eligible for bulk approval
              </p>
              <p className="text-xs text-blue-700 mt-1">
                These check-ins have no red flags and meet auto-approval criteria
              </p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Bulk Approve
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
