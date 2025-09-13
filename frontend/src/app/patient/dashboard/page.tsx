'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PatientDashboard() {
  const [activeProgramIndex, setActiveProgramIndex] = useState(0);
  
  const programs = [
    {
      id: 1,
      name: 'Weight Loss',
      medication: 'Semaglutide',
      dose: '0.5mg weekly',
      nextDose: 'Tomorrow',
      refillsLeft: 3,
      status: 'active'
    },
    {
      id: 2,
      name: 'Hair Growth',
      medication: 'Finasteride',
      dose: '1mg daily',
      nextDose: 'Today',
      refillsLeft: 5,
      status: 'active'
    }
  ];

  const activeProgram = programs[activeProgramIndex];

  const shipmentSteps = [
    { label: 'Provider Review', completed: true },
    { label: 'Prescription Processed', completed: true },
    { label: 'Shipped', completed: true },
    { label: 'Delivered', completed: false }
  ];

  const weightData = [
    { date: '12/1', weight: 185 },
    { date: '12/8', weight: 183 },
    { date: '12/15', weight: 182 },
    { date: '12/22', weight: 180 },
    { date: '12/29', weight: 178 }
  ];

  const recentOrders = [
    { id: '001234', date: 'Dec 5, 2024', items: 'Semaglutide (4 week supply)', status: 'shipped', amount: 149.00 },
    { id: '001233', date: 'Nov 5, 2024', items: 'Semaglutide (4 week supply)', status: 'delivered', amount: 149.00 },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <div className="flex items-center gap-4 mb-4">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=health" 
            alt="Your Health Assistant"
            className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-sm"
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back, John!</h1>
            <p className="text-slate-600">Your care team is here to help you on your journey.</p>
          </div>
        </div>
        
        {/* Program Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {programs.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setActiveProgramIndex(i)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                i === activeProgramIndex
                  ? "border-medical-600 bg-medical-50 text-medical-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Main Column */}
        <div className="lg:col-span-3 space-y-8">
          {/* Program Summary Card */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <h2 className="text-base font-semibold text-slate-900">{activeProgram.name} Program</h2>
            </header>
            <div className="space-y-4 p-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">{activeProgram.medication}</h3>
                <p className="text-sm text-slate-600">{activeProgram.dose}</p>
              </div>

              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-slate-500">Next dose due</p>
                  <p className="font-bold text-medical-600">{activeProgram.nextDose}</p>
                </div>
                <div>
                  <p className="text-slate-500">Refills left</p>
                  <p className="font-bold text-emerald-600">{activeProgram.refillsLeft}</p>
                </div>
              </div>

              {/* Today's Dose Logger */}
              {activeProgram.nextDose === 'Today' && (
                <div className="mt-4 p-4 bg-medical-50 rounded-lg">
                  <p className="font-semibold text-slate-800">Your dose is scheduled for today.</p>
                  <p className="text-sm text-slate-600 mb-3">Did you take your medication?</p>
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-medical-600 text-white font-semibold text-sm py-2 px-3 rounded-md hover:bg-medical-700 transition-colors">
                      Yes, I took it
                    </button>
                    <button className="flex-1 bg-slate-200 text-slate-700 font-semibold text-sm py-2 px-3 rounded-md hover:bg-slate-300 transition-colors">
                      I need to skip it
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button className="rounded-lg bg-medical-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-medical-700">
                  View dosing
                </button>
                <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
                  Request refill
                </button>
              </div>
            </div>
          </section>

          {/* Shipment Status */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <h2 className="text-base font-semibold text-slate-900">Shipment status</h2>
            </header>
            <ol className="p-5">
              {shipmentSteps.map((step, idx) => (
                <li key={idx} className="flex items-center gap-2 py-1 text-sm">
                  <span className={`h-3 w-3 rounded-full ${step.completed ? "bg-emerald-500" : "bg-slate-300"}`} />
                  <span className={`${step.completed ? "text-slate-900" : "text-slate-400"}`}>{step.label}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Progress Tracker (for Weight Loss) */}
          {activeProgram.name === 'Weight Loss' && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                <h2 className="text-base font-semibold text-slate-900">Progress Tracker</h2>
              </header>
              <div className="p-5">
                <p className="text-sm text-slate-500 mb-4">Your weight progress (lbs)</p>
                
                {/* Simple Chart Placeholder */}
                <div className="h-40 mb-4 bg-gradient-to-t from-medical-50 to-white rounded-lg p-4">
                  <div className="flex items-end justify-between h-full">
                    {weightData.map((data, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div 
                          className="w-8 bg-medical-500 rounded-t"
                          style={{ height: `${(185 - data.weight) * 8}px` }}
                        />
                        <span className="text-xs text-slate-500 mt-2">{data.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <form className="flex space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Enter today's weight"
                    className="flex-grow w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-medical-500 focus:border-medical-500"
                  />
                  <button
                    type="submit"
                    className="bg-medical-600 text-white font-semibold text-sm py-2 px-4 rounded-md hover:bg-medical-700 transition-colors"
                  >
                    Log
                  </button>
                </form>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
          <section className="grid grid-cols-1 gap-3">
            <Link href="/patient/messages" className="rounded-2xl border border-slate-200 bg-gradient-to-br from-medical-50 to-white p-4 text-left shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm font-medium text-medical-700">Message care team</div>
              <div className="text-xs text-slate-600">Ask a question or share an update.</div>
            </Link>
            <button className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-4 text-left shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm font-medium text-emerald-700">Track package</div>
              <div className="text-xs text-slate-600">See where your order is right now.</div>
            </button>
          </section>

          {/* Recent Orders */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <h2 className="text-base font-semibold text-slate-900">Recent Orders</h2>
            </header>
            <ul className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <li key={order.id} className="px-5 py-3">
                  <div className="flex justify-between items-start">
                    <div className="text-sm">
                      <p className="font-medium text-slate-900">#{order.id}</p>
                      <p className="text-slate-500">{order.items}</p>
                      <p className="text-xs text-slate-400 mt-1">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">${order.amount.toFixed(2)}</p>
                      <span className={`text-xs font-medium ${
                        order.status === 'delivered' ? 'text-emerald-600' : 'text-blue-600'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Action Items */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <h2 className="text-base font-semibold text-slate-900">Action items</h2>
            </header>
            <ul className="divide-y divide-slate-100">
              <li className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-slate-500 line-through">Complete health assessment</span>
              </li>
              <li className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-white">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-slate-700">Upload insurance information</span>
              </li>
              <li className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-white">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-slate-700">Schedule follow-up consultation</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
