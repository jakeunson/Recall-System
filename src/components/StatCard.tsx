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
    <div className="card-base flex flex-col justify-between" style={{
      padding: '24px',
      backgroundColor: accent ? 'var(--accent)' : 'var(--bg)',
      color: accent ? '#ffffff' : 'var(--text-1)',
      border: accent ? '1px solid var(--accent)' : '1px solid var(--border)',
      borderRadius: '12px',
      boxShadow: accent ? '0 4px 14px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.02)',
    }}>
      <div style={{
        fontSize: 'var(--font-sm)',
        color: accent ? 'rgba(255,255,255,0.7)' : 'var(--text-2)',
        fontWeight: 600,
        marginBottom: '16px',
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
