import React from 'react';

export const Icon: React.FC<{ d: string; className?: string; strokeWidth?: number }> = ({
  d,
  className = 'w-4 h-4',
  strokeWidth = 2,
}) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={d} />
  </svg>
);

export const SumiLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3.5 C10.3 6.5 7 11 7 15 A5 5 0 0 0 17 15 C17 11 13.7 6.5 12 3.5 Z" />
  </svg>
);

