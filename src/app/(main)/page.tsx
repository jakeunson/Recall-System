'use client';

import React, { useState, useEffect } from 'react';
import { useDashboardData } from '@/lib/hooks';
import { SkeletonText } from '@/components/custom/SkeletonUI';
import StatCard from '@/components/StatCard';
import { createClient } from '@/utils/supabase/client';
import { Member } from '@/lib/types';

import WelcomeBanner from '@/components/custom/WelcomeBanner';
import QuickLinkCards from '@/components/custom/QuickLinkCards';
import RecentActivityFeed from '@/components/custom/RecentActivityFeed';
import BlindEvaluationCTA from '@/components/custom/BlindEvaluationCTA';

export default function Home() {
  const { stats, recentPosts, loading: dashboardLoading } = useDashboardData();
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('members').select('*');
      if (data) {
        setMembers(data);
      }
      setMembersLoading(false);
    };
    fetchMembers();
  }, []);

  const avgTrustScore = members.length > 0 
    ? Math.round(members.reduce((sum, m) => sum + m.trustScore, 0) / members.length)
    : 0;

  const loading = dashboardLoading || membersLoading;

  return (
    <div className="fade-in flex flex-col gap-6">

      {/* ── 환영 배너 ── */}
      <WelcomeBanner />

      {/* ── 통계 카드 ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-base h-[100px]">
              <SkeletonText width="60%" height="11px" />
              <SkeletonText width="80%" height="28px" />
            </div>
          ))
        ) : (
          <>
            <StatCard label="검증 대상 의원" value={stats.memberCount} unit="명" sub="제22대 국회의원 전원" accent />
            <StatCard label="시민 검증 법안" value={stats.verifiedBillCount} unit="건" sub="본회의 표결 분석 완료" />
            <StatCard label="진행 중인 공개 질의" value={stats.activeQuestionCount} unit="건" sub="답변 대기 중" />
            <StatCard label="평균 신뢰 점수" value={avgTrustScore} unit="점" sub="전체 의원 기준" />
          </>
        )}
      </section>

      {/* ── 메인 본문 ── */}
      <div className="flex flex-col gap-6">
        {/* 좌측: 최근 활동 피드 */}
        <div className="flex flex-col gap-6 w-full">
          {/* 빠른 참여 카드 4개 */}
          <QuickLinkCards />

          {/* 최근 활동 피드 */}
          <RecentActivityFeed posts={recentPosts} loading={dashboardLoading} />

          {/* 블라인드 평가 CTA */}
          <BlindEvaluationCTA />
        </div>
      </div>
    </div>
  );
}
