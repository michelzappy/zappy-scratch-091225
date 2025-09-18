'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import NotificationPopup from '@/components/NotificationPopup';

interface Provider {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  department: string;
  licenseNumber: string;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  availability: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  credentials: {
    degree: string;
    boardCertifications: string[];
    yearsOfExperience: number;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export default function EditProviderPage() {
  const router = useRouter();
  const params = useParams();
  const providerId = params.id as string;
  
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchProvider();
  }, [providerId]);

  const fetchProvider = async () => {
    // Mock data - in production, fetch from API
    const mockProvider: Provider = {
      id: providerId,
      name: 'Dr. Sarah Smith',
      email: 'dr.smith@clinic.com',
      phone: '+1 (555) 123-4567',
      specialty: 'General Medicine',
      department: 'Internal Medicine',
      licenseNumber: 'MD123456789',
      status: 'active',
      joinDate: '2020-03-15',
      availability: {
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        wednesday: '9:00 AM - 5:00 PM',
        thursday: '9:00 AM - 5:00 PM',
        friday: '9:00 AM - 3:00 PM',
        saturday: 'Unavailable',
        sunday: 'Unavailable'
      },
      credentials: {
        degree: 'MD - Johns Hopkins University',
        boardCertifications: ['Internal Medicine', 'Family Medicine'],
        yearsOfExperience: 8
      },
      address: {
        street: '123 Medical Plaza, Suite 200',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      },
      emergencyContact: {
        name: 'John Smith',
        relationship: 'Spouse',
        phone: '+1 (555) 987-6543'
      }
    };

    setProvider(mockProvider);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!provider) return;
    
    setSaving(true);
    
    try {
      // Mock save - in production, send to API
      console.log('Saving provider:', provider);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
  // Passive success message
  setToast({ type: 'success', text: 'Provider information updated.' });
      
      // Redirect back to provider details
      router.push(`/portal/provider/${providerId}`);
    } catch (error) {
  console.error('Error saving provider:', error);
  setToast({ type: 'error', text: 'Failed to save provider. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const updateProvider = (updates: Partial<Provider>) => {
    setProvider(prev => prev ? { ...prev, ...updates } : null);
  };

  const updateNestedField = (path: string[], value: any) => {
    setProvider(prev => {
      if (!prev) return null;
      
      const newProvider = { ...prev };
      let current: any = newProvider;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return newProvider;
    });
  };

  const addCertification = (certification: string) => {
    if (!certification.trim()) return;
    
    setProvider(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        credentials: {
          ...prev.credentials,
          boardCertifications: [...prev.credentials.boardCertifications, certification]
        }
      };
    });
  };

  const removeCertification = (index: number) => {
    setProvider(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        credentials: {
          ...prev.credentials,
          boardCertifications: prev.credentials.boardCertifications.filter((_, i) => i !== index)
        }
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading provider information...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Provider not found</p>
          <Link href="/portal/providers" className="mt-4 inline-block text-purple-600 hover:text-purple-700">
            ← Back to Providers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/portal/provider/${providerId}`}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Provider Details
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Edit Provider: {provider.name}</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href={`/portal/provider/${providerId}`}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </Link>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'basic', label: 'Basic Information' },
              { key: 'credentials', label: 'Credentials' },
              { key: 'schedule', label: 'Schedule' },
              { key: 'contact', label: 'Contact Information' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          
          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={provider.name}
                    onChange={(e) => updateProvider({ name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={provider.email}
                    onChange={(e) => updateProvider({ email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={provider.phone}
                    onChange={(e) => updateProvider({ phone: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialty *
                  </label>
                  <select
                    value={provider.specialty}
                    onChange={(e) => updateProvider({ specialty: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select Specialty</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Mental Health">Mental Health</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Weight Management">Weight Management</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={provider.department}
                    onChange={(e) => updateProvider({ department: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Number *
                  </label>
                  <input
                    type="text"
                    value={provider.licenseNumber}
                    onChange={(e) => updateProvider({ licenseNumber: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={provider.status}
                    onChange={(e) => updateProvider({ status: e.target.value as 'active' | 'inactive' | 'pending' })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Join Date
                  </label>
                  <input
                    type="date"
                    value={provider.joinDate}
                    onChange={(e) => updateProvider({ joinDate: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Credentials Tab */}
          {activeTab === 'credentials' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Credentials & Qualifications</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Degree
                  </label>
                  <input
                    type="text"
                    value={provider.credentials.degree}
                    onChange={(e) => updateNestedField(['credentials', 'degree'], e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., MD - Johns Hopkins University"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    value={provider.credentials.yearsOfExperience}
                    onChange={(e) => updateNestedField(['credentials', 'yearsOfExperience'], parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Board Certifications</h3>
                  <div className="space-y-3">
                    {provider.credentials.boardCertifications.map((certification, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input
                          type="text"
                          value={certification}
                          onChange={(e) => {
                            const newCertifications = [...provider.credentials.boardCertifications];
                            newCertifications[index] = e.target.value;
                            updateNestedField(['credentials', 'boardCertifications'], newCertifications);
                          }}
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <button
                          onClick={() => removeCertification(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addCertification('')}
                      className="text-purple-600 hover:text-purple-700 text-sm"
                    >
                      + Add Certification
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
              
              <div className="space-y-4">
                {Object.entries(provider.availability).map(([day, hours]) => (
                  <div key={day} className="flex items-center space-x-4">
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700 capitalize">
                        {day}
                      </label>
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={hours}
                        onChange={(e) => updateNestedField(['availability', day], e.target.value)}
                        placeholder="e.g., 9:00 AM - 5:00 PM or Unavailable"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Schedule Format Examples:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Regular hours: "9:00 AM - 5:00 PM"</li>
                  <li>• Half day: "9:00 AM - 1:00 PM"</li>
                  <li>• Split schedule: "9:00 AM - 12:00 PM, 2:00 PM - 6:00 PM"</li>
                  <li>• Not available: "Unavailable"</li>
                </ul>
              </div>
            </div>
          )}

          {/* Contact Information Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Work Address</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={provider.address.street}
                        onChange={(e) => updateNestedField(['address', 'street'], e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={provider.address.city}
                          onChange={(e) => updateNestedField(['address', 'city'], e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          value={provider.address.state}
                          onChange={(e) => updateNestedField(['address', 'state'], e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          value={provider.address.zipCode}
                          onChange={(e) => updateNestedField(['address', 'zipCode'], e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        value={provider.emergencyContact.name}
                        onChange={(e) => updateNestedField(['emergencyContact', 'name'], e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relationship
                      </label>
                      <input
                        type="text"
                        value={provider.emergencyContact.relationship}
                        onChange={(e) => updateNestedField(['emergencyContact', 'relationship'], e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={provider.emergencyContact.phone}
                        onChange={(e) => updateNestedField(['emergencyContact', 'phone'], e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button (repeated at bottom for convenience) */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href={`/portal/provider/${providerId}`}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </Link>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
      <NotificationPopup message={toast} onClose={() => setToast(null)} />
    </div>
  );
}