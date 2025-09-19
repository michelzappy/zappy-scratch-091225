'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/Card';

interface PatientIssue {
  id: string;
  patient: {
    name: string;
    id: string;
    email: string;
    phone: string;
  };
  issue: string;
  description: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'assigned' | 'in-progress' | 'resolved';
  assignedTo?: string;
  category: string;
  messages: Array<{
    id: string;
    sender: string;
    role: 'patient' | 'admin' | 'provider';
    message: string;
    timestamp: string;
  }>;
}

export default function SupportIssuePage() {
  const params = useParams();
  const router = useRouter();
  const issueId = params.id as string;
  
  const [issue, setIssue] = useState<PatientIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchIssue();
  }, [issueId]);

  const fetchIssue = async () => {
    // Mock data for support issues
    const mockIssues: Record<string, PatientIssue> = {
      'P-12847': {
        id: 'P-12847',
        patient: {
          name: 'Sarah Johnson',
          id: '1',
          email: 'sarah.johnson@email.com',
          phone: '(555) 123-4567'
        },
        issue: 'Question about medication dosage',
        description: 'Patient is concerned about the dosage of their new medication. They report feeling dizzy after taking the prescribed amount and want to know if they should adjust the dose.',
        time: '12 min ago',
        priority: 'high',
        status: 'pending',
        category: 'Medication',
        messages: [
          {
            id: '1',
            sender: 'Sarah Johnson',
            role: 'patient',
            message: 'Hi, I started taking the new medication yesterday and I\'ve been feeling really dizzy. The prescription says to take 2 tablets twice a day, but I\'m wondering if I should reduce the dose?',
            timestamp: '2024-01-15T14:30:00'
          },
          {
            id: '2',
            sender: 'Sarah Johnson',
            role: 'patient',
            message: 'I\'m also experiencing some mild nausea. Is this normal for the first few days?',
            timestamp: '2024-01-15T14:32:00'
          }
        ]
      },
      'P-12846': {
        id: 'P-12846',
        patient: {
          name: 'Michael Chen',
          id: '2',
          email: 'michael.chen@email.com',
          phone: '(555) 234-5678'
        },
        issue: 'Needs prescription refill',
        description: 'Patient needs a refill for their acne medication. Current prescription expired yesterday.',
        time: '28 min ago',
        priority: 'medium',
        status: 'in-progress',
        assignedTo: 'Dr. Smith',
        category: 'Prescription',
        messages: [
          {
            id: '1',
            sender: 'Michael Chen',
            role: 'patient',
            message: 'My tretinoin prescription just expired and I need a refill. Can you please help?',
            timestamp: '2024-01-15T14:15:00'
          },
          {
            id: '2',
            sender: 'Admin Support',
            role: 'admin',
            message: 'I\'ve forwarded your request to Dr. Smith who will review and approve the refill.',
            timestamp: '2024-01-15T14:20:00'
          }
        ]
      },
      'P-12845': {
        id: 'P-12845',
        patient: {
          name: 'Emily Davis',
          id: '3',
          email: 'emily.davis@email.com',
          phone: '(555) 345-6789'
        },
        issue: 'Reporting mild side effects',
        description: 'Patient is experiencing mild skin irritation from new topical treatment.',
        time: '45 min ago',
        priority: 'high',
        status: 'assigned',
        assignedTo: 'Dr. Jones',
        category: 'Side Effects',
        messages: [
          {
            id: '1',
            sender: 'Emily Davis',
            role: 'patient',
            message: 'I\'ve been using the new cream for a week and my skin is getting red and irritated. Should I stop using it?',
            timestamp: '2024-01-15T14:00:00'
          }
        ]
      }
    };

    if (mockIssues[issueId]) {
      setIssue(mockIssues[issueId]);
    } else {
      setIssue(null);
    }
    setLoading(false);
  };

  const handleStatusChange = async (newStatus: PatientIssue['status']) => {
    if (!issue) return;
    
    setUpdating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIssue({
      ...issue,
      status: newStatus,
      assignedTo: newStatus === 'assigned' || newStatus === 'in-progress' ? 
        localStorage.getItem('userName') || 'Current User' : issue.assignedTo
    });
    setUpdating(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !issue) return;
    
    setUpdating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newMsg = {
      id: Date.now().toString(),
      sender: localStorage.getItem('userName') || 'Admin Support',
      role: 'admin' as const,
      message: newMessage,
      timestamp: new Date().toISOString()
    };
    
    setIssue({
      ...issue,
      messages: [...issue.messages, newMsg]
    });
    setNewMessage('');
    setUpdating(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Issue Not Found</h2>
          <p className="text-gray-600 mb-4">The support issue you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/portal/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </Card>
      </div>
    );
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Support Issue {issueId}</h1>
        <button
          onClick={() => router.push('/portal/dashboard')}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Issue Details Card */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Issue Header */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">{issue.issue}</h2>
              <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                  {issue.priority} priority
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(issue.status)}`}>
                  {issue.status}
                </span>
                <span className="text-xs text-gray-500">{issue.category}</span>
              </div>
            </div>
            {/* Status Actions */}
            <div className="flex items-center gap-2">
              {issue.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange('assigned')}
                  disabled={updating}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Assign to Me
                </button>
              )}
              {issue.status === 'assigned' && (
                <button
                  onClick={() => handleStatusChange('in-progress')}
                  disabled={updating}
                  className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                >
                  Start Working
                </button>
              )}
              {issue.status === 'in-progress' && (
                <button
                  onClick={() => handleStatusChange('resolved')}
                  disabled={updating}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </div>

          {/* Patient Information */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Patient Information</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{issue.patient.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{issue.patient.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium">{issue.patient.phone}</p>
              </div>
            </div>
            <div className="mt-3">
              <button
                onClick={() => router.push(`/portal/patient/${issue.patient.id}`)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View Patient Profile →
              </button>
            </div>
          </div>

          {/* Assigned To */}
          {issue.assignedTo && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600">
                Assigned to: <span className="font-medium text-gray-900">{issue.assignedTo}</span>
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Messages Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversation</h3>
        
        {/* Messages List */}
        <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
          {issue.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'patient' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-2xl ${message.role === 'patient' ? 'order-2' : 'order-1'}`}>
                <div className={`rounded-lg px-4 py-2 ${
                  message.role === 'patient' 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'bg-blue-600 text-white'
                }`}>
                  <p className="text-sm">{message.message}</p>
                </div>
                <div className={`mt-1 text-xs text-gray-500 ${
                  message.role === 'patient' ? 'text-left' : 'text-right'
                }`}>
                  {message.sender} • {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Section */}
        {issue.status !== 'resolved' && (
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your response..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={updating}
              />
              <button
                onClick={handleSendMessage}
                disabled={updating || !newMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}