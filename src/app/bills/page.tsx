'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MOCK_BILL_THREADS } from '@/lib/mock-data';
import { BillReply } from '@/lib/types';
import Tooltip from '@/components/custom/Tooltip';

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
      <section className="bg-secondary border border-border rounded-md px-7 py-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-success text-sm">법안 토론</span>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">
          개정 법안 토론장
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[700px]">
          국회에 발의된 법률 개정안의 주요 내용을 확인하고 의견을 나눠보세요.
          감정적인 비난을 지양하고, 근거와 출처를 바탕으로 건설적인 합의점을 찾아가는 공간입니다.
        </p>
      </section>

      {/* ── Bill Thread Grid ── */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-5">
        {threads.map((thread, idx) => {
          let consensusColorText = 'text-warning';
          let consensusColorBg = 'bg-warning';
          if (thread.consensusScore >= 80) {
            consensusColorText = 'text-success';
            consensusColorBg = 'bg-success';
          } else if (thread.consensusScore < 50) {
            consensusColorText = 'text-danger';
            consensusColorBg = 'bg-danger';
          }

          return (
            <div 
              key={thread.id}
              className="card-base flex flex-col justify-between p-6"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold text-muted-foreground bg-card px-2.5 py-1 rounded-full">
                    {thread.billCode}
                  </span>
                  
                  <span className="text-xs text-muted-foreground">
                    등록일: {new Date(thread.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                <Link href={`/bills/${thread.id}`} className="group block">
                  <h3 className="text-lg font-bold text-foreground mb-3 leading-snug transition-colors group-hover:text-accent">
                    {thread.billTitle}
                  </h3>
                </Link>

                <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-3">
                  {thread.billSummary}
                </p>
              </div>

              <div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <Tooltip
                      content={`여론 합의도 = 시민 직접 투표 기반 찬성\n80% 이상: 높은 합의 (✅ 녹색)\n50~79%: 부분 합의 (⚠️ 주황)\n50% 미만: 높은 갈등 (❌ 빨간)`}
                      width={250}
                    >
                      <span className="text-xs font-semibold text-muted-foreground cursor-help">
                        여론 합의도 ⓘ
                      </span>
                    </Tooltip>
                    <span className={`text-xs font-bold ${consensusColorText}`}>
                      {thread.consensusScore}% 찬성
                    </span>
                  </div>
                  
                  <div className="w-full h-1.5 bg-card rounded-sm overflow-hidden">
                    <div 
                      className={`h-full rounded-sm ${consensusColorBg}`}
                      style={{ width: `${thread.consensusScore}%` }} 
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground font-medium">
                    💬 댓글 {thread.replyCount}개
                  </span>

                  <Link href={`/bills/${thread.id}`} className="btn-secondary px-4 py-2 text-xs">
                    조문 확인 및 토론 →
                  </Link>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
