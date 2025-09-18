'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Message {
  id: string;
  subject: string;
  from: {
    name: string;
    email: string;
    type: 'patient' | 'provider' | 'admin';
  };
  to: {
    name: string;
    email: string;
    type: 'patient' | 'provider' | 'admin';
  };
  content: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attachments?: Array<{
    name: string;
    size: string;
    type: string;
  }>;
}

export default function MessageDetailPage() {
  const router = useRouter();
  const params = useParams();
  const messageId = params.id as string;
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [showReply, setShowReply] = useState(false);

  useEffect(() => {
    fetchMessage();
  }, [messageId]);

  const fetchMessage = async () => {
    // Mock data - in production, fetch from API
    const mockMessage: Message = {
      id: messageId,
      subject: 'Question about medication dosage',
      from: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        type: 'patient'
      },
      to: {
        name: 'Dr. Michael Smith',
        email: 'dr.smith@clinic.com',
        type: 'provider'
      },
      content: `Hello Dr. Smith,

I hope this message finds you well. I wanted to reach out regarding the medication you prescribed during my last visit.

I've been taking the prescribed medication for about a week now, and I'm noticing some mild side effects that I wanted to discuss with you:

1. Slight dizziness in the mornings
2. Some nausea about an hour after taking the medication
3. Mild headaches in the evening

Are these side effects normal? Should I continue with the current dosage or would you recommend any adjustments?

Also, I wanted to confirm the timing - you mentioned taking it with food, but I'm not sure if that means during meals or just after eating.

I would appreciate your guidance on this matter. If needed, I'm available for a follow-up appointment this week.

Thank you for your time and care.

Best regards,
Sarah Johnson`,
      timestamp: '2024-01-15T10:30:00Z',
      read: true,
      priority: 'normal',
      attachments: [
        {
          name: 'medication_schedule.pdf',
          size: '245 KB',
          type: 'application/pdf'
        }
      ]
    };

    setMessage(mockMessage);
    setLoading(false);
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    // Mock reply functionality
    console.log('Sending reply:', {
      messageId,
      content: replyContent,
      timestamp: new Date().toISOString()
    });

    // Reset reply form
    setReplyContent('');
    setShowReply(false);

    // Show success message
    alert('Reply sent successfully!');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'patient': return '👤';
      case 'provider': return '👨‍⚕️';
      case 'admin': return '👨‍💼';
      default: return '👤';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading message...</p>
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Message not found</p>
          <Link href="/portal/messages" className="mt-4 inline-block text-purple-600 hover:text-purple-700">
            ← Back to Messages
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
                href="/portal/messages"
                className="text-gray-500 hover:text-gray-700 flex items-center"
              >
                ← Back to Messages
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Message Details</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowReply(!showReply)}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
              >
                Reply
              </button>
              <button className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm">
                Forward
              </button>
              <button className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Message Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{message.subject}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <span>{getUserTypeIcon(message.from.type)}</span>
                    <span><strong>From:</strong> {message.from.name}</span>
                    <span className="text-gray-400">({message.from.email})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>{getUserTypeIcon(message.to.type)}</span>
                    <span><strong>To:</strong> {message.to.name}</span>
                    <span className="text-gray-400">({message.to.email})</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <span><strong>Date:</strong> {new Date(message.timestamp).toLocaleString()}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(message.priority)}`}>
                    {message.priority.charAt(0).toUpperCase() + message.priority.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Attachments</h3>
              <div className="space-y-2">
                {message.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center space-x-3 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="text-gray-900">{attachment.name}</span>
                    <span className="text-gray-500">({attachment.size})</span>
                    <button className="text-purple-600 hover:text-purple-700 text-xs">Download</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Body */}
          <div className="px-6 py-6">
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">
                {message.content}
              </div>
            </div>
          </div>

          {/* Reply Section */}
          {showReply && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reply</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Reply
                  </label>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your reply here..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={6}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button className="text-sm text-gray-600 hover:text-gray-900">
                      📎 Attach File
                    </button>
                    <button className="text-sm text-gray-600 hover:text-gray-900">
                      🔒 Mark as Confidential
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setShowReply(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleReply}
                      disabled={!replyContent.trim()}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}