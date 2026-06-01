'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { MOCK_FACTCHECKS } from '@/lib/mock-data';
import { FactCheck } from '@/lib/types';
import { VERDICT_MAP } from '../page';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FactCheckDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const factcheckId = resolvedParams.id;

  const [factcheck, setFactcheck] = useState<FactCheck | null>(null);

  // 사용자 반응 투표 상태 ('verified' | 'needs_review' | null)
  const [userReaction, setUserReaction] = useState<'verified' | 'needs_review' | null>(null);
  const [extraVerified, setExtraVerified] = useState(0);
  const [extraNeedsReview, setExtraNeedsReview] = useState(0);
  const [userSession, setUserSession] = useState<{ id: string; displayName: string; trustLevel: number } | null>(null);

  // 로컬 저장소 및 Mock 데이터 취합하여 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('user_session');
      if (savedSession) {
        try { setUserSession(JSON.parse(savedSession)); } catch { /* ignore */ }
      }

      let currentCheck: FactCheck | null = null;

      // 1. 로컬 저장물 검색
      const saved = localStorage.getItem('user_factchecks');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as FactCheck[];
          const found = parsed.find((item) => item.id === factcheckId);
          if (found) currentCheck = found;
        } catch {
          // ignore
        }
      }

      // 2. 검색 안 될 시 Mock 데이터 검색
      if (!currentCheck) {
        const foundMock = MOCK_FACTCHECKS.find((item) => item.id === factcheckId);
        if (foundMock) currentCheck = foundMock;
      }

      const finalCheck = currentCheck;
      setTimeout(() => {
        setFactcheck(finalCheck);
      }, 0);

      // 3. 사용자 반응 투표 상태 복원
      const userVotes = localStorage.getItem('user_fc_votes');
      if (userVotes) {
        try {
          const parsed = JSON.parse(userVotes);
          if (parsed[factcheckId]) {
            setTimeout(() => {
              setUserReaction(parsed[factcheckId]);
            }, 0);
          }
        } catch {
          // ignore
        }
      }
    }
  }, [factcheckId]);

  if (!factcheck) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-1)', marginBottom: '16px' }}>팩트체크 리포트를 찾을 수 없습니다.</h2>
        <Link href="/factcheck" className="btn-primary">목록으로 돌아가기</Link>
      </div>
    );
  }

  // 팩트체크 반응 투표 처리
  const handleReact = (type: 'verified' | 'needs_review') => {
    if (!userSession) {
      alert('교차 검증 투표는 시민 회원 로그인 후 이용하실 수 있습니다.');
      return;
    }
    if (userReaction) return; // 중복 투표 방지

    setUserReaction(type);
    if (type === 'verified') {
      setExtraVerified(1);
    } else {
      setExtraNeedsReview(1);
    }

    if (typeof window !== 'undefined') {
      const votes = localStorage.getItem('user_fc_votes') || '{}';
      try {
        const parsed = JSON.parse(votes);
        parsed[factcheckId] = type;
        localStorage.setItem('user_fc_votes', JSON.stringify(parsed));

        // 로컬스토리지 내에 있는 사용자의 자체 팩트체크 오브젝트 카운터도 실시간 동기화
        const saved = localStorage.getItem('user_factchecks');
        if (saved) {
          const parsedFCs = JSON.parse(saved) as FactCheck[];
          const targetIndex = parsedFCs.findIndex(item => item.id === factcheckId);
          if (targetIndex !== -1) {
            if (type === 'verified') parsedFCs[targetIndex].verifiedCount += 1;
            else parsedFCs[targetIndex].needsReviewCount += 1;
            localStorage.setItem('user_factchecks', JSON.stringify(parsedFCs));
          }
        }

        // 전역 세션 업데이트 트리거
        window.dispatchEvent(new Event('user-session-changed'));
      } catch {
        // ignore
      }
    }
  };

  const verdictDetails = VERDICT_MAP[factcheck.verdict];
  const finalVerified = factcheck.verifiedCount + extraVerified;
  const finalNeedsReview = factcheck.needsReviewCount + extraNeedsReview;

  return (
    <div style={{ padding: '32px 24px', maxWidth: '850px', margin: '0 auto' }}>

      {/* ── 상단 이동 네비게이션 ── */}
      <div style={{ marginBottom: '24px' }} className="fade-in">
        <Link href="/factcheck" className="btn-secondary" style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          팩트체크 목록으로 돌아가기
        </Link>
      </div>

      {/* ── 메인 검증 리포트 카드 ── */}
      <div className="card-base fade-in" style={{ padding: '40px', position: 'relative', overflow: 'hidden' }}>

        {/* Header Title Metadata */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid var(--border)', paddingBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--font-xs)',
              fontWeight: 700,
              color: 'var(--text-3)'
            }}>
              VERIFY REPORT {factcheck.id}
            </span>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              {new Date(factcheck.createdAt).toLocaleDateString('ko-KR')}
            </span>
          </div>

          <span className="badge" style={{ backgroundColor: verdictDetails.bg, color: verdictDetails.color, border: verdictDetails.border }}>
            {verdictDetails.label}
          </span>
        </div>

        {/* ── 1. The Claim (검증 대상 주장) ── */}
        <div style={{ marginBottom: '32px' }}>
          <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: '10px' }}>
            검증 대상 정당/인물 주장
          </span>
          <blockquote style={{
            fontSize: 'var(--font-lg)',
            fontWeight: 700,
            color: 'var(--text-1)',
            lineHeight: 1.6,
            backgroundColor: 'var(--bg-3)',
            borderLeft: '4px solid var(--accent)',
            borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
            padding: '20px 24px',
            fontStyle: 'normal',
            margin: 0
          }}>
            &ldquo;{factcheck.claim}&rdquo;
          </blockquote>
        </div>

        {/* ── 2. The Evidence (검증 논리 및 증거) ── */}
        <div style={{ marginBottom: '36px' }}>
          <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: '10px' }}>
            팩트체크 근거 및 데이터 분석
          </span>
          <div style={{
            fontSize: 'var(--font-base)',
            color: 'var(--text-1)',
            lineHeight: 1.8,
            backgroundColor: 'var(--bg-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            whiteSpace: 'pre-line'
          }}>
            {factcheck.evidence}
          </div>
        </div>

        {/* ── 3. The Source Links (공식 출처 목록) ── */}
        <div style={{ marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '32px' }}>
          <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: '12px' }}>
            참고 출처 및 공식 데이터 링크 ({factcheck.sourceUrls.length}건)
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {factcheck.sourceUrls.map((url, i) => {
              // URL 도메인명 추출
              let domain = url;
              try {
                const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
                domain = parsed.hostname;
              } catch {
                // ignore
              }

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--bg-3)',
                    border: '1px solid var(--border-2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 18px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
                      [출처 {i + 1}]
                    </span>
                    <a
                      href={url.startsWith('http') ? url : `https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 'var(--font-sm)',
                        color: 'var(--accent)',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {domain}
                    </a>
                  </div>

                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    backgroundColor: 'rgba(22, 163, 74, 0.08)',
                    color: 'var(--success)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    검증 완료 출처
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 4. Community Reactions (시민 검증 반응) ── */}
        <div>
          <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '8px', textAlign: 'center' }}>
            시민 팩트체크 타당성 교차 검증 (VerificationVote)
          </h3>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', textAlign: 'center', marginBottom: '20px' }}>
            제출된 근거와 출처가 정당하며 납득 가능한지 시민 여러분의 의견을 표명해 주세요.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>
            {/* Verified Button */}
            <button
              onClick={() => handleReact('verified')}
              className="btn-secondary"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                borderColor: userReaction === 'verified' ? 'var(--success)' : 'var(--border-2)',
                backgroundColor: userReaction === 'verified' ? 'rgba(22, 163, 74, 0.04)' : 'var(--bg-2)',
                color: userReaction === 'verified' ? 'var(--success)' : 'var(--text-1)',
                cursor: userReaction ? 'not-allowed' : 'pointer',
                opacity: userReaction && userReaction !== 'verified' ? 0.5 : 1
              }}
            >
              <span style={{ fontSize: '20px' }}>✓</span>
              <span style={{ fontWeight: 800, fontSize: 'var(--font-sm)' }}>이 검증이 정당함 (Verified)</span>
              <span style={{ fontSize: 'var(--font-xs)', fontFamily: 'var(--font-mono)' }}>
                {finalVerified.toLocaleString()}명 동의
              </span>
            </button>

            {/* Needs Review Button */}
            <button
              onClick={() => handleReact('needs_review')}
              className="btn-secondary"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                borderColor: userReaction === 'needs_review' ? 'var(--danger)' : 'var(--border-2)',
                backgroundColor: userReaction === 'needs_review' ? 'rgba(220, 38, 38, 0.04)' : 'var(--bg-2)',
                color: userReaction === 'needs_review' ? 'var(--danger)' : 'var(--text-1)',
                cursor: userReaction ? 'not-allowed' : 'pointer',
                opacity: userReaction && userReaction !== 'needs_review' ? 0.5 : 1
              }}
            >
              <span style={{ fontSize: '20px' }}>✗</span>
              <span style={{ fontWeight: 800, fontSize: 'var(--font-sm)' }}>추가 검증 필요 (Needs Review)</span>
              <span style={{ fontSize: 'var(--font-xs)', fontFamily: 'var(--font-mono)' }}>
                {finalNeedsReview.toLocaleString()}명 검증 요청
              </span>
            </button>
          </div>

          {userReaction && (
            <p style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'center', marginTop: '16px', fontWeight: 600, animation: 'fadeIn 0.3s ease' }}>
              🎉 귀하의 소중한 팩트체크 교차 참여 결과가 정밀하게 카운터에 가산되었습니다.
            </p>
          )}
        </div>

        {/* Written By Info Bottom */}
        <div style={{ marginTop: '40px', borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', color: 'var(--text-3)' }}>
          <span>검증 작성자: <strong>{factcheck.authorName}</strong> (공식 서명단)</span>
          <span>주민등록 비수집 ZKP 선거구 검증 완료</span>
        </div>

      </div>

    </div>
  );
}
