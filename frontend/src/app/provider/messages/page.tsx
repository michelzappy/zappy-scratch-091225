'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProviderMessages() {
  const router = useRouter();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showConversationList, setShowConversationList] = useState(true);

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
    },
    {
      id: '4',
      patient: 'James Wilson',
      lastMessage: 'Follow-up question about dosage',
      timestamp: 'Yesterday',
      unread: 0,
      priority: 'low',
      subscription: 'Essential'
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

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread, 0);

  return (
    <div className="space-y-4 pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-sm text-slate-600 mt-1">
          {totalUnread} unread • {conversations.length} conversations
        </p>
      </div>

      {/* Mobile View Toggle (shown on mobile only) */}
      {selectedConversation && (
        <button
          onClick={() => {
            setSelectedConversation(null);
            setShowConversationList(true);
          }}
          className="lg:hidden flex items-center gap-2 text-sm text-medical-600 font-medium"
        >
          ← Back to conversations
        </button>
      )}

      {/* Main Layout */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-4">
        {/* Conversations List - Mobile Responsive */}
        <div className={`${selectedConversation ? 'hidden lg:block' : 'block'} lg:col-span-1`}>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200">
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
              />
            </div>
            
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConversation(conv.id);
                    setShowConversationList(false);
                  }}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                    selectedConversation === conv.id ? 'bg-slate-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="relative">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-slate-600">
                            {conv.patient.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        {conv.unread > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-slate-900">{conv.patient}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            conv.subscription === 'Premium'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {conv.subscription}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 truncate">{conv.lastMessage}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 ml-2">{conv.timestamp}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Message Thread - Mobile Responsive */}
        <div className={`${!selectedConversation ? 'hidden lg:block' : 'block'} lg:col-span-2`}>
          {selectedConv ? (
            <div className="bg-white rounded-xl shadow-sm h-[600px] flex flex-col">
              {/* Thread Header */}
              <div className="px-4 py-3 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-slate-600">
                        {selectedConv.patient.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{selectedConv.patient}</p>
                      <p className="text-xs text-slate-500">Last seen 2 min ago</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => router.push('/provider/patient/1')}
                    className="text-xs text-medical-600 hover:text-medical-700 font-medium"
                  >
                    View Profile →
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'provider' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                      message.sender === 'provider'
                        ? 'bg-medical-600 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'provider' ? 'text-white/70' : 'text-slate-500'
                      }`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="px-4 py-3 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <button className="text-slate-400 hover:text-slate-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
                  />
                  <button className="px-4 py-2 bg-medical-600 text-white text-sm font-medium rounded-lg hover:bg-medical-700 transition">
                    Send
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <button className="text-xs text-slate-500 hover:text-slate-700">Quick Reply</button>
                  <button className="text-xs text-slate-500 hover:text-slate-700">Templates</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex bg-white rounded-xl shadow-sm h-[600px] items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <p className="text-sm text-slate-600">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Response Time</p>
          <p className="text-xl font-bold text-slate-900 mt-1">8m</p>
          <p className="text-xs text-emerald-600 mt-1">↓ 2m faster</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Messages Today</p>
          <p className="text-xl font-bold text-slate-900 mt-1">47</p>
          <p className="text-xs text-slate-500 mt-1">Normal volume</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Satisfaction</p>
          <p className="text-xl font-bold text-slate-900 mt-1">4.8/5</p>
          <p className="text-xs text-emerald-600 mt-1">↑ 0.2</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Templates Used</p>
          <p className="text-xl font-bold text-slate-900 mt-1">12</p>
          <p className="text-xs text-slate-500 mt-1">Today</p>
        </div>
      </div>
    </div>
  );
}
