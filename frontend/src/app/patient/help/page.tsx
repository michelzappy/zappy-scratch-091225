'use client';

import { useState } from 'react';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const faqCategories = [
    {
      title: 'Getting Started',
      icon: '🚀',
      questions: [
        { id: 'q1', q: 'How do I start my treatment?', a: 'After your consultation is approved, your medication will be shipped to you. Follow the dosing instructions provided by your provider.' },
        { id: 'q2', q: 'How long does shipping take?', a: 'Standard shipping takes 3-5 business days. Express shipping (1-2 days) is available for an additional fee.' },
        { id: 'q3', q: 'What if I miss a dose?', a: 'If you miss a dose, take it as soon as you remember. If it\'s close to your next dose, skip the missed dose and continue with your regular schedule.' },
      ]
    },
    {
      title: 'Billing & Payments',
      icon: '💳',
      questions: [
        { id: 'q4', q: 'When will I be charged?', a: 'You\'ll be charged monthly on the same date you started your subscription. Your first charge includes consultation and medication.' },
        { id: 'q5', q: 'Can I pause my subscription?', a: 'Yes, you can pause your subscription for up to 3 months. Go to Profile & Settings > Billing to manage your subscription.' },
        { id: 'q6', q: 'Do you accept insurance?', a: 'We don\'t currently accept insurance, but we offer competitive cash prices and flexible payment plans.' },
      ]
    },
    {
      title: 'Medications',
      icon: '💊',
      questions: [
        { id: 'q7', q: 'Are the medications FDA approved?', a: 'Yes, all medications we prescribe are FDA-approved and sourced from licensed US pharmacies.' },
        { id: 'q8', q: 'How should I store my medication?', a: 'Store medications as directed on the label. Most require storage at room temperature, away from heat and moisture.' },
        { id: 'q9', q: 'What are the side effects?', a: 'Side effects vary by medication. Your provider will discuss potential side effects during your consultation.' },
      ]
    }
  ];

  const contactOptions = [
    {
      icon: '💬',
      title: 'Live Chat',
      description: 'Chat with support',
      availability: '24/7',
      action: 'Start Chat',
      color: 'medical'
    },
    {
      icon: '📧',
      title: 'Email Support',
      description: 'Get help via email',
      availability: 'Within 24hrs',
      action: 'Send Email',
      color: 'emerald'
    },
    {
      icon: '📞',
      title: 'Phone Support',
      description: 'Speak with agent',
      availability: '9AM-6PM EST',
      action: 'Call Now',
      color: 'blue'
    }
  ];

  const guides = [
    { title: 'Getting Started', icon: '📚', description: 'Start your treatment' },
    { title: 'Dosing Guide', icon: '💊', description: 'Take medications properly' },
    { title: 'Side Effects', icon: '⚕️', description: 'Managing symptoms' },
    { title: 'Track Progress', icon: '📈', description: 'Monitor treatment' },
  ];

  const filteredFaqs = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      searchQuery === '' || 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="space-y-4 pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Help Center</h1>
        <p className="text-sm text-slate-600 mt-1">Find answers and get support</p>
      </div>

      {/* Search Bar - Mobile First */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-colors"
        />
        <svg className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Quick Contact - Mobile Priority */}
      <div className="grid grid-cols-3 gap-2">
        {contactOptions.map((option) => (
          <button 
            key={option.title}
            className={`p-3 rounded-xl border-2 text-center hover:shadow-lg transition-all hover:scale-[1.02] ${
              option.color === 'medical' ? 'border-medical-200 bg-white' :
              option.color === 'emerald' ? 'border-emerald-200 bg-white' :
              'border-blue-200 bg-white'
            }`}
          >
            <div className="text-2xl mb-1">{option.icon}</div>
            <p className={`text-xs font-semibold ${
              option.color === 'medical' ? 'text-medical-700' :
              option.color === 'emerald' ? 'text-emerald-700' :
              'text-blue-700'
            }`}>{option.title}</p>
            <p className="text-xs text-slate-500">{option.availability}</p>
          </button>
        ))}
      </div>

      {/* Quick Guides */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Quick Guides</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {guides.map((guide) => (
            <button 
              key={guide.title}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow text-left"
            >
              <div className="text-2xl mb-2">{guide.icon}</div>
              <h3 className="font-medium text-sm text-slate-900">{guide.title}</h3>
              <p className="text-xs text-slate-600 mt-1">{guide.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Section - Expandable */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Frequently Asked Questions</h2>
        </div>
        
        <div className="divide-y divide-slate-100">
          {filteredFaqs.map((category) => (
            <div key={category.title}>
              <div className="px-4 py-3 bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  <h3 className="font-medium text-sm text-slate-900">{category.title}</h3>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {category.questions.map((item) => (
                  <div key={item.id}>
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-slate-700 pr-2">{item.q}</p>
                        <svg 
                          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${
                            expandedFaq === item.id ? 'rotate-180' : ''
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {expandedFaq === item.id && (
                      <div className="px-4 pb-3 bg-slate-50">
                        <p className="text-sm text-slate-600">{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Need More Help? */}
      <div className="bg-gradient-to-r from-medical-500 to-emerald-500 rounded-xl p-4 text-white">
        <h3 className="font-semibold text-white mb-2">Still need help?</h3>
        <p className="text-sm text-white/90 mb-4">
          Our support team is here to assist you with any questions.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button className="bg-white/20 backdrop-blur text-white font-medium text-sm py-2 px-3 rounded-lg hover:bg-white/30 transition">
            💬 Live Chat
          </button>
          <button className="bg-white/10 text-white font-medium text-sm py-2 px-3 rounded-lg hover:bg-white/20 transition">
            📧 Email Us
          </button>
        </div>
      </div>

      {/* Additional Resources */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Additional Resources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              📖
            </div>
            <div className="text-left">
              <h4 className="text-sm font-semibold text-slate-900">Knowledge Base</h4>
              <p className="text-xs text-slate-600">Browse comprehensive guides</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              🎥
            </div>
            <div className="text-left">
              <h4 className="text-sm font-semibold text-slate-900">Video Tutorials</h4>
              <p className="text-xs text-slate-600">Watch step-by-step guides</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
