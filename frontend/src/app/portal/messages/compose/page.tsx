'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';

interface Recipient {
  id: string;
  name: string;
  email: string;
  type: 'patient' | 'provider' | 'admin';
  avatar?: string;
}

export default function ComposeMessagePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    recipients: [] as string[],
    subject: '',
    body: '',
    priority: 'normal',
    messageType: 'general'
  });
  
  const [recipientSearch, setRecipientSearch] = useState('');
  const [availableRecipients, setAvailableRecipients] = useState<Recipient[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    // Check authentication and role
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    // All authenticated portal users can compose messages
    if (!['admin', 'provider-admin', 'super-admin', 'provider'].includes(role || '')) {
      router.push('/portal/dashboard');
      return;
    }

    // Load available recipients
    loadRecipients();
  }, [router]);

  useEffect(() => {
    // Filter recipients based on search
    if (recipientSearch.trim()) {
      const filtered = availableRecipients.filter(recipient =>
        recipient.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
        recipient.email.toLowerCase().includes(recipientSearch.toLowerCase())
      );
      setFilteredRecipients(filtered);
      setShowRecipientDropdown(true);
    } else {
      setFilteredRecipients([]);
      setShowRecipientDropdown(false);
    }
  }, [recipientSearch, availableRecipients]);

  const loadRecipients = async () => {
    try {
      // TODO: Implement API call to load recipients
      const token = localStorage.getItem('token');
      const response = await fetch('/api/messages/recipients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const recipients = await response.json();
        setAvailableRecipients(recipients);
      } else {
        // Fallback to mock data for demo
        setAvailableRecipients([
          { id: '1', name: 'Dr. Sarah Johnson', email: 'sarah.johnson@clinic.com', type: 'provider' },
          { id: '2', name: 'John Smith', email: 'john.smith@patient.com', type: 'patient' },
          { id: '3', name: 'Admin User', email: 'admin@clinic.com', type: 'admin' },
          { id: '4', name: 'Dr. Michael Chen', email: 'michael.chen@clinic.com', type: 'provider' },
          { id: '5', name: 'Jane Doe', email: 'jane.doe@patient.com', type: 'patient' }
        ]);
      }
    } catch (err) {
      console.error('Failed to load recipients:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRecipients.length === 0) {
      setError('Please select at least one recipient');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const messageData = {
        recipientIds: selectedRecipients.map(r => r.id),
        subject: formData.subject,
        body: formData.body,
        priority: formData.priority,
        messageType: formData.messageType,
        attachments: attachments.map(file => ({ name: file.name, size: file.size }))
      };

      // TODO: Implement message sending API call
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        setSuccess(true);
        
        // Redirect to messages after short delay
        setTimeout(() => {
          router.push('/portal/messages');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Message sending error:', err);
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

  const addRecipient = (recipient: Recipient) => {
    if (!selectedRecipients.find(r => r.id === recipient.id)) {
      setSelectedRecipients(prev => [...prev, recipient]);
    }
    setRecipientSearch('');
    setShowRecipientDropdown(false);
  };

  const removeRecipient = (recipientId: string) => {
    setSelectedRecipients(prev => prev.filter(r => r.id !== recipientId));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent Successfully!</h3>
          <p className="text-gray-600">Redirecting to messages...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Messages
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Compose Message</h1>
          <p className="text-gray-600 mt-2">Send secure messages to patients, providers, and staff</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            {/* Recipients */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">To *</label>
              
              {/* Selected Recipients */}
              {selectedRecipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedRecipients.map((recipient) => (
                    <span
                      key={recipient.id}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                        recipient.type === 'patient'
                          ? 'bg-blue-100 text-blue-800'
                          : recipient.type === 'provider'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {recipient.name}
                      <button
                        type="button"
                        onClick={() => removeRecipient(recipient.id)}
                        className="ml-2 text-current hover:text-gray-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Recipient Search */}
              <div className="relative">
                <input
                  type="text"
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  placeholder="Search for patients, providers, or staff..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />

                {/* Recipient Dropdown */}
                {showRecipientDropdown && filteredRecipients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredRecipients.map((recipient) => (
                      <button
                        key={recipient.id}
                        type="button"
                        onClick={() => addRecipient(recipient)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
                      >
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          recipient.type === 'patient'
                            ? 'bg-blue-400'
                            : recipient.type === 'provider'
                            ? 'bg-green-400'
                            : 'bg-purple-400'
                        }`} />
                        <div>
                          <div className="font-medium">{recipient.name}</div>
                          <div className="text-sm text-gray-500">{recipient.email}</div>
                        </div>
                        <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                          recipient.type === 'patient'
                            ? 'bg-blue-100 text-blue-600'
                            : recipient.type === 'provider'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-purple-100 text-purple-600'
                        }`}>
                          {recipient.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Message Type and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
                <select
                  name="messageType"
                  value={formData.messageType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="general">General</option>
                  <option value="appointment">Appointment</option>
                  <option value="prescription">Prescription</option>
                  <option value="test-results">Test Results</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Subject */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
              <input
                type="text"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                placeholder="Enter message subject"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Message Body */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
              <textarea
                name="body"
                required
                rows={8}
                value={formData.body}
                onChange={handleChange}
                placeholder="Type your message here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Messages are encrypted and HIPAA compliant
              </p>
            </div>

            {/* File Attachments */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              />
              
              {/* Show selected attachments */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="p-4 bg-red-50 border border-red-200">
              <div className="text-red-600 text-sm">{error}</div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Save Draft
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
