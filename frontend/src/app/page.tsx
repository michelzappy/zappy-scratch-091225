'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [selectedCondition, setSelectedCondition] = useState('hair-loss');

  const conditions = [
    {
      id: 'hair-loss',
      name: 'Hair Loss',
      icon: '💊',
      description: 'FDA-approved treatments that actually work',
      price: 'From $22/month',
      image: '/hair-loss.jpg'
    },
    {
      id: 'ed',
      name: 'Erectile Dysfunction',
      icon: '🔵',
      description: 'Effective ED treatments delivered discreetly',
      price: 'From $2/dose',
      image: '/ed.jpg'
    },
    {
      id: 'weight-loss',
      name: 'Weight Loss',
      icon: '⚖️',
      description: 'Medical weight loss that works',
      price: 'From $99/month',
      image: '/weight.jpg'
    },
    {
      id: 'mental-health',
      name: 'Mental Health',
      icon: '🧠',
      description: 'Anxiety & depression treatment online',
      price: 'From $25/month',
      image: '/mental.jpg'
    }
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Your health,<br />
              <span className="text-yellow-300">delivered</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
              Get personalized treatment for hair loss, ED, weight loss & more. 
              100% online, prescribed by real doctors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/patient/new-consultation" 
                className="inline-block bg-white text-purple-600 px-8 py-4 rounded-full text-lg font-bold hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200">
                Start Free Consultation
              </Link>
              <a href="#conditions" 
                className="inline-block bg-transparent border-2 border-white text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-white hover:text-purple-600 transition-all duration-200">
                Browse Treatments
              </a>
            </div>
            <p className="text-white/80 text-sm">
              ✓ Free online consultation &nbsp;&nbsp; ✓ Free 2-day shipping &nbsp;&nbsp; ✓ Cancel anytime
            </p>
          </div>
        </div>
        
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-16 sm:h-20">
            <path fill="#ffffff" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-12 bg-gray-50 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-3xl font-bold text-purple-600 mb-2">500K+</h3>
              <p className="text-gray-700 font-medium">Happy Customers</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-purple-600 mb-2">50</h3>
              <p className="text-gray-700 font-medium">States Covered</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-purple-600 mb-2">4.8★</h3>
              <p className="text-gray-700 font-medium">Average Rating</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-purple-600 mb-2">24/7</h3>
              <p className="text-gray-700 font-medium">Support Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Conditions Section */}
      <section id="conditions" className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Treatments that work, delivered to you
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              FDA-approved medications prescribed by licensed physicians
            </p>
          </div>

          {/* Condition Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {conditions.map((condition) => (
              <button
                key={condition.id}
                onClick={() => setSelectedCondition(condition.id)}
                className={`px-6 py-3 rounded-full font-semibold text-lg transition-all ${
                  selectedCondition === condition.id
                    ? 'bg-purple-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{condition.icon}</span>
                {condition.name}
              </button>
            ))}
          </div>

          {/* Selected Condition Details */}
          {conditions.filter(c => c.id === selectedCondition).map((condition) => (
            <div key={condition.id} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-3xl p-8 lg:p-12">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    {condition.name} Treatment
                  </h3>
                  <p className="text-xl text-gray-700 mb-6">
                    {condition.description}
                  </p>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Prescribed by licensed physicians</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">FDA-approved medications</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Discreet packaging & delivery</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-4 mb-8">
                    <span className="text-3xl font-bold text-purple-600">{condition.price}</span>
                    <span className="text-gray-600">Free shipping</span>
                  </div>
                  <Link href="/patient/new-consultation"
                    className="inline-block bg-purple-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-purple-700 transform hover:scale-105 transition-all shadow-lg">
                    Get Started →
                  </Link>
                </div>
                <div className="relative">
                  <div className="aspect-square bg-gradient-to-br from-purple-200 to-indigo-200 rounded-3xl flex items-center justify-center">
                    <span className="text-6xl">{condition.icon}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600">
              Get treatment in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-purple-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Online Consultation</h3>
              <p className="text-gray-600">
                Complete a quick health questionnaire and consult with a licensed physician online
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Get Prescribed</h3>
              <p className="text-gray-600">
                If appropriate, receive a personalized treatment plan from a licensed physician
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delivered to You</h3>
              <p className="text-gray-600">
                Medications shipped directly to your door in discreet packaging
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/patient/new-consultation"
              className="inline-block bg-purple-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-purple-700 transform hover:scale-105 transition-all shadow-lg">
              Start Your Free Consultation
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What our customers say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "The process was so easy! Got my prescription in 2 days and the results have been amazing."
              </p>
              <p className="font-semibold text-gray-900">- John D.</p>
              <p className="text-sm text-gray-600">Hair Loss Treatment</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Discreet, professional, and effective. Exactly what I was looking for."
              </p>
              <p className="font-semibold text-gray-900">- Michael R.</p>
              <p className="text-sm text-gray-600">ED Treatment</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Finally found a weight loss solution that works. Down 20 lbs in 3 months!"
              </p>
              <p className="font-semibold text-gray-900">- Sarah K.</p>
              <p className="text-sm text-gray-600">Weight Loss Program</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start your journey to better health
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join 500,000+ customers who have taken control of their health
          </p>
          <Link href="/patient/new-consultation"
            className="inline-block bg-white text-purple-600 px-8 py-4 rounded-full text-lg font-bold hover:shadow-2xl transform hover:scale-105 transition-all">
            Get Started - It's Free
          </Link>
          <p className="text-white/80 text-sm mt-4">
            No commitment required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">How It Works</a></li>
                <li><a href="#" className="hover:text-white">Reviews</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Treatments</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Hair Loss</a></li>
                <li><a href="#" className="hover:text-white">ED Treatment</a></li>
                <li><a href="#" className="hover:text-white">Weight Loss</a></li>
                <li><a href="#" className="hover:text-white">Mental Health</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">HIPAA Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 TeleHealth Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
