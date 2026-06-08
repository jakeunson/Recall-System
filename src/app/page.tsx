'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDashboardData, useSession } from '@/lib/hooks';
import { SkeletonCard, SkeletonText } from '@/components/custom/SkeletonUI';
import GaugeRing from '@/components/GaugeRing';
import StatCard from '@/components/StatCard';
import { createClient } from '@/utils/supabase/client';
import { Member } from '@/lib/types';
import { Button } from '@/components/ui/button';

const BOARD_TYPE_LABEL: Record<string, string> = {
  blind: '블라인드 평가',
  question: '공개 질의',
  bill: '법안 토론',
};

const BOARD_TYPE_COLOR: Record<string, string> = {
  blind: 'bg-accent/10 text-accent',
  question: 'bg-warning/10 text-warning',
  bill: 'bg-success/10 text-success',
};

export default function Home() {
  const { session } = useSession();
  const { stats, recentPosts, loading: dashboardLoading } = useDashboardData();
  const [activeTab, setActiveTab] = useState<'all' | 'blind' | 'question' | 'bill'>('all');

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

  const filteredPosts = recentPosts.filter(post =>
    activeTab === 'all' ? true : post.boardType === activeTab
  );

  const topMembers = [...members].sort((a, b) => b.trustScore - a.trustScore).slice(0, 5);
  
  const loading = dashboardLoading || membersLoading;

  return (
    <div className="fade-in flex flex-col gap-6">

      {/* ── 환영 배너 ── */}
      <section className="rounded-xl p-8 md:p-10 text-white flex justify-between items-center gap-6 flex-wrap bg-accent shadow-sm relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold bg-white/10 px-2.5 py-1 rounded-full text-white/90 border border-white/10 backdrop-blur-sm">
              🟢 서비스 운영 중
            </span>
            {session && (
              <span className="text-xs font-medium text-white/80">
                {session.displayName}님 환영합니다
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-[28px] font-bold text-white leading-tight tracking-tight mt-1">
            국민소환제
          </h1>
          <p className="text-lg text-white/70 leading-relaxed max-w-[520px]">
            국회의원의 의정 활동을 데이터와 시민의 눈으로 함께 검증합니다.
          </p>
        </div>
        {!session && (
          <Link href="/auth/login" className="bg-white text-accent px-6 py-3 rounded-md font-bold text-base shrink-0 transition-opacity hover:opacity-90 shadow-sm relative z-10">
            참여하기 →
          </Link>
        )}
      </section>

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
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { href: '/blind', emoji: '👁️', title: '블라인드 평가', desc: '발언자 정보 없이 의정 발언을 평가해보세요', color: 'text-accent' },
              { href: '/questions', emoji: '💬', title: '공개 질의', desc: '의원에게 직접 질문을 등록하고 공감을 모아보세요', color: 'text-warning' },
              { href: '/bills', emoji: '📋', title: '법안 토론', desc: '개정 법안의 조문 변경 사항을 비교하고 의견 나눠요', color: 'text-success' },
              { href: '/members', emoji: '📊', title: '의원 리포트', desc: '데이터 기반으로 분석된 의원별 종합 평가 리포트', color: 'text-blue-500' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="card-base flex flex-col gap-2 p-6 hover:scale-[1.02] transition-transform">
                <div className="text-[24px]">{item.emoji}</div>
                <div className={`font-bold text-sm ${item.color}`}>{item.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
              </Link>
            ))}
          </section>

          {/* 최근 활동 피드 */}
          <section className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            {/* 탭 헤더 */}
            <div className="pt-4 px-5 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-foreground">최근 활동</h2>
              </div>
              <div className="flex items-center gap-2">
                {([
                  { key: 'all', label: '전체' },
                  { key: 'blind', label: '블라인드' },
                  { key: 'question', label: '공개 질의' },
                  { key: 'bill', label: '법안 토론' },
                ] as const).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`tab-item px-4 py-2 text-sm ${activeTab === tab.key ? 'active' : ''}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 피드 리스트 */}
            {loading ? (
              <div className="p-4">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} height="60px" />)}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                게시글이 없습니다.
              </div>
            ) : (
              <div>
                {filteredPosts.map((post) => (
                  <Link key={post.id} href={post.href} className="post-row px-5 py-4 flex items-center gap-4 hover:bg-muted transition-colors border-b border-border last:border-0">
                    {/* 분류 뱃지 */}
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-md ${BOARD_TYPE_COLOR[post.boardType] || 'bg-muted text-muted-foreground'} min-w-[70px] text-center`}>
                      {BOARD_TYPE_LABEL[post.boardType] ?? post.boardType}
                    </span>

                    {/* 제목 */}
                    <span className="flex-1 text-sm font-medium text-foreground truncate">
                      {post.title}
                    </span>

                    {/* 메타 */}
                    <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                      {post.meta}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* 블라인드 평가 CTA */}
          <section className="bg-card border border-border rounded-xl p-6 flex items-center justify-between gap-6 flex-wrap shadow-sm">
            <div>
              <h3 className="text-base font-bold mb-2">
                👁️ 블라인드 평가 참여하기
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                발언자 정보 없이 오직 내용만으로 평가합니다. 확증 편향 없는 시민 검증에 참여하세요.
              </p>
            </div>
            <Link href="/blind" className="btn-primary shrink-0 px-6 py-3">
              평가 참여 →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
