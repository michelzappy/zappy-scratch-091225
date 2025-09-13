import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

const Card: React.FC<CardProps> = ({ title, children, footer, className = '', bodyClassName = '' }) => {
  return (
    <section className={`bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 flex flex-col ${className}`}>
      {title && (
        <header className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        </header>
      )}
      <div className={`p-5 flex-grow ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <footer className="px-5 py-3 bg-slate-50 border-t border-slate-100">
          {footer}
        </footer>
      )}
    </section>
  );
};

export default Card;
