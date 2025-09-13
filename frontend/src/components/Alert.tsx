import React from 'react';

interface AlertProps {
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
}

const alertStyles = {
  danger: {
    bg: 'bg-red-50',
    border: 'border-red-400',
    iconColor: 'text-red-500',
    title: 'text-red-800',
    message: 'text-red-700',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    iconColor: 'text-yellow-500',
    title: 'text-yellow-800',
    message: 'text-yellow-700',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    iconColor: 'text-blue-500',
    title: 'text-blue-800',
    message: 'text-blue-700',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-400',
    iconColor: 'text-green-500',
    title: 'text-green-800',
    message: 'text-green-700',
  },
};

const Alert: React.FC<AlertProps> = ({ type, title, message }) => {
  const styles = alertStyles[type];

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <svg className={`h-6 w-6 ${styles.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={`h-6 w-6 ${styles.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className={`h-6 w-6 ${styles.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'success':
        return (
          <svg className={`h-6 w-6 ${styles.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={`border-l-4 p-4 rounded-md ${styles.bg} ${styles.border}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3">
          <h3 className={`text-md font-bold ${styles.title}`}>
            {title}
          </h3>
          <div className={`mt-2 text-sm ${styles.message}`}>
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alert;
