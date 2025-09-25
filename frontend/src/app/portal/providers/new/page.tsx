'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import { apiClient } from '@/lib/api';

export default function NewProviderPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    
    // Professional Information
    licenseNumber: '',
    licenseState: '',
    licenseExpirationDate: '',
    specialty: '',
    subSpecialty: '',
    boardCertifications: '',
    
    // Credentials
    medicalSchool: '',
    residencyProgram: '',
    fellowshipProgram: '',
    yearsOfExperience: '',
    
    // Practice Information
    npiNumber: '',
    deaNumber: '',
    practiceType: '',
    hospitalAffiliations: '',
    
    // Address Information
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    
    // System Access
    roleType: 'provider',
    accessLevel: 'standard',
    
    // Additional Information
    languages: '',
    bio: '',
    specialInterests: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check authentication and role
    const token = localStorage.getItem('token');
    let role = localStorage.getItem('userRole');
    
    console.log('New Provider Page - Role Check:', { token: !!token, role });
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    // Fallback for development - if no role is set, assume admin
    if (!role) {
      console.log('No role found in localStorage, setting default admin role for development');
      role = 'admin';
      localStorage.setItem('userRole', role);
    }
    
    // Only admins, provider-admins, and super-admins can add providers
    if (role !== 'admin' && role !== 'provider-admin' && role !== 'super-admin') {
      console.log('Access denied, redirecting to dashboard. Role:', role);
      router.push('/portal/dashboard');
      return;
    }
    
    console.log('Access granted for role:', role);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create provider via centralized API client
      const { data: newProvider } = await apiClient.providers.create(formData);
      if (newProvider) {
        setSuccess(true);
        
        // Redirect to providers list after short delay
        setTimeout(() => {
          router.push('/portal/providers');
        }, 2000);
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Provider creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Provider Added Successfully!</h3>
          <p className="text-gray-600">Redirecting to providers list...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Providers
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Add New Healthcare Provider</h1>
          <p className="text-gray-600 mt-2">Create a comprehensive provider profile with credentials and licensing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* Professional Licensing */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Professional Licensing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Medical License Number *</label>
                <input
                  type="text"
                  name="licenseNumber"
                  required
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">License State *</label>
                <select
                  name="licenseState"
                  required
                  value={formData.licenseState}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select State</option>
                  <option value="CA">California</option>
                  <option value="NY">New York</option>
                  <option value="TX">Texas</option>
                  <option value="FL">Florida</option>
                  <option value="IL">Illinois</option>
                  <option value="PA">Pennsylvania</option>
                  <option value="OH">Ohio</option>
                  <option value="GA">Georgia</option>
                  <option value="NC">North Carolina</option>
                  <option value="MI">Michigan</option>
                  {/* Add more states as needed */}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">License Expiration Date *</label>
                <input
                  type="date"
                  name="licenseExpirationDate"
                  required
                  value={formData.licenseExpirationDate}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Primary Specialty *</label>
                <select
                  name="specialty"
                  required
                  value={formData.specialty}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Specialty</option>
                  <option value="Family Medicine">Family Medicine</option>
                  <option value="Internal Medicine">Internal Medicine</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="Gastroenterology">Gastroenterology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Psychiatry">Psychiatry</option>
                  <option value="Pulmonology">Pulmonology</option>
                  <option value="Rheumatology">Rheumatology</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Sub-specialty</label>
                <input
                  type="text"
                  name="subSpecialty"
                  value={formData.subSpecialty}
                  onChange={handleChange}
                  placeholder="e.g., Interventional Cardiology"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Board Certifications</label>
                <input
                  type="text"
                  name="boardCertifications"
                  value={formData.boardCertifications}
                  onChange={handleChange}
                  placeholder="e.g., ABIM, ABFM"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* Education & Experience */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Education & Experience</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Medical School</label>
                <input
                  type="text"
                  name="medicalSchool"
                  value={formData.medicalSchool}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Residency Program</label>
                <input
                  type="text"
                  name="residencyProgram"
                  value={formData.residencyProgram}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fellowship Program</label>
                <input
                  type="text"
                  name="fellowshipProgram"
                  value={formData.fellowshipProgram}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Years of Experience *</label>
                <select
                  name="yearsOfExperience"
                  required
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Experience Level</option>
                  <option value="0-2">0-2 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="6-10">6-10 years</option>
                  <option value="11-15">11-15 years</option>
                  <option value="16-20">16-20 years</option>
                  <option value="20+">20+ years</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Practice Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Practice Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">NPI Number *</label>
                <input
                  type="text"
                  name="npiNumber"
                  required
                  value={formData.npiNumber}
                  onChange={handleChange}
                  placeholder="10-digit NPI number"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">DEA Number</label>
                <input
                  type="text"
                  name="deaNumber"
                  value={formData.deaNumber}
                  onChange={handleChange}
                  placeholder="DEA registration number"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Practice Type *</label>
                <select
                  name="practiceType"
                  required
                  value={formData.practiceType}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Practice Type</option>
                  <option value="Private Practice">Private Practice</option>
                  <option value="Hospital Employed">Hospital Employed</option>
                  <option value="Academic Medical Center">Academic Medical Center</option>
                  <option value="Telehealth">Telehealth</option>
                  <option value="Urgent Care">Urgent Care</option>
                  <option value="Clinic">Clinic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Hospital Affiliations</label>
                <input
                  type="text"
                  name="hospitalAffiliations"
                  value={formData.hospitalAffiliations}
                  onChange={handleChange}
                  placeholder="e.g., Memorial Hospital, St. Mary's"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* Address Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Address Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Street Address</label>
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* System Access */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">System Access & Permissions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role Type *</label>
                <select
                  name="roleType"
                  required
                  value={formData.roleType}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="provider">Provider</option>
                  <option value="provider-admin">Provider Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Access Level *</label>
                <select
                  name="accessLevel"
                  required
                  value={formData.accessLevel}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="standard">Standard Access</option>
                  <option value="full">Full Access</option>
                  <option value="limited">Limited Access</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Additional Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Languages Spoken</label>
                <input
                  type="text"
                  name="languages"
                  value={formData.languages}
                  onChange={handleChange}
                  placeholder="e.g., English, Spanish, French"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Professional Bio</label>
                <textarea
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Brief professional biography for patient-facing content"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Special Interests</label>
                <textarea
                  name="specialInterests"
                  rows={3}
                  value={formData.specialInterests}
                  onChange={handleChange}
                  placeholder="Areas of special interest or expertise"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </Card>

          {error && (
            <Card className="p-4 bg-red-50 border border-red-200">
              <div className="text-red-600 text-sm">{error}</div>
            </Card>
          )}

          {/* Submit Buttons */}
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
              {loading ? 'Adding Provider...' : 'Add Provider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
