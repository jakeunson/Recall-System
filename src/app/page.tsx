'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDashboardData, useSession } from '@/lib/hooks';
import { SkeletonCard, SkeletonText } from '@/components/ui/SkeletonUI';
import GaugeRing from '@/components/GaugeRing';
import StatCard from '@/components/StatCard';
import BlindEvaluationCard from '@/components/ui/BlindEvaluationCard';
import { MOCK_MEMBERS } from '@/lib/mock-data';

export default function Home() {
  const { session } = useSession();
  const { stats, recentPosts, loading } = useDashboardData();
  const [activeTab, setActiveTab] = useState<'all' | 'blind' | 'question' | 'bill'>('all');

  // WDI computations and aggregations for stats (Calculated locally from original member pool)
  const avgTrustScore = Math.round(
    MOCK_MEMBERS.reduce((sum, m) => sum + m.trustScore, 0) / MOCK_MEMBERS.length
  );

  // Filter recent posts based on tab
  const filteredPosts = recentPosts.filter(post => {
    if (activeTab === 'all') return true;
    return post.boardType === activeTab;
  });

  // Get Top 3 Members sorted by trust score for the sidebar ranking widget
  const topMembersByTrust = [...MOCK_MEMBERS]
    .sort((a, b) => b.trustScore - a.trustScore)
    .slice(0, 3);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* ─── TERMINAL HEADER HERO ─── */}
      <section style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--border-2)',
        borderRadius: 'var(--radius-md)',
        padding: '30px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50px',
          bottom: 0,
          width: '1px',
          backgroundColor: 'rgba(0, 0, 0, 0.03)',
          zIndex: 1
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 2 }}>
          <span className="mono" style={{
            fontSize: 'var(--font-xs)',
            color: 'var(--text-1)',
            backgroundColor: 'var(--bg-3)',
            padding: '4px 10px',
            borderRadius: '4px',
            fontWeight: 700,
            border: '1px solid var(--border)'
          }}>
            시스템: 정상 작동 중
          </span>
          <span className="mono" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)' }}>
            소프트웨어 버전 // v2.0.0-BETA
          </span>
          {session && (
            <span className="mono" style={{ fontSize: 'var(--font-xs)', color: 'var(--success)' }}>
              // 시민 위원 로그인 상태: {session.displayName} (신뢰 등급 {session.trustLevel})
            </span>
          )}
        </div>

        <h1 className="cursor-blink" style={{
          fontSize: 'var(--font-2xl)',
          fontWeight: 600,
          letterSpacing: '-0.04em',
          color: 'var(--text-1)',
          zIndex: 2,
          lineHeight: '1.2'
        }}>
          국민소환제 정책 검증 터미널
        </h1>

        <p style={{
          fontSize: 'var(--font-sm)',
          lineHeight: '1.7',
          color: 'var(--text-2)',
          maxWidth: '780px',
          zIndex: 2
        }}>
          대한민국 국회의원의 의정 데이터를 정량화하여 감정이나 진영 논리가 아닌, **객관적 데이터 기반**으로 대의민주주의를 검증하고 평가할 수 있도록 설계된 신뢰 기반 정책 터미널입니다.
        </p>

        {/* Dynamic status labels */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
          marginTop: '12px',
          borderTop: '1px dashed var(--border)',
          paddingTop: '20px',
          zIndex: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-3)', fontSize: 'var(--font-xs)' }}>감사 상태:</span>
            <span className="badge badge-success">블록체인 검증 완료</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-3)', fontSize: 'var(--font-xs)' }}>인지 편향 차단 보호:</span>
            <span className="badge badge-accent">실시간 작동 중</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-3)', fontSize: 'var(--font-xs)' }}>소명 답변 기한 추적:</span>
            <span className="badge badge-warning">실시간 추적 중</span>
          </div>
        </div>
      </section>

      {/* ─── PLATFORM STATS GRID ─── */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-base" style={{ height: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <SkeletonText width="50%" height="12px" />
              <SkeletonText width="80%" height="24px" />
              <SkeletonText width="40%" height="10px" />
            </div>
          ))
        ) : (
          <>
            <StatCard 
              label="검증 대상 국회의원" 
              value={stats.memberCount} 
              unit="명" 
              sub="대한민국 제22대 국회의원 전원" 
              accent
            />
            <StatCard 
              label="시민 검증 법안" 
              value={stats.verifiedBillCount} 
              unit="건" 
              sub="공식 의정 활동 및 본회의 표결 분석" 
            />
            <StatCard 
              label="진행 중인 공개 소명 요구" 
              value={stats.activeQuestionCount} 
              unit="건" 
              sub="유권자 요구 질의 및 기한 실시간 추적" 
            />
            <StatCard 
              label="종합 평균 신뢰도" 
              value={avgTrustScore} 
              unit="점" 
              sub="유권자 편향 차단 검증 평균 데이터" 
            />
          </>
        )}
      </section>

      {/* ─── MAIN DOUBLE-COLUMN LAYOUT ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        alignItems: 'flex-start'
      }}>

        {/* ─── LEFT COLUMN: RECENT INTEGRATED DISCOURSE ACTIVITY FEED ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-2)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-2)' }}>지표 영역 1 // 실시간 검증 피드</span>
                <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 600, color: 'var(--text-1)' }}>플랫폼 실시간 활동 피드</h2>
              </div>

              {/* Terminal Category Tabs */}
              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-3)', padding: '3px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                {(['all', 'blind', 'question', 'bill'] as const).map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="mono"
                    style={{
                      padding: '4px 10px',
                      fontSize: 'var(--font-xs)',
                      borderRadius: '2px',
                      fontWeight: 600,
                      color: activeTab === tab ? 'var(--bg-2)' : 'var(--text-2)',
                      backgroundColor: activeTab === tab ? 'var(--text-1)' : 'transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab === 'all' ? '전체' : tab === 'blind' ? '블라인드' : tab === 'question' ? '공개소명' : '법안토론'}
                  </button>
                ))}
              </div>
            </div>

            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: '1.6' }}>
              퀴즈, 공개소명질의, 법안 토론 등 유권자와 의원실이 상호작용하는 모든 검증 절차의 최신 타임라인 데이터입니다.
            </p>

            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} height="130px" />
              ))
            ) : filteredPosts.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-2)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-3)' }}>선택한 영역에 연동된 실시간 활동 내역이 존재하지 않습니다.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredPosts.map((post) => (
                  <div key={post.id} className="card-base" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    background: 'var(--bg-2)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)' }}>
                        검증 종류 // {post.boardType === 'blind' ? '블라인드 투표' : post.boardType === 'question' ? '공개 소명 질의' : '법안 합의 토론'}
                      </span>
                      {post.badge && (
                        <span className="badge" style={{ backgroundColor: 'var(--bg-3)', color: 'var(--text-1)', border: '1px solid var(--border-2)' }}>
                          {post.badge}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--text-1)' }}>
                      <Link href={post.href} style={{ color: 'inherit' }}>{post.title}</Link>
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-2)' }}>{post.meta}</span>
                      <Link href={post.href} style={{ fontSize: 'var(--font-xs)', color: 'var(--text-1)', fontWeight: 700 }}>
                        상세 보기 &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* CIVIC BIAS SHIELD PROMPT CARD */}
          <section className="card-base" style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--text-1)', borderRadius: '50%' }} />
              <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-1)' }}>인지 편향 차단 투표 안내</span>
            </div>
            <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--text-1)' }}>인지 편향 차단 블라인드 평가 참여</h3>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
              확증 편향과 감정적 투표를 방지하기 위해 발언 원문을 인물 정보 없이 오직 논리 정합성으로만 평가할 수 있는 시스템입니다. 유권자의 소리 높은 평판 검증 퀴즈를 경험하세요.
            </p>
            <Link href="/blind" className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: 'var(--font-sm)', fontWeight: 700 }}>
              블라인드 퀴즈 바로가기 &rarr;
            </Link>
          </section>

        </div>

        {/* ─── RIGHT COLUMN: TOP RATINGS & QUICK ACCREDITATION ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* TOP AUDITED MEMBERS RANKING */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ borderBottom: '1px solid var(--border-2)', paddingBottom: '8px' }}>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)' }}>지표 영역 2 // 종합 평판 지수</span>
              <h2 style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--text-1)' }}>종합 신뢰 지수 상위 의원</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topMembersByTrust.map((member, idx) => (
                <div key={member.id} className="card-base" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  background: 'var(--bg-2)',
                  padding: '18px 16px'
                }}>
                  <span className="mono" style={{
                    fontSize: 'var(--font-lg)',
                    fontWeight: 600,
                    color: idx === 0 ? 'var(--text-1)' : 'var(--text-3)'
                  }}>
                    0{idx + 1}
                  </span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-1)' }}>
                      <Link href={`/members/${member.id}`} style={{ color: 'inherit' }}>{member.name}</Link>
                    </span>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-2)' }}>
                      {member.party} // {member.region}
                    </span>
                  </div>

                  <GaugeRing value={member.trustScore} size={54} strokeWidth={5} />
                </div>
              ))}
            </div>

            <Link href="/members" className="btn-secondary" style={{
              width: '100%',
              fontSize: 'var(--font-sm)',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              justifyContent: 'center',
              padding: '12px 0'
            }}>
              의원 레지스트리 전체 보기 &rarr;
            </Link>
          </section>

          {/* ACTIVE DISCOURSE METRICS STATS */}
          <section className="card-base" style={{ display: 'flex', flexDirection: 'column', gap: '18px', background: 'var(--bg-2)', padding: '24px 20px' }}>
            <h3 style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-1)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', margin: 0 }}>
              실시간 시스템 안정성 지표
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-2)' }}>평가 편차 오차 한계 범위:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>0.02%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-3)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '92%', height: '100%', backgroundColor: 'var(--text-1)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-2)' }}>의원 소명 기한 준수율:</span>
                  <span style={{ fontWeight: 700, color: 'var(--warning)' }}>98.2% 정시 답변 처리 완료</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-3)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '98%', height: '100%', backgroundColor: 'var(--warning)' }} />
                </div>
              </div>
            </div>
          </section>

        </div>

      </div>

    </div>
  );
}
