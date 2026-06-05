'use client';

import React from 'react';
import { useQuizzes, useSession } from '@/lib/hooks';
import BlindEvaluationCard from '@/components/ui/BlindEvaluationCard';
import { SkeletonCard } from '@/components/ui/SkeletonUI';
import StatCard from '@/components/StatCard';
import Link from 'next/link';

export default function BlindQuizListPage() {
  const { session } = useSession();
  const { quizzes, loading } = useQuizzes();

  // StatCard 집계 계산 (PRD Section 1 핵심 지표 요약 노출)
  const totalVotes = quizzes.reduce((sum, q) => sum + q.agreeCount + q.disagreeCount + q.holdCount, 0);
  const avgParticipation = quizzes.length > 0 ? Math.round(totalVotes / quizzes.length) : 0;
  const uniqueMembers = new Set(quizzes.map((q) => q.memberName)).size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="fade-in">
      
      {/* ── Header ── */}
      <section style={{
        backgroundColor: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-accent" style={{ fontSize: '11px' }}>블라인드 평가</span>
        </div>
        <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--text-1)' }}>
          블라인드 의정 평가
        </h1>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: '1.6', maxWidth: '700px' }}>
          의원의 이름, 정당, 지역구를 가리고 발언 내용만으로 평가합니다. 
          편견 없이 의정 활동의 논리와 근거에 집중해 보세요. 
          평가를 완료하면 의원의 실제 신원이 공개됩니다.
        </p>

        {!session && (
          <div style={{
            marginTop: '8px',
            backgroundColor: 'var(--bg-3)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            border: '1px solid var(--border)'
          }}>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', fontWeight: 500 }}>
              평가에 참여하고 결과를 확인하려면 로그인이 필요해요.
            </span>
            <Link href="/auth/login" className="btn-primary">
              로그인하기
            </Link>
          </div>
        )}
      </section>

      {/* ── 핵심 지표 요약 StatCard (PRD Section 1 데이터 기반 참여 촉진) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <StatCard label="총 평가 건수" value={quizzes.length} unit="건" sub="누적 블라인드 발언 평가 수" />
        <StatCard label="평균 참여 인원" value={avgParticipation.toLocaleString()} unit="명" sub="건당 평균 시민 투표 수" accent />
        <StatCard label="참여 의원 수" value={uniqueMembers} unit="명" sub="평가에 등장한 고유 의원 수" />
      </div>

      {/* ── Quiz Feed ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="section-header" style={{ marginBottom: '0' }}>
          <h2 className="section-title">진행 중인 평가 ({quizzes.length})</h2>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} height="200px" />
            ))}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
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
