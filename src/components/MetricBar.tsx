'use client';

import React from 'react';

export default function MetricBar({ label, value, max = 100 }: { label: string, value: number, max?: number }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-end">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-sm font-bold font-mono">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-border/50">
        <div 
          className="h-full bg-accent rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${percent}%` }} 
        />
      </div>
    </div>
  );
}
