'use client';

import Link from 'next/link';

interface NextStepHeroProps {
  action?: {
    type: 'medication' | 'checkin' | 'refill' | 'appointment';
    title: string;
    subtitle: string;
    actionUrl: string;
    actionLabel: string;
    secondaryActionLabel?: string;
  };
}

export default function NextStepHero({ action }: NextStepHeroProps) {
  // Default action if none provided
  const defaultAction = {
    type: 'checkin' as const,
    title: 'Health Check-in Available',
    subtitle: 'Update your progress and symptoms',
    actionUrl: '/patient/refill-checkin',
    actionLabel: 'Start Check-in',
    secondaryActionLabel: undefined,
  };

  const currentAction = action || defaultAction;

  const getIcon = (type: string) => {
    switch (type) {
      case 'medication':
        return '💊';
      case 'checkin':
        return '📋';
      case 'refill':
        return '🔄';
      case 'appointment':
        return '👨‍⚕️';
      default:
        return '✨';
    }
  };

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm border-l-4 border-l-coral-500">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl">
            {getIcon(currentAction.type)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-600 uppercase tracking-wide mb-1">
            Your Next Step
          </p>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {currentAction.title}
          </h2>
          <p className="text-slate-700 mb-4">
            {currentAction.subtitle}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={currentAction.actionUrl}
              className="inline-flex items-center justify-center px-6 py-3 bg-coral-500 text-white text-base font-medium rounded-xl hover:bg-coral-600 transition-colors shadow-sm"
            >
              {currentAction.actionLabel}
            </Link>
            
            {currentAction.secondaryActionLabel && (
              <button className="inline-flex items-center justify-center px-6 py-3 bg-white text-coral-500 text-base font-medium rounded-xl hover:bg-coral-50 transition-colors border-2 border-coral-500">
                {currentAction.secondaryActionLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
