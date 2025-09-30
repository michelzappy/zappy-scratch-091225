'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  progress: number; // 0-100
  nextDose?: string;
}

interface Milestone {
  id: string;
  type: 'checkin' | 'refill' | 'appointment' | 'goal';
  title: string;
  date: string;
  completed: boolean;
  description?: string;
}

interface TreatmentGoal {
  id: string;
  title: string;
  target: string;
  current: string;
  progress: number; // 0-100
  unit: string;
}

export default function TreatmentPlanDashboard() {
  // Mock data - in production, this would come from API
  const [medications] = useState<Medication[]>([
    {
      id: '1',
      name: 'Semaglutide',
      dosage: '0.5mg',
      frequency: 'Weekly injection',
      startDate: '2024-01-15',
      progress: 60,
      nextDose: 'Tomorrow, 9:00 AM'
    },
    {
      id: '2',
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      startDate: '2024-01-15',
      progress: 85,
      nextDose: 'Today, 6:00 PM'
    }
  ]);

  const [milestones] = useState<Milestone[]>([
    {
      id: '1',
      type: 'checkin',
      title: 'Monthly Health Check-in',
      date: '2024-02-15',
      completed: false,
      description: 'Update weight, side effects, progress'
    },
    {
      id: '2',
      type: 'refill',
      title: 'Medication Refill',
      date: '2024-02-10',
      completed: false,
      description: 'Order next month\'s supply'
    },
    {
      id: '3',
      type: 'goal',
      title: 'Weight Goal Milestone',
      date: '2024-02-28',
      completed: false,
      description: 'Target: 10 lbs lost'
    },
    {
      id: '4',
      type: 'checkin',
      title: 'Initial Consultation',
      date: '2024-01-15',
      completed: true,
      description: 'Treatment plan started'
    }
  ]);

  const [goals] = useState<TreatmentGoal[]>([
    {
      id: '1',
      title: 'Weight Loss',
      target: '180',
      current: '210',
      progress: 33,
      unit: 'lbs'
    },
    {
      id: '2',
      title: 'A1C Level',
      target: '5.7',
      current: '6.2',
      progress: 50,
      unit: '%'
    }
  ]);

  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'checkin':
        return '📋';
      case 'refill':
        return '🧴';
      case 'appointment':
        return '👨‍⚕️';
      case 'goal':
        return '🎯';
      default:
        return '📅';
    }
  };

  const getMilestoneColor = (completed: boolean) => {
    if (completed) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const upcomingMilestones = milestones
    .filter(m => !m.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const completedMilestones = milestones
    .filter(m => m.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">My Treatment Plan</h2>
          <p className="text-sm text-slate-600">Track your medications and progress</p>
        </div>
        <Link 
          href="/patient/consultations/123"
          className="text-sm text-slate-600 hover:text-slate-700 font-medium"
        >
          View Full Plan →
        </Link>
      </div>

      {/* Treatment Goals - Mini Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {goals.map(goal => (
          <div key={goal.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-slate-900">{goal.title}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Current: {goal.current}{goal.unit} → Target: {goal.target}{goal.unit}
                </p>
              </div>
              <span className="text-lg">
                {goal.progress >= 75 ? '🔥' : goal.progress >= 50 ? '💪' : '🎯'}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-slate-600 rounded-full transition-all duration-500"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">{goal.progress}% to goal</p>
          </div>
        ))}
      </div>

      {/* Current Medications */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Current Medications</h3>
        </div>
        <div className="p-4 space-y-3">
          {medications.map(med => (
            <div key={med.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-coral-50 rounded-full flex items-center justify-center">
                <span className="text-lg">🧴</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{med.name}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {med.dosage} • {med.frequency}
                    </p>
                  </div>
                  <span className="text-xs text-slate-600 font-medium">{med.progress}%</span>
                </div>
                
                {med.nextDose && (
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <svg className="w-3 h-3 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700 font-medium">Next: {med.nextDose}</span>
                  </div>
                )}
                
                {/* Mini progress bar */}
                <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-600 rounded-full transition-all"
                    style={{ width: `${med.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline - Upcoming Milestones */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Upcoming Milestones</h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {upcomingMilestones.map((milestone, index) => (
              <div key={milestone.id} className="relative">
                {/* Timeline connector line */}
                {index < upcomingMilestones.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-slate-200" />
                )}
                
                <div className="flex gap-3">
                  {/* Icon circle */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 ${getMilestoneColor(false)}`}>
                    {getMilestoneIcon(milestone.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{milestone.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{milestone.description}</p>
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                        {new Date(milestone.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    
                    {/* Action button for upcoming items */}
                    {milestone.type === 'checkin' && (
                      <Link
                        href="/patient/refill-checkin"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-slate-600 hover:text-slate-700 font-medium"
                      >
                        Complete Now
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                    {milestone.type === 'refill' && (
                      <Link
                        href="/patient/orders"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-slate-600 hover:text-slate-700 font-medium"
                      >
                        Order Refill
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Completed milestones summary */}
          {completedMilestones.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span className="text-sm text-slate-600">
                    {completedMilestones.length} milestone{completedMilestones.length !== 1 ? 's' : ''} completed
                  </span>
                </div>
                <button className="text-xs text-slate-500 hover:text-slate-700">
                  View history
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/patient/refill-checkin"
          className="flex items-center justify-center gap-2 p-3 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">Check-in</span>
        </Link>
        <Link
          href="/patient/messages"
          className="flex items-center justify-center gap-2 p-3 bg-white border-2 border-coral-500 text-coral-500 rounded-xl hover:bg-coral-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm font-medium">Message Provider</span>
        </Link>
      </div>
    </div>
  );
}
