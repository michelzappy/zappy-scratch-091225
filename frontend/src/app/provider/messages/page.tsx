'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProviderMessages() {
  const router = useRouter();
  const [selectedConversation, setSelectedConversation] = useState('1');
  const [messageText, setMessageText] = useState('');

  const conversations = [
    {
      id: '1',
      patient: 'Emily Johnson',
      lastMessage: 'Thank you for the prescription',
      timestamp: '10:23 AM',
      unread: 2,
      priority: 'high',
      subscription: 'Premium'
    },
    {
      id: '2',
      patient: 'Michael Chen',
      lastMessage: 'When should I expect results?',
      timestamp: '9:45 AM',
      unread: 1,
      priority: 'medium',
      subscription: 'Essential'
    },
    {
      id: '3',
      patient: 'Sarah Williams',
      lastMessage: 'Medication is working well',
      timestamp: 'Yesterday',
      unread: 0,
      priority: 'low',
      subscription: 'Premium'
    }
  ];

  const messages = [
    {
      id: '1',
      sender: 'patient',
      text: 'Hi Dr. Smith, I started the tretinoin cream as prescribed.',
      timestamp: '10:15 AM'
    },
    {
      id: '2',
      sender: 'provider',
      text: 'Great! Remember to use sunscreen daily. Any initial irritation is normal.',
      timestamp: '10:18 AM'
    },
    {
      id: '3',
      sender: 'patient',
      text: 'Thank you for the prescription. Should I apply it before or after moisturizer?',
      timestamp: '10:23 AM'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-medium text-gray-900">Messages</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                3 unread • 12 active conversations
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search messages..."
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              />
              <button className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition">
                Compose
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Conversations List */}
        <div className="w-80 bg-white border-r border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-xs font-medium bg-gray-900 text-white rounded">All</button>
              <button className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded">Unread</button>
              <button className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded">Priority</button>
            </div>
          </div>
          
          <div className="overflow-y-auto">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition ${
                  selectedConversation === conv.id ? 'bg-gray-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {conv.patient.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      {conv.unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">{conv.patient}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          conv.subscription === 'Premium'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {conv.subscription}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 truncate">{conv.lastMessage}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{conv.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Thread Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">EJ</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Emily Johnson</p>
                  <p className="text-xs text-gray-500">Last seen 2 min ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => router.push('/provider/patient/1')}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  View Profile
                </button>
                <button className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition">
                  Archive
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'provider' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-lg px-4 py-2 rounded-lg ${
                  message.sender === 'provider'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'provider' ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              />
              <button className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition">
                Send
              </button>
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <button className="text-xs text-gray-500 hover:text-gray-700">Attach File</button>
              <button className="text-xs text-gray-500 hover:text-gray-700">Quick Reply</button>
              <button className="text-xs text-gray-500 hover:text-gray-700">Templates</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
