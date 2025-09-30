'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'patient' | 'provider';
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: string[];
}

interface Conversation {
  id: string;
  patientName: string;
  providerName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  consultationType: string;
}

export default function PatientMessages() {
  const router = useRouter();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showConversations, setShowConversations] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data for demo
  const mockConversations: Conversation[] = [
    {
      id: 'conv-1',
      patientName: 'Sarah Johnson',
      providerName: 'Dr. Emily Roberts',
      lastMessage: 'Your lab results look great! Your A1C has improved to 5.8.',
      lastMessageTime: '2h ago',
      unreadCount: 2,
      consultationType: 'Weight Loss Program'
    },
    {
      id: 'conv-2',
      patientName: 'Sarah Johnson',
      providerName: 'Dr. Michael Chen',
      lastMessage: 'Thanks for the update on your progress. Let\'s schedule a follow-up.',
      lastMessageTime: '1d ago',
      unreadCount: 0,
      consultationType: 'General Consultation'
    }
  ];

  const mockMessages: Record<string, Message[]> = {
    'conv-1': [
      {
        id: 'msg-1',
        senderId: 'patient-1',
        senderName: 'Sarah',
        senderType: 'patient',
        content: 'Hi Dr. Roberts, I wanted to update you on my progress. I\'ve been following the meal plan and taking my medication as prescribed.',
        timestamp: '10:30 AM',
        isRead: true
      },
      {
        id: 'msg-2',
        senderId: 'provider-1',
        senderName: 'Dr. Roberts',
        senderType: 'provider',
        content: 'That\'s wonderful to hear! I\'ve reviewed your recent weight measurements and they show consistent progress. How are you feeling overall?',
        timestamp: '10:45 AM',
        isRead: true
      },
      {
        id: 'msg-3',
        senderId: 'patient-1',
        senderName: 'Sarah',
        senderType: 'patient',
        content: 'I\'m feeling much better! More energy throughout the day and sleeping better too. The medication side effects have completely subsided.',
        timestamp: '11:02 AM',
        isRead: true
      },
      {
        id: 'msg-4',
        senderId: 'provider-1',
        senderName: 'Dr. Roberts',
        senderType: 'provider',
        content: 'Excellent! I just reviewed your latest lab work. Your lab results look great! Your A1C has improved to 5.8. Keep up the great work with your program.',
        timestamp: '2:15 PM',
        isRead: false
      }
    ],
    'conv-2': [
      {
        id: 'msg-5',
        senderId: 'patient-1',
        senderName: 'Sarah',
        senderType: 'patient',
        content: 'Hello Dr. Chen, thank you for the consultation last week.',
        timestamp: 'Yesterday 9:00 AM',
        isRead: true
      },
      {
        id: 'msg-6',
        senderId: 'provider-2',
        senderName: 'Dr. Chen',
        senderType: 'provider',
        content: 'Thanks for the update on your progress. Let\'s schedule a follow-up in two weeks to reassess.',
        timestamp: 'Yesterday 2:30 PM',
        isRead: true
      }
    ]
  };

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await apiClient.messages.getMyConversations();
        setConversations(response.data || mockConversations);
        setError(null);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setConversations(mockConversations);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedConversation) {
        try {
          const response = await apiClient.messages.getConversationMessages(selectedConversation.id);
          setMessages(response.data || mockMessages[selectedConversation.id] || []);
          
          if (window.innerWidth < 768) {
            setShowConversations(false);
          }
        } catch (err) {
          console.error('Error fetching messages:', err);
          setMessages(mockMessages[selectedConversation.id] || []);
        }
      }
    };

    fetchMessages();
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!selectedConversation || (!newMessage.trim() && attachedFiles.length === 0)) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('content', newMessage);
      formData.append('senderType', 'patient');
      
      attachedFiles.forEach((file, index) => {
        formData.append(`attachments`, file);
      });

      const response = await apiClient.messages.sendMessage(selectedConversation.id, formData);
      
      if (response.data) {
        setMessages(prev => [...prev, response.data]);
      }
      
      setNewMessage('');
      setAttachedFiles([]);
      
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedConversation && (
              <button
                onClick={() => setShowConversations(true)}
                className="lg:hidden text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 className="text-lg font-bold text-slate-900">Messages</h1>
          </div>
          {conversations.reduce((acc, c) => acc + c.unreadCount, 0) > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
              {conversations.reduce((acc, c) => acc + c.unreadCount, 0)} New
            </span>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100vh-60px)]">
        <div className={`${
          showConversations ? 'block' : 'hidden'
        } lg:block w-full lg:w-1/3 xl:w-1/4 bg-white border-r border-slate-200 overflow-y-auto`}>
          {conversations.map(conversation => (
            <button
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className={`w-full text-left p-4 hover:bg-slate-50 border-b border-slate-100 transition-colors ${
                selectedConversation?.id === conversation.id ? 'bg-rose-50 border-l-4 border-l-rose-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-slate-900 text-sm truncate">
                      {conversation.providerName}
                    </h3>
                    <span className="text-xs text-slate-500 ml-2">
                      {conversation.lastMessageTime}
                    </span>
                  </div>
                  <p className="text-xs text-rose-600 font-medium mb-1">
                    {conversation.consultationType}
                  </p>
                  <p className="text-sm text-slate-600 truncate">
                    {conversation.lastMessage}
                  </p>
                </div>
                {conversation.unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 flex-shrink-0">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className={`${
          !showConversations || window.innerWidth >= 1024 ? 'flex' : 'hidden'
        } lg:flex flex-1 flex-col bg-white`}>
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {selectedConversation.providerName}
                    </h3>
                    <p className="text-xs text-rose-600">
                      {selectedConversation.consultationType}
                    </p>
                  </div>
                  <button className="p-2 text-rose-600 hover:bg-white rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderType === 'patient' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] lg:max-w-md ${
                      message.senderType === 'patient' 
                        ? 'bg-rose-500 text-white rounded-2xl rounded-br-sm' 
                        : 'bg-slate-100 text-slate-900 rounded-2xl rounded-bl-sm'
                    } px-4 py-2 shadow-sm`}>
                      <p className="text-sm">{message.content}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((file, index) => (
                            <div key={index} className={`text-xs ${
                              message.senderType === 'patient' ? 'text-rose-100' : 'text-slate-500'
                            }`}>
                              📎 {file}
                            </div>
                          ))}
                        </div>
                      )}
                      <p className={`text-xs mt-1 ${
                        message.senderType === 'patient' ? 'text-rose-100' : 'text-slate-500'
                      }`}>
                        {message.timestamp}
                        {message.senderType === 'patient' && (
                          <span className="ml-2">✓✓</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-slate-200 bg-white">
                {attachedFiles.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="bg-slate-100 rounded-lg px-3 py-1 text-xs flex items-center">
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="ml-2 text-red-600 hover:text-red-700 text-lg"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileAttachment}
                    className="hidden"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2.5 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-colors"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-slate-600 font-medium">No conversation selected</p>
                <p className="text-sm text-slate-500 mt-1">Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
