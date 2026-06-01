'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFactChecks, useSession } from '@/lib/hooks';
import { FactCheckVerdict } from '@/lib/types';
import { SkeletonCard } from '@/components/ui/SkeletonUI';

// VERDICT_MAP definition
export const VERDICT_MAP: Record<FactCheckVerdict, { label: string; bg: string; color: string; border: string }> = {
  true: {
    label: '사실 (True)',
    bg: 'rgba(22, 163, 74, 0.08)',
    color: 'var(--success)',
    border: '1px solid rgba(22, 163, 74, 0.2)',
  },
  mostly_true: {
    label: '대체로 사실',
    bg: 'rgba(13, 148, 136, 0.08)',
    color: 'var(--accent)',
    border: '1px solid var(--accent-border)',
  },
  half_true: {
    label: '절반의 사실',
    bg: 'rgba(217, 119, 6, 0.08)',
    color: 'var(--warning)',
    border: '1px solid rgba(217, 119, 6, 0.2)',
  },
  mostly_false: {
    label: '대체로 거짓',
    bg: 'rgba(225, 29, 72, 0.05)',
    color: '#e11d48',
    border: '1px solid rgba(225, 29, 72, 0.15)',
  },
  false: {
    label: '거짓 (False)',
    bg: 'rgba(220, 38, 38, 0.08)',
    color: 'var(--danger)',
    border: '1px solid rgba(220, 38, 38, 0.2)',
  },
  hold: {
    label: '판단 보류',
    bg: 'var(--bg-3)',
    color: 'var(--text-2)',
    border: '1px solid var(--border-2)',
  },
};

export default function FactCheckListPage() {
  const router = useRouter();
  const { session } = useSession();
  const { factchecks, loading, voteFactCheck } = useFactChecks();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVerdict, setSelectedVerdict] = useState<string>('all');

  const [votedIds, setVotedIds] = useState<string[]>([]);

  // Filter and search checks
  const filteredChecks = factchecks.filter((item) => {
    const matchesSearch = 
      item.claim.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.evidence.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.authorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVerdict = selectedVerdict === 'all' || item.verdict === selectedVerdict;
    
    return matchesSearch && matchesVerdict;
  });

  const handleVote = async (factId: string, reaction: 'verified' | 'needs_review') => {
    if (!session) {
      alert('팩트체크 검증단 서명은 시민 로그인 세션이 요구됩니다.');
      router.push('/auth/login');
      return;
    }
    if (votedIds.includes(factId)) return;

    const success = await voteFactCheck(factId, reaction);
    if (success) {
      setVotedIds([...votedIds, factId]);
    }
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }} className="fade-in">
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span className="badge badge-accent">Civic Verification</span>
            <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>PHASE 4</span>
          </div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '12px', letterSpacing: '-0.02em' }}>
            시민 팩트체크 게시판
          </h1>
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-2)', lineHeight: 1.6, maxWidth: '800px' }}>
            시민들이 직접 주장과 근거 및 팩트 출처를 기록하여 정치 발언의 진위 여부를 다각도로 검증하는 집단지성 커뮤니티입니다. 
            검증된 데이터와 출처 유무에 근거하여 판단해 주세요.
          </p>
        </div>

        {session ? (
          <Link href="/factcheck/new" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            팩트체크 검증단 등록
          </Link>
        ) : (
          <button
            onClick={() => {
              alert('팩트체크 검증 등록은 시민 회원 로그인 후 이용하실 수 있습니다. 체험 로그인 페이지로 이동합니다.');
              router.push('/auth/login');
            }}
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <span>🔒</span>
            팩트체크 검증단 등록
          </button>
        )}
      </div>

      {/* ── Search and Filters ── */}
      <div 
        className="card-base" 
        style={{ 
          padding: '16px 20px', 
          marginBottom: '32px', 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'center', 
          gap: '16px', 
          flexWrap: 'wrap',
          backgroundColor: 'var(--bg-2)'
        }}
      >
        {/* Search Input */}
        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
          <input 
            type="text" 
            placeholder="주장, 근거, 검증단원 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 14px', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--border)', 
              backgroundColor: 'var(--bg-3)', 
              color: 'var(--text-1)',
              fontSize: 'var(--font-sm)',
              outline: 'none',
            }}
          />
        </div>

        {/* Filters Grid */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setSelectedVerdict('all')}
            className="btn-secondary" 
            style={{ 
              padding: '8px 14px', 
              fontSize: 'var(--font-xs)', 
              backgroundColor: selectedVerdict === 'all' ? 'var(--accent-bg)' : 'var(--bg-2)',
              borderColor: selectedVerdict === 'all' ? 'var(--accent)' : 'var(--border)'
            }}
          >
            전체 보기
          </button>
          
          {Object.entries(VERDICT_MAP).map(([verdictKey, details]) => (
            <button
              key={verdictKey}
              onClick={() => setSelectedVerdict(verdictKey)}
              className="btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: 'var(--font-xs)',
                backgroundColor: selectedVerdict === verdictKey ? details.bg : 'var(--bg-2)',
                borderColor: selectedVerdict === verdictKey ? details.color : 'var(--border)',
                color: selectedVerdict === verdictKey ? details.color : 'var(--text-2)'
              }}
            >
              {details.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Fact Check Grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} height="280px" />
          ))}
        </div>
      ) : filteredChecks.length === 0 ? (
        <div className="card-base" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-2)', backgroundColor: 'var(--bg-2)' }}>
          <p className="mono">NO_FACT_CHECKS_FOUND_FOR_CRITERIA</p>
        </div>
      ) : (
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', 
            gap: '24px' 
          }}
        >
          {filteredChecks.map((item, idx) => {
            const verdictDetails = VERDICT_MAP[item.verdict];
            const hasSources = item.sourceUrls && item.sourceUrls.length > 0;
            const isVoted = votedIds.includes(item.id);

            return (
              <div 
                key={item.id}
                className="card-base"
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  minHeight: '280px',
                  backgroundColor: 'var(--bg-2)',
                  animationDelay: `${idx * 0.05}s`
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span className="mono" style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-3)' }}>
                      VERIFY {item.id}
                    </span>

                    <span 
                      className="badge" 
                      style={{ 
                        backgroundColor: verdictDetails.bg, 
                        color: verdictDetails.color, 
                        border: verdictDetails.border 
                      }}
                    >
                      {verdictDetails.label}
                    </span>
                  </div>

                  <blockquote style={{ 
                    fontSize: 'var(--font-base)', 
                    fontWeight: 700, 
                    color: 'var(--text-1)', 
                    lineHeight: 1.5, 
                    marginBottom: '16px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    borderLeft: '3px solid var(--accent)',
                    paddingLeft: '10px',
                    fontStyle: 'normal'
                  }}>
                    {item.claim}
                  </blockquote>

                  <p style={{ 
                    fontSize: 'var(--font-sm)', 
                    color: 'var(--text-2)', 
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: '20px'
                  }}>
                    {item.evidence}
                  </p>
                </div>

                {/* Footer Controls */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-2)' }}>
                        {item.authorName}
                      </span>
                      {hasSources ? (
                        <span style={{ 
                          fontSize: '9px', 
                          fontWeight: 700, 
                          backgroundColor: 'rgba(22, 163, 74, 0.08)', 
                          color: 'var(--success)', 
                          padding: '1px 4px', 
                          borderRadius: '3px',
                          border: '1px solid rgba(22, 163, 74, 0.15)',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          출처 {item.sourceUrls.length}
                        </span>
                      ) : (
                        <span style={{ 
                          fontSize: '9px', 
                          fontWeight: 700, 
                          backgroundColor: 'var(--bg-3)', 
                          color: 'var(--text-3)', 
                          padding: '1px 4px', 
                          borderRadius: '3px',
                          border: '1px solid var(--border-2)',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          미검증
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                      {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Inline quick vote buttons */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => handleVote(item.id, 'verified')}
                        disabled={isVoted}
                        className="btn-secondary"
                        style={{
                          padding: '4px 8px',
                          fontSize: '10px',
                          borderColor: isVoted ? 'var(--border)' : 'var(--success)',
                          color: isVoted ? 'var(--text-3)' : 'var(--success)'
                        }}
                      >
                        ✓ 사실 {item.verifiedCount}
                      </button>
                      <button
                        onClick={() => handleVote(item.id, 'needs_review')}
                        disabled={isVoted}
                        className="btn-secondary"
                        style={{
                          padding: '4px 8px',
                          fontSize: '10px',
                          borderColor: isVoted ? 'var(--border)' : 'var(--danger)',
                          color: isVoted ? 'var(--text-3)' : 'var(--danger)'
                        }}
                      >
                        ✗ 오류 {item.needsReviewCount}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
