import React from 'react';

export interface Step {
  name: string;
  status: 'complete' | 'current' | 'upcoming';
  description?: string;
}

interface StepperProps {
  steps: Step[];
  orientation?: 'horizontal' | 'vertical';
}

const Stepper: React.FC<StepperProps> = ({ steps, orientation = 'horizontal' }) => {
  const isHorizontal = orientation === 'horizontal';
  
  return (
    <nav aria-label="Progress">
      <ol role="list" className={`${isHorizontal ? 'space-y-4 md:flex md:space-y-0 md:space-x-8' : 'space-y-4'}`}>
        {steps.map((step, stepIdx) => (
          <li key={step.name} className={isHorizontal ? 'md:flex-1' : ''}>
            {step.status === 'complete' ? (
              <div className={`group flex ${isHorizontal ? 'flex-col border-l-4 border-emerald-500 py-2 pl-4 hover:border-emerald-600 md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0' : 'items-center'}`}>
                {!isHorizontal && (
                  <span className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 group-hover:bg-emerald-600">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
                <div className={isHorizontal ? '' : 'ml-4'}>
                  <span className="text-xs text-emerald-600 font-semibold tracking-wide uppercase group-hover:text-emerald-700">
                    Step {stepIdx + 1}
                  </span>
                  <span className={`${isHorizontal ? 'text-sm' : 'text-base'} font-medium block`}>{step.name}</span>
                  {step.description && (
                    <span className="text-sm text-slate-500">{step.description}</span>
                  )}
                </div>
              </div>
            ) : step.status === 'current' ? (
              <div className={`flex ${isHorizontal ? 'flex-col border-l-4 border-indigo-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0' : 'items-center'}`} aria-current="step">
                {!isHorizontal && (
                  <span className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-indigo-600">
                    <span className="text-indigo-600 font-semibold">{stepIdx + 1}</span>
                  </span>
                )}
                <div className={isHorizontal ? '' : 'ml-4'}>
                  <span className="text-xs text-indigo-600 font-semibold tracking-wide uppercase">
                    Step {stepIdx + 1}
                  </span>
                  <span className={`${isHorizontal ? 'text-sm' : 'text-base'} font-medium text-indigo-600 block`}>{step.name}</span>
                  {step.description && (
                    <span className="text-sm text-slate-500">{step.description}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className={`group flex ${isHorizontal ? 'flex-col border-l-4 border-slate-200 py-2 pl-4 hover:border-slate-300 md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0' : 'items-center'}`}>
                {!isHorizontal && (
                  <span className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-300 group-hover:border-slate-400">
                    <span className="text-slate-500 group-hover:text-slate-700 font-semibold">{stepIdx + 1}</span>
                  </span>
                )}
                <div className={isHorizontal ? '' : 'ml-4'}>
                  <span className="text-xs text-slate-500 font-semibold tracking-wide uppercase group-hover:text-slate-700">
                    Step {stepIdx + 1}
                  </span>
                  <span className={`${isHorizontal ? 'text-sm' : 'text-base'} font-medium text-slate-500 group-hover:text-slate-700 block`}>{step.name}</span>
                  {step.description && (
                    <span className="text-sm text-slate-400 group-hover:text-slate-500">{step.description}</span>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Stepper;
