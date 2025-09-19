'use client';

import { useEffect, useState } from 'react';

interface NotificationPopupProps {
  message: { type: 'success' | 'error'; text: string } | null;
  onClose: () => void;
  duration?: number;
}

export default function NotificationPopup({ message, onClose, duration = 3000 }: NotificationPopupProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (message && duration > 0) {
      // Reset progress when new message appears
      setProgress(100);
      
      // Start countdown
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      // Update progress bar
      const interval = setInterval(() => {
        setProgress(prev => {
          const next = prev - (100 / (duration / 100));
          return next > 0 ? next : 0;
        });
      }, 100);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:max-w-md z-50 animate-fade-in">
      <div className={`
        relative overflow-hidden rounded-lg shadow-lg transform transition-all duration-300 p-4 border
        ${message.type === 'success' 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
        }
      `}>
        <div className="flex items-center">
          {/* Icon */}
          {message.type === 'success' ? (
            <svg className="w-5 h-5 flex-shrink-0 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0 mr-2 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          
          {/* Message */}
          <p className={`font-medium flex-1 ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.text}
          </p>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className={`ml-2 p-1 rounded transition-colors ${
              message.type === 'success' ? 'hover:bg-green-100' : 'hover:bg-red-100'
            }`}
            aria-label="Close notification"
          >
            <svg className={`w-4 h-4 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Progress bar */}
        <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
          message.type === 'success' ? 'bg-green-200' : 'bg-red-200'
        }`}>
          <div 
            className={`h-full transition-all duration-100 ease-linear ${
              message.type === 'success' ? 'bg-green-400' : 'bg-red-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}