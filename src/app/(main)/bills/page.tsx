'use client';

import React, { useState, useEffect } from 'react';
import { MOCK_BILL_THREADS } from '@/lib/data';
import { BillReply } from '@/lib/types';
import PageHeader from '@/components/custom/PageHeader';
import BillCard from '@/components/custom/BillCard';

export default function BillListPage() {
  const [threads, setThreads] = useState(MOCK_BILL_THREADS);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedReplies = localStorage.getItem('user_bill_replies');
      if (savedReplies) {
        try {
          const parsed = JSON.parse(savedReplies) as BillReply[];
          const updated = MOCK_BILL_THREADS.map((t) => {
            const extraCount = parsed.filter((r) => r.threadId === t.id).length;
            return {
              ...t,
              replyCount: t.replyCount + extraCount,
            };
          });
          setTimeout(() => {
            setThreads(updated);
          }, 0);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  return (
    <div className="flex flex-col gap-6 fade-in">
      
      {/* ── Header ── */}
      <PageHeader 
        badgeText="법안 토론"
        badgeType="success"
        title="개정 법안 토론장"
        description="국회에 발의된 법률 개정안의 주요 내용을 확인하고 의견을 나눠보세요. 감정적인 비난을 지양하고, 근거와 출처를 바탕으로 건설적인 합의점을 찾아가는 공간입니다."
      />

      {/* ── Bill Thread Grid ── */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-5">
        {threads.map((thread, idx) => (
          <BillCard
            key={thread.id}
            id={thread.id}
            billCode={thread.billCode}
            createdAt={thread.createdAt}
            billTitle={thread.billTitle}
            billSummary={thread.billSummary}
            consensusScore={thread.consensusScore}
            replyCount={thread.replyCount}
            index={idx}
          />
        ))}
      </div>
    </div>
  );
}
