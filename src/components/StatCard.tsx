'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({
  label,
  value,
  unit,
  sub,
  accent = false,
}: StatCardProps) {
  return (
    <div className="card-base" style={{
      background: 'var(--bg-3)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      cursor: 'default'
    }}>
      <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span className="mono" style={{ 
          fontSize: '28px', 
          fontWeight: 700, 
          color: accent ? 'var(--accent)' : 'var(--text-1)' 
        }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: '14px', color: 'var(--text-2)' }}>
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>
          {sub}
        </span>
      )}
    </div>
  );
}
