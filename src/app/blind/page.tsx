'use client';

import React from 'react';
import { useQuizzes, useSession } from '@/lib/hooks';
import BlindEvaluationCard from '@/components/custom/BlindEvaluationCard';
import { SkeletonCard } from '@/components/custom/SkeletonUI';
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
    <div className="flex flex-col gap-6 fade-in">
      
      {/* ── Header ── */}
      <section className="bg-secondary border border-border rounded-md px-7 py-6 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="badge badge-accent text-sm">블라인드 평가</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">
          블라인드 의정 평가
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[700px]">
          의원의 이름, 정당, 지역구를 가리고 발언 내용만으로 평가합니다. 
          편견 없이 의정 활동의 논리와 근거에 집중해 보세요. 
          평가를 완료하면 의원의 실제 신원이 공개됩니다.
        </p>

        {!session && (
          <div className="mt-2 bg-card rounded-sm px-5 py-3.5 flex justify-between items-center flex-wrap gap-3 border border-border">
            <span className="text-sm text-muted-foreground font-medium">
              평가에 참여하고 결과를 확인하려면 로그인이 필요해요.
            </span>
            <Link href="/auth/login" className="btn-primary">
              로그인하기
            </Link>
          </div>
        )}
      </section>

      {/* ── 핵심 지표 요약 StatCard (PRD Section 1 데이터 기반 참여 촉진) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="총 평가 건수" value={quizzes.length} unit="건" sub="누적 블라인드 발언 평가 수" />
        <StatCard label="평균 참여 인원" value={avgParticipation.toLocaleString()} unit="명" sub="건당 평균 시민 투표 수" accent />
        <StatCard label="참여 의원 수" value={uniqueMembers} unit="명" sub="평가에 등장한 고유 의원 수" />
      </div>

      {/* ── Quiz Feed ── */}
      <section className="flex flex-col gap-4">
        <div className="section-header mb-0">
          <h2 className="section-title">진행 중인 평가 ({quizzes.length})</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} height="200px" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
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
