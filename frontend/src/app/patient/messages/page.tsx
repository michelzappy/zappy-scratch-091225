'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock conversations
  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      patientName: 'John Doe',
      providerName: 'Dr. Sarah Smith',
      lastMessage: 'Your test results look good',
      lastMessageTime: '2 hours ago',
      unreadCount: 2,
      consultationType: 'General Medicine'
    },
    {
      id: '2',
      patientName: 'John Doe',
      providerName: 'Dr. Michael Johnson',
      lastMessage: 'Please schedule a follow-up',
      lastMessageTime: '1 day ago',
      unreadCount: 0,
      consultationType: 'Dermatology'
    }
  ]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Load messages when conversation is selected
    if (selectedConversation) {
      const mockMessages: Message[] = [
        {
          id: '1',
          senderId: '2',
          senderName: selectedConversation.providerName,
          senderType: 'provider',
          content: 'Hello! I\'ve reviewed your consultation request.',
          timestamp: '10:00 AM',
          isRead: true
        },
        {
          id: '2',
          senderId: '1',
          senderName: 'You',
          senderType: 'patient',
          content: 'Thank you for getting back to me, Doctor.',
          timestamp: '10:05 AM',
          isRead: true
        },
        {
          id: '3',
          senderId: '2',
          senderName: selectedConversation.providerName,
          senderType: 'provider',
          content: 'Based on your symptoms, I recommend the following treatment plan.',
          timestamp: '10:10 AM',
          isRead: true
        }
      ];
      setMessages(mockMessages);
    }
  }, [selectedConversation]);

  const handleSendMessage = () => {
    if (newMessage.trim() || attachedFiles.length > 0) {
      const message: Message = {
        id: Date.now().toString(),
        senderId: '1',
        senderName: 'You',
        senderType: 'patient',
        content: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false,
        attachments: attachedFiles.map(f => f.name)
      };
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      setAttachedFiles([]);
      
      // Simulate provider typing
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const reply: Message = {
            id: (Date.now() + 1).toString(),
            senderId: '2',
            senderName: selectedConversation?.providerName || 'Provider',
            senderType: 'provider',
            content: 'I\'ve received your message and will respond shortly.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: false
          };
          setMessages(prev => [...prev, reply]);
        }, 2000);
      }, 1000);
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/patient/dashboard" className="text-medical-600 hover:text-medical-700 text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Messages</h1>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden" style={{ height: '600px' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
              </div>
              <div className="overflow-y-auto" style={{ height: 'calc(100% - 60px)' }}>
                {conversations.map(conversation => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 ${
                      selectedConversation?.id === conversation.id ? 'bg-medical-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">{conversation.providerName}</h3>
                          <span className="text-xs text-gray-500">{conversation.lastMessageTime}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{conversation.consultationType}</p>
                        <p className="text-sm text-gray-500 mt-1 truncate">{conversation.lastMessage}</p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="ml-2 bg-medical-600 text-white text-xs rounded-full px-2 py-1">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedConversation.providerName}</h3>
                        <p className="text-sm text-gray-600">{selectedConversation.consultationType}</p>
                      </div>
                      <button className="text-medical-600 hover:text-medical-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderType === 'patient' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md ${
                          message.senderType === 'patient' 
                            ? 'bg-medical-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        } rounded-lg px-4 py-2`}>
                          <p className="text-sm">{message.content}</p>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((file, index) => (
                                <div key={index} className={`text-xs ${
                                  message.senderType === 'patient' ? 'text-medical-100' : 'text-gray-500'
                                }`}>
                                  📎 {file}
                                </div>
                              ))}
                            </div>
                          )}
                          <p className={`text-xs mt-1 ${
                            message.senderType === 'patient' ? 'text-medical-100' : 'text-gray-500'
                          }`}>
                            {message.timestamp}
                            {message.senderType === 'patient' && (
                              <span className="ml-2">
                                {message.isRead ? '✓✓' : '✓'}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-4 py-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    {attachedFiles.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {attachedFiles.map((file, index) => (
                          <div key={index} className="bg-gray-100 rounded px-2 py-1 text-sm flex items-center">
                            <span>{file.name}</span>
                            <button
                              onClick={() => removeAttachment(index)}
                              className="ml-2 text-red-600 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
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
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </button>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-medical-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="bg-medical-600 text-white p-2 rounded-full hover:bg-medical-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="mt-2">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
