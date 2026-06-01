'use client';

import React from 'react';
import BoardList from '@/components/ui/BoardList';
import { MOCK_BILL_THREADS } from '@/lib/mock-data';

export default function WikiPage() {
  const posts = MOCK_BILL_THREADS.map(t => ({
    id: t.id,
    title: t.billTitle,
    author: '시스템',
    views: t.consensusScore, // just mapping
    likes: t.replyCount,     // just mapping
    createdAt: t.createdAt,
    category: t.billCode,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>입법 위키</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>법안의 조문 변경 내역을 확인하고 수정 제안을 할 수 있습니다.</p>
        </div>
        <button style={{ padding: '10px 20px', backgroundColor: 'var(--text-1)', color: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          새 법안 제안
        </button>
      </div>

      <BoardList posts={posts} basePath="/wiki" />
    </div>
  );
}
