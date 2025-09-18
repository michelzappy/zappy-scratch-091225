'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [selectedCondition, setSelectedCondition] = useState<string>('weightLoss');

  const conditions = [
    {
      id: 'weightLoss',
      name: 'Weight Loss',
      icon: '⚖️',
      description: 'Medical weight loss that works',
      price: 'From $99/month',
      image: '/weight.jpg'
    },
    {
      id: 'hairLoss',
      name: 'Hair Loss',
      icon: '💇',
      description: 'FDA-approved treatments that actually work',
      price: 'From $22/month',
      image: '/hair-loss.jpg'
    },
    {
      id: 'mensHealth',
      name: "Men's Health",
      icon: '👨‍⚕️',
      description: 'Effective treatments delivered discreetly',
      price: 'From $2/dose',
      image: '/ed.jpg'
    },
    {
      id: 'womensHealth',
      name: "Women's Health",
      icon: '👩‍⚕️',
      description: 'Comprehensive women\'s health care',
      price: 'From $30/month',
      image: '/womens.jpg'
    },
    {
      id: 'longevity',
      name: 'Longevity',
      icon: '🧬',
      description: 'Optimize your healthspan',
      price: 'From $150/month',
      image: '/longevity.jpg'
    },
    {
      id: 'trt',
      name: 'Testosterone',
      icon: '💪',
      description: 'Expert TRT treatment',
      price: 'From $99/month',
      image: '/trt.jpg'
    }
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section - Using Zappy colors */}
      <section className="relative overflow-hidden bg-white">
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
              Your health,<br />
              <span className="text-zappy-pink">delivered</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Get personalized treatment for weight loss, hair loss, men's health & more. 
              100% online, prescribed by real doctors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <a href="#conditions" 
                className="inline-block bg-zappy-pink text-white px-8 py-4 rounded-full text-lg font-bold hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
                Start Free Consultation
              </a>
              <a href="#how-it-works" 
                className="inline-block bg-transparent border-2 border-zappy-pink text-zappy-pink px-8 py-4 rounded-full text-lg font-bold hover:bg-zappy-light-yellow transition-all duration-200">
                How It Works
              </a>
            </div>
            <p className="text-gray-500 text-sm mb-8">
              ✓ Free online consultation &nbsp;&nbsp; ✓ Free 2-day shipping &nbsp;&nbsp; ✓ Cancel anytime
            </p>
            
            {/* Quick Access Portal Buttons */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <p className="text-gray-500 text-sm mb-4">Healthcare Professional Access</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/portal/login" 
                  className="inline-block bg-gray-50 text-gray-700 border border-gray-300 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-all">
                  🏥 Staff Portal Login
                </Link>
                <Link href="/patient/login" 
                  className="inline-block bg-gray-50 text-gray-700 border border-gray-300 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-all">
                  👤 Patient Portal Login
                </Link>
              </div>
              <p className="text-gray-400 text-xs mt-3">
                Healthcare providers and administrators use the unified Staff Portal
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-12 bg-zappy-light-yellow/30 border-y border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-3xl font-bold text-zappy-pink mb-2">500K+</h3>
              <p className="text-gray-700 font-medium">Happy Customers</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-zappy-pink mb-2">50</h3>
              <p className="text-gray-700 font-medium">States Covered</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-zappy-pink mb-2">4.8★</h3>
              <p className="text-gray-700 font-medium">Average Rating</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-zappy-pink mb-2">24/7</h3>
              <p className="text-gray-700 font-medium">Support Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Conditions Section */}
      <section id="conditions" className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
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
                    ? 'bg-zappy-pink text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{condition.icon}</span>
                {condition.name}
              </button>
            ))}
          </div>

          {/* Selected Condition Details */}
          {selectedCondition && conditions.filter(c => c.id === selectedCondition).map((condition) => (
            <div key={condition.id} className="bg-zappy-light-yellow/30 rounded-3xl p-8 lg:p-12 border border-zappy-pink/20">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-4">
                    {condition.name} Treatment
                  </h3>
                  <p className="text-xl text-gray-700 mb-6">
                    {condition.description}
                  </p>
                  <div className="space-y-4 mb-8">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700">Prescribed by licensed physicians</span>
            </div>
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">FDA-approved medications</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Discreet packaging & delivery</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-4 mb-8">
                    <span className="text-3xl font-bold text-zappy-pink">{condition.price}</span>
                    <span className="text-gray-600">Free shipping</span>
                  </div>
                  <Link href={`/patient/health-quiz?condition=${condition.id}`}
                    className="inline-block bg-zappy-pink text-white px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transition-all shadow-lg">
                    Get Started →
                  </Link>
                </div>
                <div className="relative">
                  <div className="aspect-square bg-zappy-light-yellow rounded-3xl flex items-center justify-center border-2 border-zappy-pink/20">
                    <span className="text-6xl">{condition.icon}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600">
              Get treatment in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-zappy-light-yellow rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-zappy-pink/30">
                <span className="text-3xl font-bold text-zappy-pink">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Online Consultation</h3>
              <p className="text-gray-600">
                Complete a quick health questionnaire and consult with a licensed physician online
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-zappy-light-yellow rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-zappy-pink/30">
                <span className="text-3xl font-bold text-zappy-pink">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Get Prescribed</h3>
              <p className="text-gray-600">
                If appropriate, receive a personalized treatment plan from a licensed physician
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-zappy-light-yellow rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-zappy-pink/30">
                <span className="text-3xl font-bold text-zappy-pink">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delivered to You</h3>
              <p className="text-gray-600">
                Medications shipped directly to your door in discreet packaging
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <a href="#conditions"
              className="inline-block bg-zappy-pink text-white px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transition-all shadow-lg">
              Choose Your Consultation
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              What our customers say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="flex mb-4" role="img" aria-label="5 star rating">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="flex mb-4" role="img" aria-label="5 star rating">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Discreet, professional, and effective. Exactly what I was looking for."
              </p>
              <p className="font-semibold text-gray-900">- Michael R.</p>
              <p className="text-sm text-gray-600">Men's Health Treatment</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
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
      <section className="py-16 lg:py-24 bg-zappy-light-yellow/30 border-t border-zappy-pink/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Start your journey to better health
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join 500,000+ customers who have taken control of their health
          </p>
          <a href="#conditions"
            className="inline-block bg-zappy-pink text-white px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transition-all shadow-lg">
            Get Started - It's Free
          </a>
          <p className="text-gray-500 text-sm mt-4">
            No commitment required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4 text-zappy-pink">Zappy</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">How It Works</a></li>
                <li><a href="#" className="hover:text-white">Reviews</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Treatments</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Weight Loss</a></li>
                <li><a href="#" className="hover:text-white">Hair Loss</a></li>
                <li><a href="#" className="hover:text-white">Men's Health</a></li>
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
            <p>&copy; 2025 Zappy Health. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
