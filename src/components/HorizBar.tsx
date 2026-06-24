'use client';

import React from 'react';

export default function HorizBar({ value, max = 100, color = 'var(--accent)' }: { value: number, max?: number, color?: string }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-1000 ease-out" 
        style={{ width: `${percent}%`, backgroundColor: color }} 
      />
    </div>
  );
}
