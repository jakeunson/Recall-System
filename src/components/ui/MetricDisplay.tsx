'use client';

import React from 'react';

interface MetricDisplayProps {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    changeValue: number;
  };
  showProgressBar?: boolean;
}

export default function MetricDisplay({
  label,
  value,
  max = 100,
  unit = '%',
  trend,
  showProgressBar = true,
}: MetricDisplayProps) {
  // PRD Color Mapping: 80+ success, 60+ accent, 40+ warning, <40 danger
  const getMetricColor = (val: number) => {
    if (val >= 80) return 'var(--success)';
    if (val >= 60) return 'var(--accent)';
    if (val >= 40) return 'var(--warning)';
    return 'var(--danger)';
  };

  const color = getMetricColor(value);
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="fade-in" style={{
      background: 'var(--bg-3)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      cursor: 'default',
      transition: 'border-color 0.2s ease'
    }}
    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-2)'}
    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Metric Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="mono" style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>

        {/* Trend Indicator */}
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {trend.direction === 'up' && (
              <span className="mono" style={{ color: 'var(--success)', fontSize: '11px', fontWeight: 700 }}>
                ▲ +{trend.changeValue}%
              </span>
            )}
            {trend.direction === 'down' && (
              <span className="mono" style={{ color: 'var(--danger)', fontSize: '11px', fontWeight: 700 }}>
                ▼ -{trend.changeValue}%
              </span>
            )}
            {trend.direction === 'stable' && (
              <span className="mono" style={{ color: 'var(--text-3)', fontSize: '11px', fontWeight: 600 }}>
                ■ STABLE
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Metric Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span className="mono" style={{
          fontSize: '28px',
          fontWeight: 700,
          color: color,
          letterSpacing: '-0.05em'
        }}>
          {value.toFixed(1)}
        </span>
        <span className="mono" style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: 500 }}>
          {unit}
        </span>
        <span className="mono" style={{ fontSize: '11px', color: 'var(--text-3)', marginLeft: 'auto' }}>
          BASE_MAX: {max.toFixed(0)}
        </span>
      </div>

      {/* Metric Horizontal Progress Bar */}
      {showProgressBar && (
        <div style={{
          height: '4px',
          width: '100%',
          backgroundColor: '#040406',
          border: '1px solid var(--border)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: color,
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
        </div>
      )}
    </div>
  );
}
