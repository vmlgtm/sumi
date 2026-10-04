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
