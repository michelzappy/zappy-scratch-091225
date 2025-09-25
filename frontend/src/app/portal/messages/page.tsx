'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/Card';
import { apiClient } from '@/lib/api';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  priority: 'normal' | 'high' | 'urgent';
  type: 'patient' | 'provider' | 'system' | 'admin';
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userRole, setUserRole] = useState<UserRole>('provider');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'patient' | 'provider' | 'system'>('all');

  useEffect(() => {
    // Try to get role from localStorage, but don't redirect if not found
    const role = localStorage.getItem('userRole') as UserRole;
    
    if (role) {
      setUserRole(role);
    } else {
      // Default to provider if no role is set
      setUserRole('provider');
      // Set default role in localStorage for consistency
      localStorage.setItem('userRole', 'provider');
    }

    fetchMessages();
  }, []);

  // Refetch when filter changes
  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const consultationId = searchParams.get('consultationId') ?? undefined;
      
      // Get messages from API
      const data = await apiClient.messages.getMyConversations();
      
      const messagesData = (data as any) || [];
      
      // Transform API data to match our interface
      const transformedMessages: Message[] = messagesData.map((item: any) => ({
        id: item.id,
        from: item.sender_name || item.from_name || 'Unknown Sender',
        to: item.recipient_name || item.to_name || 'Unknown Recipient',
        subject: item.subject || 'No Subject',
        preview: item.preview || item.content?.substring(0, 100) || 'No preview available',
        date: item.created_at || item.sent_at || new Date().toISOString(),
        read: item.read || item.is_read || false,
        priority: item.priority || 'normal',
        type: item.type || item.message_type || 'system'
      }));
      
      setMessages(transformedMessages);
      
    } catch (err: any) {
      console.error('Error fetching messages:', err?.error || err);
      setError(err?.error || 'Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(message => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !message.read;
    return message.type === filter;
  });

  const getPriorityIcon = (priority: string) => {
    if (priority === 'urgent') return '🔴';
    if (priority === 'high') return '🟡';
    return '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchMessages}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">Communicate with patients and providers</p>
        </div>
        <button 
          onClick={() => {
            router.push('/portal/messages/compose');
          }}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
        >
          Compose Message
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Messages</p>
          <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Unread</p>
          <p className="text-2xl font-bold text-blue-600">
            {messages.filter(m => !m.read).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Urgent</p>
          <p className="text-2xl font-bold text-red-600">
            {messages.filter(m => m.priority === 'urgent').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Response Rate</p>
          <p className="text-2xl font-bold text-green-600">98%</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'all' 
              ? 'bg-gray-900 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          All Messages
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'unread' 
              ? 'bg-gray-900 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Unread ({messages.filter(m => !m.read).length})
        </button>
        <button
          onClick={() => setFilter('patient')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'patient' 
              ? 'bg-gray-900 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          From Patients
        </button>
        <button
          onClick={() => setFilter('provider')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'provider' 
              ? 'bg-gray-900 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          From Providers
        </button>
      </div>

      {/* Messages List */}
      <Card className="divide-y divide-gray-200">
        {filteredMessages.map((message) => (
          <div
            key={message.id}
            className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
              !message.read ? 'bg-blue-50' : ''
            }`}
            onClick={async () => {
              // Mark message as read when clicked
              if (!message.read) {
                try {
                  const consultationId = searchParams.get('consultationId') ?? undefined;
                  await apiClient.messages.markConversationRead(message.id);
                  // Update local state
                  setMessages(prev => prev.map(m => 
                    m.id === message.id ? { ...m, read: true } : m
                  ));
                } catch (err) {
                  console.error('Error marking message as read:', err);
                }
              }
              router.push(`/portal/messages/${message.id}`);
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  {!message.read && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      // Mark message as read when clicked
                      if (!message.read) {
                        try {
                          const consultationId = searchParams.get('consultationId') ?? undefined;
                          await apiClient.messages.markRead(message.id, consultationId);
                          // Update local state
                          setMessages(prev => prev.map(m => 
                            m.id === message.id ? { ...m, read: true } : m
                          ));
                        } catch (err) {
                          console.error('Error marking message as read:', err);
                        }
                      }
                      router.push(`/portal/messages/${message.id}`);
                    }}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline"
                  >
                    {message.from}
                  </button>
                  <span className="text-sm text-gray-500">→</span>
                  <span className="text-sm text-gray-600">
                    {message.to}
                  </span>
                  {message.priority !== 'normal' && (
                    <span className="text-sm">{getPriorityIcon(message.priority)}</span>
                  )}
                </div>
                <h3 className="mt-1 text-sm font-semibold text-gray-900">
                  {message.subject}
                </h3>
                <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                  {message.preview}
                </p>
              </div>
              <div className="ml-4 text-right">
                <p className="text-xs text-gray-500">
                  {new Date(message.date).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(message.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
