'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MOCK_BILL_THREADS } from '@/lib/mock-data';
import { BillReply } from '@/lib/types';
import Tooltip from '@/components/ui/Tooltip';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="fade-in">
      
      {/* ── Header ── */}
      <section style={{
        backgroundColor: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '24px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="badge badge-success" style={{ fontSize: '11px' }}>법안 토론</span>
        </div>
        <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--text-1)', marginBottom: '8px' }}>
          개정 법안 토론장
        </h1>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.6, maxWidth: '700px' }}>
          국회에 발의된 법률 개정안의 주요 내용을 확인하고 의견을 나눠보세요.
          감정적인 비난을 지양하고, 근거와 출처를 바탕으로 건설적인 합의점을 찾아가는 공간입니다.
        </p>
      </section>

      {/* ── Bill Thread Grid ── */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', 
          gap: '20px' 
        }}
      >
        {threads.map((thread, idx) => {
          let consensusColor = 'var(--warning)';
          if (thread.consensusScore >= 80) consensusColor = 'var(--success)';
          else if (thread.consensusScore < 50) consensusColor = 'var(--danger)';

          return (
            <div 
              key={thread.id}
              className="card-base"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px',
                animationDelay: `${idx * 0.05}s`
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 600, 
                    color: 'var(--text-2)',
                    backgroundColor: 'var(--bg-3)',
                    padding: '4px 10px',
                    borderRadius: '16px',
                  }}>
                    {thread.billCode}
                  </span>
                  
                  <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                    등록일: {new Date(thread.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                <Link href={`/bills/${thread.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-1)', marginBottom: '12px', lineHeight: 1.4, transition: 'color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-1)'}
                  >
                    {thread.billTitle}
                  </h3>
                </Link>

                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '24px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {thread.billSummary}
                </p>
              </div>

              <div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <Tooltip
                      content={`여론 합의도 = 시민 직접 투표 기반 쳀성\n80% 이상: 높은 합의 (\u2705 녹색)\n50~79%: 부분 합의 (⚠️ 주황)\n50% 미만: 높은 갈등 (\u274c 빨간)`}
                      width={250}
                    >
                      <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-2)', cursor: 'help' }}>
                        여론 합의도 ⓘ
                      </span>
                    </Tooltip>
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: consensusColor }}>
                      {thread.consensusScore}% 찬성
                    </span>
                  </div>
                  
                  <div style={{ 
                    width: '100%', 
                    height: '6px', 
                    backgroundColor: 'var(--bg-3)', 
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <div style={{ 
                      width: `${thread.consensusScore}%`, 
                      height: '100%', 
                      backgroundColor: consensusColor,
                      borderRadius: '3px',
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-2)', fontWeight: 500 }}>
                    💬 댓글 {thread.replyCount}개
                  </span>

                  <Link href={`/bills/${thread.id}`} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 'var(--font-xs)' }}>
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
