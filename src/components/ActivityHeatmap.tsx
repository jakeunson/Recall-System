'use client';

import React from 'react';

export default function ActivityHeatmap({ data }: { data: { date: string, count: number }[] }) {
  // 간단한 활동 히트맵 목업
  return (
    <div className="flex gap-1 flex-wrap" style={{ maxWidth: '100%' }}>
      {Array.from({ length: 60 }).map((_, i) => {
        const intensity = Math.random();
        const bg = intensity > 0.8 ? 'var(--accent)' : intensity > 0.5 ? 'rgba(24, 24, 27, 0.6)' : intensity > 0.2 ? 'rgba(24, 24, 27, 0.3)' : 'var(--bg-3)';
        return (
          <div key={i} style={{ width: '12px', height: '12px', backgroundColor: bg, borderRadius: '2px' }} />
        );
      })}
    </div>
  );
}
