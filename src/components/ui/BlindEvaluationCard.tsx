'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BlindQuiz, BlindVoteType, BlindRevealState } from '@/lib/types';
import { useQuizzes } from '@/lib/hooks';

interface BlindEvaluationCardProps {
  quiz: BlindQuiz;
  onVoteSubmit?: (quizId: string, vote: BlindVoteType) => void;
}

export default function BlindEvaluationCard({ quiz, onVoteSubmit }: BlindEvaluationCardProps) {
  const { submitBlindVote, getUserVote } = useQuizzes();
  const [vote, setVote] = useState<BlindVoteType | null>(null);
  const [revealState, setRevealState] = useState<BlindRevealState>('blind');

  useEffect(() => {
    const priorVote = getUserVote(quiz.id);
    if (priorVote) {
      setVote(priorVote);
      setRevealState('revealed');
    }
  }, [quiz.id, getUserVote]);

  const handleVote = async (type: BlindVoteType) => {
    if (revealState !== 'blind') return;
    
    setVote(type);
    setRevealState('voted');
    
    // Call the custom hook to handle localStorage persistence and delay simulation
    const success = await submitBlindVote(quiz.id, type);
    
    if (success) {
      setRevealState('revealing');
      setTimeout(() => {
        setRevealState('revealed');
        if (onVoteSubmit) {
          onVoteSubmit(quiz.id, type);
        }
      }, 500); // Decrypt fade-in transition
    } else {
      // Revert if failed (e.g. not logged in)
      setVote(null);
      setRevealState('blind');
    }
  };

  // Calculate percentages
  const total = quiz.agreeCount + quiz.disagreeCount + quiz.holdCount;
  const agreePct = total > 0 ? Math.round((quiz.agreeCount / total) * 100) : 0;
  const disagreePct = total > 0 ? Math.round((quiz.disagreeCount / total) * 100) : 0;
  const holdPct = total > 0 ? 100 - agreePct - disagreePct : 0;

  return (
    <div className="card-base fade-in" style={{
      background: 'var(--bg-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      cursor: 'default'
    }}>
      {/* Accent Indicator Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        backgroundColor: revealState === 'revealed' ? 'var(--accent)' : 'var(--text-3)',
        transition: 'background-color 0.4s ease'
      }} />

      {/* Card Header Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>
          코드: {quiz.id} // {quiz.sourceType === 'parliament' ? '의정 공식 기록' : '언론 공식 성명'}
        </span>
        <span className={`badge ${revealState === 'revealed' ? 'badge-success' : 'badge-accent'}`}>
          {revealState === 'revealed' ? '신원 검증 완료' : '블라인드 처리됨'}
        </span>
      </div>

      {/* Main Statement Box */}
      <div style={{
        background: 'var(--bg-3)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '20px',
        minHeight: '110px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <p className="mono cursor-blink" style={{
          fontSize: '14px',
          lineHeight: '1.7',
          color: revealState === 'revealed' ? 'var(--text-1)' : 'var(--accent)',
          transition: 'color 0.4s ease',
          whiteSpace: 'pre-wrap'
        }}>
          {revealState === 'revealed' ? quiz.originalStatement : quiz.maskedStatement}
        </p>
        
        {revealState === 'blind' && (
          <div style={{
            position: 'absolute',
            bottom: '8px',
            right: '12px',
            fontSize: '9px',
            color: 'var(--text-3)',
            fontFamily: 'var(--font-mono)'
          }}>
            [정치인/정당/지역구 실시간 자동 마스킹 필터 활성]
          </div>
        )}
      </div>

      {/* Phase 1: Interactive Buttons */}
      {revealState === 'blind' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <button
            onClick={() => handleVote('agree')}
            className="btn-primary"
            style={{
              padding: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 700,
              gap: '6px'
            }}
          >
            동의
          </button>
          <button
            onClick={() => handleVote('disagree')}
            className="btn-secondary"
            style={{
              padding: '12px',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 700
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            비동의
          </button>
          <button
            onClick={() => handleVote('hold')}
            className="btn-secondary"
            style={{
              padding: '12px',
              border: '1px solid var(--border-2)',
              color: 'var(--text-2)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            보류
          </button>
        </div>
      )}

      {/* Processing State */}
      {(revealState === 'voted' || revealState === 'revealing') && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '16px 0',
          animation: 'pulse 1s infinite'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid var(--accent-border)',
            borderTop: '2px solid var(--accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span className="mono" style={{ fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.1em' }}>
            발언자 신원 해독 중...
          </span>
        </div>
      )}

      {/* Phase 2: Revealed State */}
      {revealState === 'revealed' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Identity block */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="mono" style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                발언자 신원 확인
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-1)' }}>
                  {quiz.memberName}
                </span>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--accent)', backgroundColor: 'var(--accent-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                  {quiz.memberParty} // {quiz.memberRegion}
                </span>
              </div>
            </div>
            {/* View Profile Link */}
            <Link
              href={`/members/${MOCK_MEMBERS_MAP[quiz.memberName] || ''}`}
              className="btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)'
              }}
            >
              의정 프로필 보기 &rarr;
            </Link>
          </div>

          {/* Sentiment Statistics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-2)' }}>
                전체 시민 합의 지표
              </span>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                총 평가 참여: {total.toLocaleString()}명
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div style={{
              height: '8px',
              borderRadius: '4px',
              overflow: 'hidden',
              display: 'flex',
              background: 'var(--border)'
            }}>
              <div style={{ width: `${agreePct}%`, backgroundColor: 'var(--success)', transition: 'width 0.6s ease' }} title={`동의: ${agreePct}%`} />
              <div style={{ width: `${disagreePct}%`, backgroundColor: 'var(--danger)', transition: 'width 0.6s ease' }} title={`비동의: ${disagreePct}%`} />
              <div style={{ width: `${holdPct}%`, backgroundColor: 'var(--text-3)', transition: 'width 0.6s ease' }} title={`보류: ${holdPct}%`} />
            </div>

            {/* Labels and values */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span className="mono" style={{ fontSize: '10px', color: 'var(--success)', fontWeight: 600 }}>■ 동의</span>
                <span className="mono" style={{ fontSize: '14px', fontWeight: 700 }}>{agreePct}% <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--text-3)' }}>({quiz.agreeCount})</span></span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span className="mono" style={{ fontSize: '10px', color: 'var(--danger)', fontWeight: 600 }}>■ 비동의</span>
                <span className="mono" style={{ fontSize: '14px', fontWeight: 700 }}>{disagreePct}% <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--text-3)' }}>({quiz.disagreeCount})</span></span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span className="mono" style={{ fontSize: '10px', color: 'var(--text-2)', fontWeight: 600 }}>■ 보류</span>
                <span className="mono" style={{ fontSize: '14px', fontWeight: 700 }}>{holdPct}% <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--text-3)' }}>({quiz.holdCount})</span></span>
              </div>
            </div>
          </div>

          {/* Secure attribution warning notice */}
          <div style={{
            borderTop: '1px dashed var(--border-2)',
            paddingTop: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" style={{ marginTop: '2px', flexShrink: 0 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="mono" style={{ fontSize: '10px', color: 'var(--text-3)', lineHeight: '1.4' }}>
              보안 기록 로그: 귀하의 평가는 발언 의원의 신원(이름/정당/지역구)이 공개되기 전인 {new Date().toLocaleTimeString()}에 중립적인 편향 차단 환경에서 안전하게 암호화되어 수집되었습니다.
            </span>
          </div>

        </div>
      )}

      {/* Spin and blink inline animations for extreme terminal premium feel */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const MOCK_MEMBERS_MAP: Record<string, string> = {
  '김철수': 'M01',
  '이영희': 'M02',
  '박준영': 'M03',
  '최민서': 'M04'
};
