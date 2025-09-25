'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import { apiClient } from '@/lib/api';

export default function CheckinReviewsPage() {
  const router = useRouter();
  const [checkinReviews, setCheckinReviews] = useState<any[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Check authentication and role
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    // Only providers and admins can access checkin reviews
    if (!['admin', 'provider-admin', 'super-admin', 'provider'].includes(role || '')) {
      router.push('/portal/dashboard');
      return;
    }

    loadCheckinReviews();
  }, [router]);

  useEffect(() => {
    filterReviews();
  }, [checkinReviews, filter, searchTerm]);

  const loadCheckinReviews = async () => {
    try {
      const { data } = await apiClient.checkinReviews.getAll();
      setCheckinReviews(data as any[]);
    } catch (err) {
      setError('Failed to load checkin reviews. Please try again.');
      console.error('Error loading checkin reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterReviews = () => {
    let filtered = checkinReviews;

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(review => review.status === filter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(review =>
        review.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.assignedProvider.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReviews(filtered);
  };

  const handleReviewUpdate = async (reviewId: string, newStatus: string) => {
    try {
      await apiClient.checkinReviews.update(reviewId, { status: newStatus });
      // Update local state
      setCheckinReviews(prev =>
        prev.map(review =>
          review.id === reviewId ? { ...review, status: newStatus } : review
        )
      );
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error updating review:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Patient Check-in Reviews</h1>
          <p className="text-gray-600 mt-2">Review and manage patient check-in submissions</p>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by patient name or provider..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Review</option>
                <option value="reviewed">Reviewed</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border border-red-200">
            <div className="text-red-600 text-sm">{error}</div>
          </Card>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500">
                {searchTerm || filter !== 'all'
                  ? 'No check-in reviews match your current filters.'
                  : 'No check-in reviews found.'
                }
              </div>
            </Card>
          ) : (
            filteredReviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {review.patientName}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(review.status)}`}>
                        {review.status.replace('-', ' ')}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(review.priority)}`}>
                        {review.priority} priority
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Check-in Date</p>
                        <p className="font-medium">{new Date(review.checkinDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <p className="font-medium capitalize">{review.type.replace('-', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Assigned Provider</p>
                        <p className="font-medium">{review.assignedProvider}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Reported Symptoms</p>
                      <div className="flex flex-wrap gap-2">
                        {review.symptoms.map((symptom: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => router.push(`/portal/checkin/${review.id}`)}
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      View Details
                    </button>
                    
                    {review.status === 'pending' && (
                      <button
                        onClick={() => handleReviewUpdate(review.id, 'reviewed')}
                        className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Mark Reviewed
                      </button>
                    )}
                    
                    {review.status === 'reviewed' && (
                      <button
                        onClick={() => handleReviewUpdate(review.id, 'completed')}
                        className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <Card className="p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {checkinReviews.length}
              </div>
              <div className="text-sm text-gray-500">Total Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {checkinReviews.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {checkinReviews.filter(r => r.status === 'reviewed').length}
              </div>
              <div className="text-sm text-gray-500">Reviewed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {checkinReviews.filter(r => r.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
