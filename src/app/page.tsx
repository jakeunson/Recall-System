'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDashboardData, useSession } from '@/lib/hooks';
import { SkeletonCard, SkeletonText } from '@/components/ui/SkeletonUI';
import GaugeRing from '@/components/GaugeRing';
import StatCard from '@/components/StatCard';
import { MOCK_MEMBERS } from '@/lib/mock-data';

const BOARD_TYPE_LABEL: Record<string, string> = {
  blind: '블라인드 평가',
  question: '공개 질의',
  bill: '법안 토론',
};

const BOARD_TYPE_COLOR: Record<string, string> = {
  blind: 'rgba(26,26,46,0.07)',
  question: 'rgba(217,119,6,0.08)',
  bill: 'rgba(22,163,74,0.08)',
};

const BOARD_TYPE_TEXT: Record<string, string> = {
  blind: 'var(--accent)',
  question: 'var(--warning)',
  bill: 'var(--success)',
};

export default function Home() {
  const { session } = useSession();
  const { stats, recentPosts, loading } = useDashboardData();
  const [activeTab, setActiveTab] = useState<'all' | 'blind' | 'question' | 'bill'>('all');

  const avgTrustScore = Math.round(
    MOCK_MEMBERS.reduce((sum, m) => sum + m.trustScore, 0) / MOCK_MEMBERS.length
  );

  const filteredPosts = recentPosts.filter(post =>
    activeTab === 'all' ? true : post.boardType === activeTab
  );

  const topMembers = [...MOCK_MEMBERS].sort((a, b) => b.trustScore - a.trustScore).slice(0, 5);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── 환영 배너 ── */}
      <section style={{
        background: 'linear-gradient(135deg, var(--accent) 0%, #2d2d4e 100%)',
        borderRadius: 'var(--radius-md)',
        padding: '32px 28px',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '24px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: 'var(--font-xs)',
              fontWeight: 600,
              backgroundColor: 'rgba(255,255,255,0.15)',
              padding: '3px 10px',
              borderRadius: '20px',
              color: '#fff',
            }}>
              🟢 서비스 운영 중
            </span>
            {session && (
              <span style={{ fontSize: 'var(--font-xs)', color: 'rgba(255,255,255,0.7)' }}>
                {session.displayName}님 환영합니다
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
            국민소환제
          </h1>
          <p style={{ fontSize: 'var(--font-sm)', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, maxWidth: '520px' }}>
            국회의원의 의정 활동을 데이터와 시민의 눈으로 함께 검증합니다.
          </p>
        </div>
        {!session && (
          <Link href="/auth/login" style={{
            backgroundColor: '#fff',
            color: 'var(--accent)',
            padding: '11px 24px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: 'var(--font-sm)',
            flexShrink: 0,
            textDecoration: 'none',
            transition: 'opacity 0.15s',
          }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            참여하기 →
          </Link>
        )}
      </section>

      {/* ── 통계 카드 ── */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
      }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-base" style={{ height: '100px' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'flex-start' }}>

        {/* 좌측: 최근 활동 피드 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 빠른 참여 카드 3개 */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { href: '/blind', emoji: '👁️', title: '블라인드 평가', desc: '발언자 정보 없이 의정 발언을 평가해보세요', color: 'var(--accent)' },
              { href: '/questions', emoji: '💬', title: '공개 질의', desc: '의원에게 직접 질문을 등록하고 공감을 모아보세요', color: 'var(--warning)' },
              { href: '/bills', emoji: '📋', title: '법안 토론', desc: '개정 법안의 조문 변경 사항을 비교하고 의견 나눠요', color: 'var(--success)' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="card-base" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                textDecoration: 'none',
                color: 'inherit',
                padding: '18px',
              }}>
                <div style={{ fontSize: '22px' }}>{item.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: item.color }}>{item.title}</div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-2)', lineHeight: 1.5 }}>{item.desc}</div>
              </Link>
            ))}
          </section>

          {/* 최근 활동 피드 */}
          <section style={{ backgroundColor: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {/* 탭 헤더 */}
            <div style={{ padding: '14px 16px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h2 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-1)' }}>최근 활동</h2>
              </div>
              <div className="tab-bar" style={{ borderBottom: 'none', gap: '0' }}>
                {([
                  { key: 'all', label: '전체' },
                  { key: 'blind', label: '블라인드' },
                  { key: 'question', label: '공개 질의' },
                  { key: 'bill', label: '법안 토론' },
                ] as const).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`tab-item${activeTab === tab.key ? ' active' : ''}`}
                    style={{ padding: '8px 14px' }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 피드 리스트 */}
            {loading ? (
              <div style={{ padding: '12px' }}>
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} height="60px" />)}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 'var(--font-sm)' }}>
                게시글이 없습니다.
              </div>
            ) : (
              <div>
                {filteredPosts.map((post) => (
                  <Link key={post.id} href={post.href} className="post-row">
                    {/* 분류 뱃지 */}
                    <span style={{
                      flexShrink: 0,
                      fontSize: 'var(--font-xs)',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: BOARD_TYPE_COLOR[post.boardType] ?? 'var(--bg-3)',
                      color: BOARD_TYPE_TEXT[post.boardType] ?? 'var(--text-2)',
                      minWidth: '60px',
                      textAlign: 'center',
                    }}>
                      {BOARD_TYPE_LABEL[post.boardType] ?? post.boardType}
                    </span>

                    {/* 제목 */}
                    <span style={{ flex: 1, fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {post.title}
                    </span>

                    {/* 메타 */}
                    <span style={{ flexShrink: 0, fontSize: 'var(--font-xs)', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                      {post.meta}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* 블라인드 평가 CTA */}
          <section style={{
            backgroundColor: 'var(--bg-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap',
          }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, marginBottom: '4px' }}>
                👁️ 블라인드 평가 참여하기
              </h3>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.5 }}>
                발언자 정보 없이 오직 내용만으로 평가합니다. 확증 편향 없는 시민 검증에 참여하세요.
              </p>
            </div>
            <Link href="/blind" className="btn-primary" style={{ flexShrink: 0 }}>
              평가 참여 →
            </Link>
          </section>
        </div>

        {/* 우측: 신뢰 지수 상위 의원 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>신뢰 지수 TOP 5</h2>
              <Link href="/members" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', textDecoration: 'none' }}>
                전체 보기
              </Link>
            </div>
            {topMembers.map((member, idx) => (
              <Link key={member.id} href={`/members/${member.id}`} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderBottom: idx < topMembers.length - 1 ? '1px solid var(--border)' : 'none',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'background-color 0.1s',
              }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span style={{
                  fontSize: 'var(--font-xs)',
                  fontWeight: 700,
                  color: idx === 0 ? 'var(--warning)' : 'var(--text-3)',
                  width: '20px',
                  textAlign: 'center',
                  flexShrink: 0,
                }}>
                  {idx + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {member.name}
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {member.party}
                  </div>
                </div>
                <GaugeRing value={member.trustScore} size={40} strokeWidth={4} />
              </Link>
            ))}
          </div>

          {/* 의원 리포트 바로가기 */}
          <Link href="/members" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
            전체 의원 리포트 →
          </Link>
        </div>
      </div>
    </div>
  );
}
