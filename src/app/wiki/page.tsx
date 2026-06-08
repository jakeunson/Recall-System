'use client';

import React from 'react';
import BoardList from '@/components/custom/BoardList';
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
    <div className="flex flex-col gap-6 fade-in">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground mb-2">입법 위키</h1>
          <p className="text-sm text-muted-foreground">법안의 조문 변경 내역을 확인하고 수정 제안을 할 수 있습니다.</p>
        </div>
        <button className="btn-primary px-5 py-3 text-sm font-semibold">
          새 법안 제안
        </button>
      </div>

      <BoardList posts={posts} basePath="/wiki" />
    </div>
  );
}
