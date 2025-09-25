'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import { apiClient } from '@/lib/api';

export default function NewOrderPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    patientId: '',
    orderType: 'medication',
    urgency: 'routine',
    medicationName: '',
    dosage: '',
    quantity: '',
    instructions: '',
    pharmacyId: '',
    notes: '',
    diagnosis: '',
    icdCode: ''
  });
  
  const [patients, setPatients] = useState<any[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check authentication and role
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    // Only providers and admins can create orders
    if (!['admin', 'provider-admin', 'super-admin', 'provider'].includes(role || '')) {
      router.push('/portal/dashboard');
      return;
    }

    // Load patients and pharmacies
    loadPatients();
    loadPharmacies();
  }, [router]);

  const loadPatients = async () => {
    try {
      const { data } = await apiClient.patients.getAll();
      setPatients(data as any[]);
    } catch (err) {
      console.error('Failed to load patients:', err);
      // Fallback mock data for demo
      setPatients([
        { id: '1', firstName: 'John', lastName: 'Smith' },
        { id: '2', firstName: 'Jane', lastName: 'Doe' },
        { id: '3', firstName: 'Robert', lastName: 'Johnson' }
      ]);
    }
  };

  const loadPharmacies = async () => {
    try {
      const { data } = await apiClient.pharmacies.getAll();
      setPharmacies(data as any[]);
    } catch (err) {
      console.error('Failed to load pharmacies:', err);
      // Mock data for demo
      setPharmacies([
        { id: '1', name: 'CVS Pharmacy', address: '123 Main St' },
        { id: '2', name: 'Walgreens', address: '456 Oak Ave' },
        { id: '3', name: 'Rite Aid', address: '789 Pine Rd' }
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiClient.orders.create(formData);
      setSuccess(true);
      setTimeout(() => {
        router.push('/portal/orders');
      }, 2000);
    } catch (err: any) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Created Successfully!</h3>
          <p className="text-gray-600">Redirecting to orders list...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Order</h1>
          <p className="text-gray-600 mt-2">Create medication orders and prescriptions for patients</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Patient *</label>
                <select
                  name="patientId"
                  required
                  value={formData.patientId}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Patient</option>
                  {patients.map((patient: any) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Order Type *</label>
                <select
                  name="orderType"
                  required
                  value={formData.orderType}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="medication">Medication</option>
                  <option value="lab">Laboratory Test</option>
                  <option value="imaging">Imaging Study</option>
                  <option value="referral">Specialist Referral</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Urgency *</label>
                <select
                  name="urgency"
                  required
                  value={formData.urgency}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="stat">STAT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Diagnosis *</label>
                <input
                  type="text"
                  name="diagnosis"
                  required
                  value={formData.diagnosis}
                  onChange={handleChange}
                  placeholder="Primary diagnosis"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </Card>

          {formData.orderType === 'medication' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Medication Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medication Name *</label>
                  <input
                    type="text"
                    name="medicationName"
                    required
                    value={formData.medicationName}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Dosage *</label>
                  <input
                    type="text"
                    name="dosage"
                    required
                    value={formData.dosage}
                    onChange={handleChange}
                    placeholder="e.g., 10mg"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity *</label>
                  <input
                    type="text"
                    name="quantity"
                    required
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="e.g., 30 tablets"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Pharmacy</label>
                  <select
                    name="pharmacyId"
                    value={formData.pharmacyId}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Pharmacy</option>
                    {pharmacies.map((pharmacy: any) => (
                      <option key={pharmacy.id} value={pharmacy.id}>
                        {pharmacy.name} - {pharmacy.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Instructions *</label>
                  <textarea
                    name="instructions"
                    required
                    rows={3}
                    value={formData.instructions}
                    onChange={handleChange}
                    placeholder="e.g., Take once daily with food"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Notes</h2>
            <textarea
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes or special instructions"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </Card>

          {error && (
            <Card className="p-4 bg-red-50 border border-red-200">
              <div className="text-red-600 text-sm">{error}</div>
            </Card>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating Order...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
