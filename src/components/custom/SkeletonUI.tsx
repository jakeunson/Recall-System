'use client';

import React from 'react';

export const SkeletonText = ({
  width = '100%',
  height = '14px',
  marginBottom = '8px',
  radius = 'var(--radius-sm)'
}: {
  width?: string;
  height?: string;
  marginBottom?: string;
  radius?: string;
}) => {
  return (
    <div
      className="skeleton-pulse"
      style={{
        width,
        height,
        marginBottom,
        borderRadius: radius,
        backgroundColor: 'var(--bg-3)',
      }}
    />
  );
};

export const SkeletonCard = ({
  height = '180px',
  padding = '20px',
  children
}: {
  height?: string;
  padding?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      style={{
        height,
        padding,
        backgroundColor: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {children || (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <div>
            <SkeletonText width="30%" height="16px" marginBottom="12px" />
            <SkeletonText width="90%" height="12px" />
            <SkeletonText width="75%" height="12px" />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <SkeletonText width="60px" height="24px" marginBottom="0" />
            <SkeletonText width="60px" height="24px" marginBottom="0" />
          </div>
        </div>
      )}
      <style>{`
        @keyframes skeletonPulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.95; }
          100% { opacity: 0.6; }
        }
        .skeleton-pulse {
          animation: skeletonPulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export const SkeletonChart = () => {
  return (
    <SkeletonCard height="280px">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
        <SkeletonText width="40%" height="16px" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '10px 20px', gap: '12px' }}>
          <div className="skeleton-pulse" style={{ width: '12%', height: '30%', backgroundColor: 'var(--bg-3)', borderRadius: '2px' }} />
          <div className="skeleton-pulse" style={{ width: '12%', height: '75%', backgroundColor: 'var(--bg-3)', borderRadius: '2px' }} />
          <div className="skeleton-pulse" style={{ width: '12%', height: '50%', backgroundColor: 'var(--bg-3)', borderRadius: '2px' }} />
          <div className="skeleton-pulse" style={{ width: '12%', height: '90%', backgroundColor: 'var(--bg-3)', borderRadius: '2px' }} />
          <div className="skeleton-pulse" style={{ width: '12%', height: '60%', backgroundColor: 'var(--bg-3)', borderRadius: '2px' }} />
          <div className="skeleton-pulse" style={{ width: '12%', height: '40%', backgroundColor: 'var(--bg-3)', borderRadius: '2px' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <SkeletonText width="20%" height="10px" marginBottom="0" />
          <SkeletonText width="20%" height="10px" marginBottom="0" />
          <SkeletonText width="20%" height="10px" marginBottom="0" />
        </div>
      </div>
    </SkeletonCard>
  );
};
