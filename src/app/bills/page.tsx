'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MOCK_BILL_THREADS } from '@/lib/mock-data';
import { BillReply } from '@/lib/types';

export default function BillListPage() {
  const [threads, setThreads] = useState(MOCK_BILL_THREADS);

  // 로컬스토리지에 있는 법안 통계 데이터 결합 (필요 시)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedReplies = localStorage.getItem('user_bill_replies');
      if (savedReplies) {
        try {
          const parsed = JSON.parse(savedReplies) as BillReply[];
          // 각 법안의 댓글 수 가산 동기화
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
    <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* ── Header ── */}
      <div style={{ marginBottom: '40px' }} className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span className="badge badge-accent">법안 합의 지표</span>
          <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>제5단계</span>
        </div>
        <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 600, color: 'var(--text-1)', marginBottom: '12px', letterSpacing: '-0.02em' }}>
          법안 합의 토론방
        </h1>
        <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-2)', lineHeight: 1.6, maxWidth: '800px' }}>
          국회에 발의된 법률 개정안의 신구 조문 개정 사항을 직관적인 조문 차이(Diff)로 비교하고, 
          감정적 비난을 제어한 채 **오직 근거와 출처**를 기반으로 합의점과 타당성을 도출하는 이성적 토론 공간입니다.
        </p>
      </div>

      {/* ── Bill Thread Grid ── */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', 
          gap: '24px' 
        }}
        className="fade-in"
      >
        {threads.map((thread, idx) => {
          // 합의도에 따른 색상 정의
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
                minHeight: '260px',
                animationDelay: `${idx * 0.05}s`
              }}
            >
              <div>
                {/* Upper Metadata */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: 'var(--font-xs)', 
                    fontWeight: 700, 
                    color: 'var(--accent)',
                    backgroundColor: 'var(--accent-bg)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--accent-border)'
                  }}>
                    {thread.billCode}
                  </span>
                  
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    등록일 {new Date(thread.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                {/* Bill Title */}
                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--text-1)', marginBottom: '10px', lineHeight: 1.4 }}>
                  {thread.billTitle}
                </h3>

                {/* Bill Summary */}
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '24px' }}>
                  {thread.billSummary}
                </p>
              </div>

              {/* Consensus Level Bar & Footer Actions */}
              <div>
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-2)' }}>시민 입법 합의도</span>
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: consensusColor, fontFamily: 'var(--font-mono)' }}>
                      {thread.consensusScore}% 합의율
                    </span>
                  </div>
                  
                  {/* Consensus ProgressBar Background */}
                  <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    backgroundColor: 'var(--bg-3)', 
                    borderRadius: '4px',
                    overflow: 'hidden',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ 
                      width: `${thread.consensusScore}%`, 
                      height: '100%', 
                      backgroundColor: consensusColor,
                      borderRadius: '4px',
                      transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', fontWeight: 600 }}>
                    🗣️ 구조적 변론 댓글 {thread.replyCount}건
                  </span>

                  <Link href={`/bills/${thread.id}`} className="btn-primary" style={{ padding: '8px 16px', fontSize: 'var(--font-xs)' }}>
                    조문비교 & 토론참여 →
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
