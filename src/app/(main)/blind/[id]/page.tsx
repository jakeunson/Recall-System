'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MOCK_QUIZZES, MOCK_MEMBERS } from '@/lib/data';
import { UserProfile } from '@/lib/types';
import Tooltip from '@/components/custom/Tooltip';

/** 지표 라벨별 PRD 기반 설명 */
const INDICATOR_TOOLTIPS: Record<string, string> = {
  '출석률': '본회의·상임위 출석 비율\n회기 내 표결 참여율 포함',
  '표결 이탈': 'WDI (Voting Deviation Index)\n소속 당론 대비 이탈 표결 비율\nPAI(국민 관심도) · CCI(지역구 이해관계) 가중치 포함',
  '법안 발의': '해당 회기 내 대표 발의 법안 수',
  '청원 답변': '시민 청원 및 공개 질의 답변 완료 비율',
  '상임위 활동': '소속 상임위 출석 및 발언 활동 종합 지수',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BlindQuizDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const quizId = resolvedParams.id;
  const router = useRouter();

  const quiz = MOCK_QUIZZES.find((q) => q.id === quizId);
  const member = quiz ? MOCK_MEMBERS.find((m) => m.name === quiz.memberName) : null;

  // 상태 머신: 'blind' | 'revealing' | 'revealed'
  const [revealState, setRevealState] = useState<'blind' | 'revealing' | 'revealed'>('blind');
  const [userVote, setUserVote] = useState<string | null>(null);
  const [isBiasFilterActive, setIsBiasFilterActive] = useState(true);
  const [extraAgree, setExtraAgree] = useState(0);
  const [extraDisagree, setExtraDisagree] = useState(0);
  const [extraHold, setExtraHold] = useState(0);
  const [userSession, setUserSession] = useState<UserProfile | null>(null);

  // 로컬스토리지에서 기존 투표 여부 및 세션 가져오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('user_session');
      if (savedSession) {
        try { setUserSession(JSON.parse(savedSession)); } catch { /* ignore */ }
      }

      const votes = localStorage.getItem('user_quiz_votes');
      if (votes) {
        try {
          const parsed = JSON.parse(votes);
          if (parsed[quizId]) {
            setTimeout(() => {
              setUserVote(parsed[quizId]);
              setRevealState('revealed');
            }, 0);
          }
        } catch {
          // ignore
        }
      }
    }
  }, [quizId]);

  if (!quiz) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-1)', marginBottom: '16px' }}>퀴즈를 찾을 수 없습니다.</h2>
        <Link href="/blind" className="btn-primary">목록으로 돌아가기</Link>
      </div>
    );
  }

  // 투표 핸들러
  const handleVote = (voteType: 'agree' | 'disagree' | 'hold') => {
    setUserVote(voteType);
    setRevealState('revealing');

    // 통계에 본인 투표 가산
    if (voteType === 'agree') setExtraAgree(1);
    else if (voteType === 'disagree') setExtraDisagree(1);
    else if (voteType === 'hold') setExtraHold(1);

    // PRD Section 2.1.2: 2초 딜레이 후 발언자 정보 공개 (Delayed Attribution)
    setTimeout(() => {
      setRevealState('revealed');
      if (typeof window !== 'undefined') {
        const votes = localStorage.getItem('user_quiz_votes') || '{}';
        try {
          const parsed = JSON.parse(votes);
          parsed[quizId] = voteType;
          localStorage.setItem('user_quiz_votes', JSON.stringify(parsed));
          
          // 전역 세션 업데이트 이벤트를 통해 실시간 갱신 트리거
          window.dispatchEvent(new Event('user-session-changed'));
        } catch {
          // ignore
        }
      }
    }, 2000);
  };

  // 통계 계산
  const agreeTotal = quiz.agreeCount + extraAgree;
  const disagreeTotal = quiz.disagreeCount + extraDisagree;
  const holdTotal = quiz.holdCount + extraHold;
  const grandTotal = agreeTotal + disagreeTotal + holdTotal;

  const agreePct = grandTotal > 0 ? Math.round((agreeTotal / grandTotal) * 100) : 0;
  const disagreePct = grandTotal > 0 ? Math.round((disagreeTotal / grandTotal) * 100) : 0;
  const holdPct = grandTotal > 0 ? 100 - agreePct - disagreePct : 0;

  return (
    <div style={{ padding: '32px 24px', maxWidth: '850px', margin: '0 auto' }}>
      
      {/* ── 상단 이동 네비게이션 ── */}
      <div style={{ marginBottom: '24px' }} className="fade-in">
        <Link href="/blind" className="btn-secondary" style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          블라인드 평가 목록
        </Link>
      </div>

      {/* ── 메인 퀴즈 평가 박스 ── */}
      <div className="card-base fade-in" style={{ padding: '36px', position: 'relative', overflow: 'hidden', minHeight: '380px' }}>
        
        {/* Background Accent Grid Decoration */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, var(--accent-bg) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        {/* Header Metadata */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', zIndex: 10, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: 'var(--font-xs)', 
              fontWeight: 700, 
              color: 'var(--accent)',
              backgroundColor: 'var(--accent-bg)',
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid var(--accent-border)'
            }}>
              ISSUE {quiz.id}
            </span>
            <span style={{
              fontSize: 'var(--font-xs)',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: quiz.sourceType === 'news' ? 'rgba(14, 165, 233, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              color: quiz.sourceType === 'news' ? 'var(--info)' : 'var(--success)',
              border: `1px solid ${quiz.sourceType === 'news' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`
            }}>
              {quiz.sourceType === 'news' ? '📰 언론 보도 출처' : '🏛️ 국회 공식 속기록'}
            </span>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              {new Date(quiz.createdAt).toLocaleDateString('ko-KR')}
            </span>
          </div>

          <span className="badge badge-accent">
            {revealState === 'blind' && '인지편향 차단 모드'}
            {revealState === 'revealing' && '평가 동기화 중'}
            {revealState === 'revealed' && '신원 검증 완료'}
          </span>
        </div>

        {/* ── 1. Speech Content (발언 내용 영역) ── */}
        <div style={{ marginBottom: '36px', zIndex: 10, position: 'relative' }}>
          {revealState === 'blind' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: '8px' }}>마스킹 처리된 발언 의제</span>
              <blockquote style={{ 
                fontSize: 'var(--font-xl)', 
                fontWeight: 700, 
                color: 'var(--text-1)', 
                lineHeight: 1.7, 
                borderLeft: '4px solid var(--accent)',
                paddingLeft: '18px',
                fontStyle: 'normal'
              }}>
                &ldquo;{quiz.maskedStatement}&rdquo;
              </blockquote>
            </div>
          )}

          {revealState === 'revealing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '140px', gap: '16px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid var(--accent-bg)',
                borderTop: '3px solid var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-2)', animation: 'pulse 1.5s infinite', textAlign: 'center', lineHeight: 1.6 }}>
                투표 완료. 발언자 정보를 2초 후 공개합니다.<br />
                <span style={{ fontSize: 'var(--font-xs)', opacity: 0.7 }}>출처를 모른 채 판단하셨으므로 인지 편향이 차단됩니다.</span>
              </span>
            </div>
          )}

          {revealState === 'revealed' && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--accent)', display: 'block', marginBottom: '8px' }}>
                {isBiasFilterActive ? '편향 필터링된 발언 원문' : '무수정 발언 원문'}
              </span>
              <blockquote style={{ 
                fontSize: 'var(--font-xl)', 
                fontWeight: 700, 
                color: 'var(--text-1)', 
                lineHeight: 1.7, 
                borderLeft: '4px solid var(--accent)',
                paddingLeft: '18px',
                fontStyle: 'normal'
              }}>
                &ldquo;{isBiasFilterActive ? quiz.maskedStatement : quiz.originalStatement}&rdquo;
              </blockquote>
            </div>
          )}
        </div>

        {/* ── 2. Interactions / Results (사용자 액션 및 결과) ── */}
        <div style={{ zIndex: 10, position: 'relative' }}>
          
          {/* [BLIND STATE] - 투표 버튼 */}
          {revealState === 'blind' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
              {/* 비로그인 글라스 오버레이 */}
              {!userSession && (
                <div style={{
                  position: 'absolute', inset: '-12px',
                  backdropFilter: 'blur(10px)',
                  backgroundColor: 'rgba(0,0,0,0.32)',
                  borderRadius: 'var(--radius-md)',
                  zIndex: 20,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '14px', padding: '24px',
                  border: '1px solid var(--border)'
                }}>
                  <span style={{ fontSize: '28px' }}>🔒</span>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '6px' }}>
                      블라인드 평가는 로그인 후 참여 가능합니다
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-2)' }}>
                      인지편향 없는 공정한 의정 평가에 동참하려면<br />시민 회원으로 로그인해 주세요.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      alert('블라인드 발언 평가는 시민 회원 로그인 후 이용 가능합니다.');
                      router.push('/login');
                    }}
                    className="btn-primary"
                    style={{ padding: '8px 24px', fontSize: 'var(--font-xs)' }}
                  >
                    체험 로그인하기
                  </button>
                </div>
              )}

              <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-2)', textAlign: 'center', marginBottom: '4px' }}>
                의원의 소속 정당과 이름이 가려진 상태입니다. 이 발언에 동의하십니까?
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button 
                  onClick={() => handleVote('agree')}
                  className="btn-secondary" 
                  style={{ 
                    borderColor: 'var(--success)', 
                    color: 'var(--success)', 
                    backgroundColor: 'rgba(22, 163, 74, 0.03)',
                    padding: '16px',
                    fontSize: 'var(--font-base)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontWeight: 800 }}>동의함 (Agree)</span>
                  <span style={{ fontSize: '10px', opacity: 0.8 }}>발언 취지와 정책 논리 지지</span>
                </button>

                <button 
                  onClick={() => handleVote('disagree')}
                  className="btn-secondary" 
                  style={{ 
                    borderColor: 'var(--danger)', 
                    color: 'var(--danger)', 
                    backgroundColor: 'rgba(220, 38, 38, 0.03)',
                    padding: '16px',
                    fontSize: 'var(--font-base)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontWeight: 800 }}>동의하지 않음 (Disagree)</span>
                  <span style={{ fontSize: '10px', opacity: 0.8 }}>발언의 불합리성 및 정책 반대</span>
                </button>
              </div>

              <button 
                onClick={() => handleVote('hold')}
                className="btn-secondary" 
                style={{ 
                  padding: '12px',
                  fontSize: 'var(--font-sm)',
                  backgroundColor: 'var(--bg-3)',
                  border: '1px solid var(--border-2)',
                  color: 'var(--text-2)'
                }}
              >
                잘 모름 / 판단 보류 (Hold)
              </button>
            </div>
          )}

          {/* [REVEALED STATE] - 결과 표시 */}
          {revealState === 'revealed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.5s ease' }}>
              
              {/* 편향 방지 토글 배너 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-3)',
                border: '1px solid var(--border-2)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 18px',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-1)' }}>
                    {isBiasFilterActive ? '🛡️ 인지 편향 차단 필터 적용 중' : '🔓 필터 잠금 해제됨'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-2)' }}>
                    정당의 브랜드 이미지 선입견을 배제하기 위해 소속 정당과 지역을 블러 처리합니다.
                  </span>
                </div>
                
                {/* Sleek Custom Toggle Switch */}
                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                  <input 
                    type="checkbox" 
                    checked={isBiasFilterActive}
                    onChange={(e) => setIsBiasFilterActive(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                  />
                  <div style={{
                    width: '42px',
                    height: '22px',
                    backgroundColor: isBiasFilterActive ? 'var(--accent)' : 'var(--text-3)',
                    borderRadius: '12px',
                    position: 'relative',
                    transition: 'background-color 0.2s',
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: '#fff',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '3px',
                      left: isBiasFilterActive ? '23px' : '3px',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }} />
                  </div>
                </label>
              </div>

              {/* 주인공 의원 카드 */}
              {member && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr auto',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-2)',
                  border: '1px solid var(--border-2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  gap: '20px',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {/* Avatar Circle */}
                  <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-bg)',
                    border: '2px solid var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    fontWeight: 800,
                    color: 'var(--accent)',
                    flexShrink: 0
                  }}>
                    {member.name.substring(0, 1)}
                  </div>

                  {/* Profile & Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text-1)' }}>
                        {member.name} 의원
                      </span>
                      <Tooltip
                        content={`신뢰 점수 = 활동 이력(30%) + 체류 품질(25%) + 정보 다양성(30%) + 지역 인증(15%)\n0~100점. 점수가 높을수록 의견 반영 가중치 증가.\n(S≥85 → ×1.5, A≥70 → ×1.2, B≥50 → ×1.0, C<50 → ×0.5)`}
                        width={300}
                      >
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: 'var(--accent-bg)',
                          color: 'var(--accent)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontFamily: 'var(--font-mono)',
                          cursor: 'help',
                        }}>
                          신뢰 점수 {member.trustScore} ⓘ
                        </span>
                      </Tooltip>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', fontSize: 'var(--font-sm)', color: 'var(--text-2)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        정당:
                        <span style={{
                          fontWeight: 700,
                          color: 'var(--text-1)',
                          filter: isBiasFilterActive ? 'blur(6px)' : 'none',
                          borderRadius: '4px',
                          padding: '0 4px',
                          transition: 'filter 0.4s ease, color 0.4s ease',
                          userSelect: isBiasFilterActive ? 'none' : 'auto'
                        }}>
                          {member.party}
                        </span>
                      </span>

                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        지역구:
                        <span style={{
                          fontWeight: 600,
                          color: 'var(--text-1)',
                          filter: isBiasFilterActive ? 'blur(6px)' : 'none',
                          borderRadius: '4px',
                          padding: '0 4px',
                          transition: 'filter 0.4s ease, color 0.4s ease',
                          userSelect: isBiasFilterActive ? 'none' : 'auto'
                        }}>
                          {member.region}
                        </span>
                      </span>

                      {quiz.sourceType === 'news' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          보도 언론사:
                          <span style={{
                            fontWeight: 600,
                            color: 'var(--text-1)',
                            filter: isBiasFilterActive ? 'blur(6px)' : 'none',
                            borderRadius: '4px',
                            padding: '0 4px',
                            transition: 'filter 0.4s ease, color 0.4s ease',
                            userSelect: isBiasFilterActive ? 'none' : 'auto'
                          }}>
                            {isBiasFilterActive ? (quiz.maskedMediaName || '[C형 전국 종합 언론사]') : (quiz.originalMediaName || '대한일보')}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* 의원 간단 실시간 통계 매치 */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', fontSize: '11px', color: 'var(--text-3)', flexWrap: 'wrap' }}>
                      {member.indicators.slice(0, 3).map((ind, i) => (
                        <Tooltip
                          key={i}
                          content={INDICATOR_TOOLTIPS[ind.label] ?? `${ind.label} 지표`}
                          placement="top"
                          width={240}
                        >
                          <span style={{ backgroundColor: 'var(--bg-3)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'help' }}>
                            {ind.label}: <strong style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{ind.value}%</strong> <span style={{ opacity: 0.5 }}>ⓘ</span>
                          </span>
                        </Tooltip>
                      ))}
                    </div>
                  </div>

                  {/* Link Button to Member Report Card */}
                  <div>
                    <Link 
                      href={`/members/${member.id}`}
                      className="btn-secondary" 
                      style={{ 
                        padding: '10px 14px', 
                        fontSize: 'var(--font-xs)',
                        display: 'inline-block',
                        textDecoration: 'none'
                      }}
                    >
                      리포트 보기
                    </Link>
                  </div>
                </div>
              )}

              {/* 투표 통계 차트 */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-1)', marginBottom: '16px' }}>
                  📊 시민 평가 통계 (총 {grandTotal.toLocaleString()}명 참여)
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* 동의함 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', fontWeight: 600 }}>
                      <span style={{ color: 'var(--success)' }}>동의함 {userVote === 'agree' && '👈 내 평가'}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>{agreeTotal.toLocaleString()}명 ({agreePct}%)</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--bg-3)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${agreePct}%`, backgroundColor: 'var(--success)', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>

                  {/* 동의하지 않음 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', fontWeight: 600 }}>
                      <span style={{ color: 'var(--danger)' }}>동의하지 않음 {userVote === 'disagree' && '👈 내 평가'}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>{disagreeTotal.toLocaleString()}명 ({disagreePct}%)</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--bg-3)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${disagreePct}%`, backgroundColor: 'var(--danger)', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>

                  {/* 판단 보류 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-2)' }}>보류 / 잘 모름 {userVote === 'hold' && '👈 내 평가'}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>{holdTotal.toLocaleString()}명 ({holdPct}%)</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--bg-3)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${holdPct}%`, backgroundColor: 'var(--text-3)', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* CSS Spin Keyframes for Loading state */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}
