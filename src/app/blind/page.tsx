'use client';

import React from 'react';
import { useQuizzes, useSession } from '@/lib/hooks';
import BlindEvaluationCard from '@/components/ui/BlindEvaluationCard';
import { SkeletonCard } from '@/components/ui/SkeletonUI';
import Link from 'next/link';

export default function BlindQuizListPage() {
  const { session } = useSession();
  const { quizzes, loading } = useQuizzes();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="fade-in">
      
      {/* ── Header ── */}
      <section style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-accent">인지 편향 차단 시스템</span>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-3)' }}>보안 상태: 가동 중</span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
          인지 편향 차단 블라인드 의정 평가 피드
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.6', maxWidth: '800px' }}>
          정당명, 지역구, 의원명을 실시간 마스킹하여 **오직 의정 발언의 논리와 데이터 정합성**만을 토대로 의정을 평가합니다. 
          진영 편향을 차단하고 사실에만 집중하세요. 평가 참여 완료 즉시 자물쇠가 열리며 발언 의원의 실제 신원이 공개됩니다.
        </p>

        {!session && (
          <div style={{
            marginTop: '10px',
            backgroundColor: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <span className="mono" style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
              🔓 평가에 참여하고 의정 신원 해독 로그를 열람하려면 세션 로그인이 필요합니다.
            </span>
            <Link href="/auth/login" className="btn-primary" style={{ padding: '6px 14px', fontSize: '11px' }}>
              체험 로그인 &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* ── Quiz Feed ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 className="mono" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-3)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
          블라인드 평가 대기열 ({quizzes.length})
        </h2>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} height="200px" />
            ))}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {quizzes.map((quiz) => (
              <BlindEvaluationCard 
                key={quiz.id} 
                quiz={quiz} 
              />
            ))}
          </div>
        )}
      </section>
      
    </div>
  );
}
