'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MOCK_PROPOSALS } from '@/lib/mock-data';
import { BillProposal, UserProfile } from '@/lib/types';

export default function CitizenProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<BillProposal[]>(MOCK_PROPOSALS);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSession, setUserSession] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('user_session');
      if (savedSession) {
        try { setUserSession(JSON.parse(savedSession)); } catch { /* ignore */ }
      }

      const savedProposals = localStorage.getItem('user_proposals');
      if (savedProposals) {
        try {
          const parsed = JSON.parse(savedProposals) as BillProposal[];
          setProposals([...MOCK_PROPOSALS, ...parsed]);
        } catch { /* ignore */ }
      }
    }
  }, []);

  // 공감 투표 처리 (비로그인 차단)
  const handleUpvote = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userSession) {
      alert('공감 추천은 시민 회원 로그인 후 이용하실 수 있습니다. 체험 로그인 페이지로 이동합니다.');
      router.push('/auth/login');
      return;
    }

    const voteKey = `upvoted_proposal_${id}`;
    if (localStorage.getItem(voteKey)) return;
    localStorage.setItem(voteKey, 'true');

    const updated = proposals.map((p) =>
      p.id === id ? { ...p, upvoteCount: p.upvoteCount + 1 } : p
    );
    setProposals(updated);

    const savedProposals = localStorage.getItem('user_proposals');
    if (savedProposals) {
      try {
        const parsed = JSON.parse(savedProposals) as BillProposal[];
        const idx = parsed.findIndex((p) => p.id === id);
        if (idx !== -1) {
          parsed[idx].upvoteCount += 1;
          localStorage.setItem('user_proposals', JSON.stringify(parsed));
        }
      } catch { /* ignore */ }
    }
  };

  const filteredProposals = proposals.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(query) ||
      p.purpose.toLowerCase().includes(query) ||
      p.authorName.toLowerCase().includes(query)
    );
  });

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span className="badge badge-accent">시민 협력 입법</span>
              <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>제6단계</span>
            </div>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 600, color: 'var(--text-1)', marginBottom: '8px' }}>
              ✍️ 시민 입법 제안 피드
            </h1>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.6 }}>
              시민이 직접 법안 초안을 기획 발의하고, 커뮤니티 집단지성과 전문 법률 자문단의 검토를 거쳐<br />
              완전한 개정 법안으로 조율해 나갑니다.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
            <Link href="/bills/propose/new" className="btn-primary" style={{ padding: '12px 20px', fontSize: 'var(--font-sm)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span>💡 시민 입법안 발의하기</span>
            </Link>
            {userSession && (
              <div className="badge" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', padding: '6px 12px', fontSize: 'var(--font-xs)' }}>
                시민 위원: <strong>{userSession.displayName}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 검색바 */}
      <div style={{ marginBottom: '24px' }} className="fade-in">
        <input
          type="text"
          placeholder="법안명, 입법 취지, 제안자 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)', backgroundColor: 'var(--bg-2)',
            color: 'var(--text-1)', fontSize: 'var(--font-sm)', outline: 'none'
          }}
        />
      </div>

      {/* 제안 목록 (카드 뷰) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '24px' 
      }} className="fade-in">
        {filteredProposals.length === 0 ? (
          <div className="card-base" style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-3)' }}>
            검색 조건에 맞는 시민 입법 제안이 존재하지 않습니다.
          </div>
        ) : (
          filteredProposals.map((proposal) => {
            let statusText = '📝 초안 검토';
            let statusColor = 'var(--text-3)';
            let statusBg = 'var(--bg-3)';

            if (proposal.status === 'community_review') {
              statusText = '👥 시민 검토 중'; statusColor = 'var(--accent)'; statusBg = 'var(--accent-bg)';
            } else if (proposal.status === 'legal_review') {
              statusText = '⚖️ 법률 자문 진행'; statusColor = 'var(--warning)'; statusBg = 'rgba(251, 191, 36, 0.05)';
            } else if (proposal.status === 'finalized') {
              statusText = '✨ 입법 완성'; statusColor = 'var(--success)'; statusBg = 'rgba(22, 163, 74, 0.05)';
            }

            return (
              <Link
                href={`/bills/propose/${proposal.id}`}
                key={proposal.id}
                className="card-base card-hover"
                style={{
                  padding: '28px', display: 'block', textDecoration: 'none', position: 'relative',
                  borderLeft: proposal.status === 'finalized' ? '4px solid var(--success)' : '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                  <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, backgroundColor: statusBg, color: statusColor, padding: '3px 8px', borderRadius: '4px' }}>
                    {statusText}
                  </span>

                  <button
                    onClick={(e) => handleUpvote(proposal.id, e)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      border: '1px solid var(--border)', backgroundColor: 'var(--bg-3)',
                      padding: '5px 12px', borderRadius: '6px', fontSize: 'var(--font-xs)',
                      fontWeight: 700, color: 'var(--text-2)', cursor: 'pointer', zIndex: 10
                    }}
                  >
                    <span>▲ 공감</span>
                    <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{proposal.upvoteCount}</strong>
                  </button>
                </div>

                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--text-1)', marginBottom: '10px', lineHeight: 1.4 }}>
                  {proposal.title}
                </h3>

                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {proposal.purpose}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-2)', paddingTop: '12px', fontSize: '11px', color: 'var(--text-3)' }}>
                  <span>제안자: <strong>{proposal.authorName}</strong></span>
                  <span>{new Date(proposal.createdAt).toLocaleDateString('ko-KR')}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
