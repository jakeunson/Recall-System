'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, unit, sub, accent }: StatCardProps) {
  return (
    <div className="card-base" style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px',
      backgroundColor: accent ? 'var(--accent)' : 'var(--bg-2)',
      color: accent ? '#ffffff' : 'var(--text-1)',
      border: accent ? 'none' : '1px solid var(--border)',
    }}>
      <div style={{
        fontSize: 'var(--font-sm)',
        color: accent ? 'rgba(255,255,255,0.7)' : 'var(--text-2)',
        fontWeight: 600,
        marginBottom: '12px',
      }}>
        {label}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
        <span style={{
          fontSize: '28px',
          fontWeight: 800,
          letterSpacing: '-0.03em',
        }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span style={{
            fontSize: 'var(--font-sm)',
            fontWeight: 600,
            color: accent ? 'rgba(255,255,255,0.8)' : 'var(--text-3)',
          }}>
            {unit}
          </span>
        )}
      </div>

      {sub && (
        <div style={{
          fontSize: '12px',
          color: accent ? 'rgba(255,255,255,0.6)' : 'var(--text-3)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {sub}
        </div>
      )}
    </div>
  );
}
