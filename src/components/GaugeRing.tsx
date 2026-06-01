'use client';

import React from 'react';

interface GaugeRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  color?: string;
}

export default function GaugeRing({
  value,
  size = 100,
  strokeWidth = 8,
  label = '신뢰도',
  color = 'var(--accent)',
}: GaugeRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  // Determine color based on value if not explicitly provided as a custom CSS var
  const getStatusColor = (val: number) => {
    if (val >= 80) return 'var(--success)';
    if (val >= 60) return 'var(--accent)';
    if (val >= 40) return 'var(--warning)';
    return 'var(--danger)';
  };

  const ringColor = color.startsWith('var') ? color : getStatusColor(value);

  return (
    <div className="gauge-container" style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="gauge-text" style={{ position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
        <span className="mono" style={{ fontSize: size * 0.22, fontWeight: 700, color: ringColor }}>
          {value}
        </span>
        <span style={{ fontSize: size * 0.1, color: 'var(--text-2)', marginTop: -2 }}>
          {label}
        </span>
      </div>
    </div>
  );
}
