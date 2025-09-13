'use client';

import { useState } from 'react';
import Card from '@/components/Card';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const faqCategories = [
    {
      title: 'Getting Started',
      questions: [
        { q: 'How do I start my treatment?', a: 'After your consultation is approved, your medication will be shipped to you. Follow the dosing instructions provided by your provider.' },
        { q: 'How long does shipping take?', a: 'Standard shipping takes 3-5 business days. Express shipping (1-2 days) is available for an additional fee.' },
        { q: 'What if I miss a dose?', a: 'If you miss a dose, take it as soon as you remember. If it\'s close to your next dose, skip the missed dose and continue with your regular schedule.' },
      ]
    },
    {
      title: 'Billing & Payments',
      questions: [
        { q: 'When will I be charged?', a: 'You\'ll be charged monthly on the same date you started your subscription. Your first charge includes consultation and medication.' },
        { q: 'Can I pause my subscription?', a: 'Yes, you can pause your subscription for up to 3 months. Go to Profile & Settings > Billing to manage your subscription.' },
        { q: 'Do you accept insurance?', a: 'We don\'t currently accept insurance, but we offer competitive cash prices and flexible payment plans.' },
      ]
    },
    {
      title: 'Medications',
      questions: [
        { q: 'Are the medications FDA approved?', a: 'Yes, all medications we prescribe are FDA-approved and sourced from licensed US pharmacies.' },
        { q: 'How should I store my medication?', a: 'Store medications as directed on the label. Most require storage at room temperature, away from heat and moisture.' },
        { q: 'What are the side effects?', a: 'Side effects vary by medication. Your provider will discuss potential side effects during your consultation. Always read the medication guide included with your prescription.' },
      ]
    }
  ];

  const contactOptions = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: 'Live Chat',
      description: 'Chat with our support team',
      availability: 'Available 24/7',
      action: 'Start Chat'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Email Support',
      description: 'Get help via email',
      availability: 'Response within 24 hours',
      action: 'Send Email'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      title: 'Phone Support',
      description: 'Speak with an agent',
      availability: 'Mon-Fri, 9AM-6PM EST',
      action: 'Call Now'
    }
  ];

  const guides = [
    { title: 'Getting Started Guide', icon: '📚', description: 'Everything you need to know about starting your treatment' },
    { title: 'Dosing Instructions', icon: '💊', description: 'How to properly take your medications' },
    { title: 'Managing Side Effects', icon: '⚕️', description: 'Tips for managing common side effects' },
    { title: 'Tracking Your Progress', icon: '📈', description: 'How to monitor and track your treatment progress' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Help Center</h1>
        <p className="text-slate-600 mt-2">Find answers and get support</p>
      </div>

      {/* Search Bar */}
      <Card>
        <div className="relative">
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <svg className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {guides.map((guide) => (
          <Card key={guide.title}>
            <div className="text-center">
              <div className="text-4xl mb-3">{guide.icon}</div>
              <h3 className="font-semibold text-slate-900 mb-1">{guide.title}</h3>
              <p className="text-sm text-slate-600">{guide.description}</p>
              <button className="mt-3 text-sm text-indigo-600 hover:text-indigo-700">
                Read More →
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <Card title="Frequently Asked Questions">
        <div className="space-y-6">
          {faqCategories.map((category) => (
            <div key={category.title}>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">{category.title}</h3>
              <div className="space-y-4">
                {category.questions.map((item, idx) => (
                  <details key={idx} className="group">
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                      <span className="text-sm font-medium text-slate-700">{item.q}</span>
                      <span className="ml-6 flex-shrink-0">
                        <svg className="h-5 w-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </summary>
                    <p className="mt-2 text-sm text-slate-600 pl-0">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Contact Options */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Need More Help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contactOptions.map((option) => (
            <Card key={option.title}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg mb-3">
                  {option.icon}
                </div>
                <h3 className="font-semibold text-slate-900">{option.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{option.description}</p>
                <p className="text-xs text-slate-500 mt-2">{option.availability}</p>
                <button className="mt-4 w-full py-2 px-4 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
                  {option.action}
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Additional Resources */}
      <Card title="Additional Resources">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="#" className="flex items-center p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-semibold text-slate-900">Knowledge Base</h4>
              <p className="text-sm text-slate-600">Browse our comprehensive guides</p>
            </div>
          </a>
          
          <a href="#" className="flex items-center p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-semibold text-slate-900">Video Tutorials</h4>
              <p className="text-sm text-slate-600">Watch step-by-step guides</p>
            </div>
          </a>
        </div>
      </Card>
    </div>
  );
}
