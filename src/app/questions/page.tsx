'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuestions, useSession } from '@/lib/hooks';
import { SkeletonCard } from '@/components/ui/SkeletonUI';

export default function PublicQuestionsPage() {
  const router = useRouter();
  const { session } = useSession();
  const { questions, loading, upvoteQuestion, hasUpvoted } = useQuestions();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'answered'>('all');

  const handleVote = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      alert('질문에 공감하려면 로그인이 필요합니다.');
      router.push('/auth/login');
      return;
    }

    await upvoteQuestion(id);
  };

  const filteredQuestions = questions.filter((q) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      q.title.toLowerCase().includes(query) ||
      q.content.toLowerCase().includes(query) ||
      q.targetMember.toLowerCase().includes(query) ||
      q.authorName.toLowerCase().includes(query);

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'open') return matchesSearch && q.status === 'open';
    if (activeTab === 'answered') return matchesSearch && q.status === 'answered';
    return matchesSearch;
  });

  const sortedQuestions = [...filteredQuestions].sort((a, b) => b.voteCount - a.voteCount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="fade-in">
      
      {/* ── Header ── */}
      <section style={{
        backgroundColor: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '24px 28px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-warning" style={{ fontSize: '11px' }}>공개 질의</span>
            </div>
            <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--text-1)', marginBottom: '8px' }}>
              국회의원 공개 질의
            </h1>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.6 }}>
              의원의 의정 활동에 대해 시민들이 직접 질문하고 해명을 요구하는 공간입니다.<br />
              많은 공감을 받은 질문은 의원에게 공식 전달되며, 7일 이내에 답변이 제공됩니다.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
            <Link href="/questions/new" className="btn-primary" style={{ padding: '12px 24px', fontSize: 'var(--font-sm)', fontWeight: 700 }}>
              ✍️ 질문 등록하기
            </Link>
          </div>
        </div>
      </section>

      {/* ── Filter & Search ── */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div className="tab-bar" style={{ gap: '4px' }}>
          <button
            onClick={() => setActiveTab('all')}
            className={`tab-item${activeTab === 'all' ? ' active' : ''}`}
          >
            전체 질문
          </button>
          <button
            onClick={() => setActiveTab('open')}
            className={`tab-item${activeTab === 'open' ? ' active' : ''}`}
          >
            답변 대기
          </button>
          <button
            onClick={() => setActiveTab('answered')}
            className={`tab-item${activeTab === 'answered' ? ' active' : ''}`}
          >
            답변 완료
          </button>
        </div>

        <input
          type="text"
          placeholder="의원명, 질문 제목/내용 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-base"
          style={{ maxWidth: '300px' }}
        />
      </div>

      {/* ── Question List ── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '20px' 
      }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} height="180px" />
          ))
        ) : sortedQuestions.length === 0 ? (
          <div className="card-base" style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-3)', gridColumn: '1 / -1' }}>
            등록된 질문이 없습니다.
          </div>
        ) : (
          sortedQuestions.map((q) => {
            const isAnswered = q.status === 'answered';
            const now = new Date();
            const deadline = q.deadline ? new Date(q.deadline) : null;
            const isExpired = deadline ? deadline.getTime() < now.getTime() : false;
            const alreadyVoted = hasUpvoted(q.id);

            // 잔여 기한 계산 (PRD Section 3.1.1 SLA 압박 시각화)
            let deadlineBadge = '';
            if (deadline && !isAnswered) {
              const diffMs = deadline.getTime() - now.getTime();
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              if (isExpired) {
                deadlineBadge = `+${Math.abs(diffDays)}일 초과`;
              } else {
                deadlineBadge = `D-${diffDays}일`;
              }
            }

            let statusText = '⏳ 답변 대기';
            let statusColor = 'var(--warning)';
            let statusBg = 'rgba(217, 119, 6, 0.08)';

            if (isAnswered) {
              statusText = '✔️ 답변 완료';
              statusColor = 'var(--success)';
              statusBg = 'rgba(22, 163, 74, 0.08)';
            } else if (isExpired) {
              statusText = '🚨 기한 만료';
              statusColor = 'var(--danger)';
              statusBg = 'rgba(220, 38, 38, 0.08)';
            }

            return (
              <div 
                key={q.id}
                className="card-base"
                style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px',
                      backgroundColor: statusBg, color: statusColor,
                    }}>
                      {statusText}
                    </div>
                    {deadlineBadge && (
                      <span style={{
                        fontSize: '10px', fontWeight: 700,
                        padding: '2px 7px', borderRadius: '8px',
                        backgroundColor: isExpired ? 'rgba(220, 38, 38, 0.06)' : 'rgba(217, 119, 6, 0.06)',
                        color: isExpired ? 'var(--danger)' : 'var(--warning)',
                        border: `1px solid ${isExpired ? 'rgba(220,38,38,0.15)' : 'rgba(217,119,6,0.15)'}`,
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {deadlineBadge}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleVote(q.id, e)}
                    disabled={alreadyVoted}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-2)',
                      backgroundColor: alreadyVoted ? 'var(--bg-3)' : 'var(--bg-2)', padding: '6px 12px', borderRadius: '16px', fontSize: 'var(--font-xs)',
                      fontWeight: 600, color: alreadyVoted ? 'var(--accent)' : 'var(--text-2)', cursor: alreadyVoted ? 'default' : 'pointer', transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if(!alreadyVoted) e.currentTarget.style.backgroundColor = 'var(--bg-3)';
                    }}
                    onMouseLeave={(e) => {
                      if(!alreadyVoted) e.currentTarget.style.backgroundColor = 'var(--bg-2)';
                    }}
                  >
                    <span>👍 공감</span>
                    <strong style={{ color: 'var(--text-1)' }}>{q.voteCount}</strong>
                  </button>
                </div>

                <Link href={`/questions/${q.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-1)', marginBottom: '8px', lineHeight: 1.4 }}>
                    {q.title}
                  </h3>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: 'var(--font-xs)', color: 'var(--text-2)', marginBottom: '16px' }}>
                    <span>대상: <strong style={{ color: 'var(--text-1)' }}>{q.targetMember}</strong></span>
                    <span style={{ color: 'var(--border-2)' }}>|</span>
                    <span>작성자: <strong>{q.authorName}</strong></span>
                  </div>

                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                    {q.content}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', marginTop: 'auto', paddingTop: '16px', fontSize: '12px', color: 'var(--text-3)' }}>
                    <span>{new Date(q.createdAt).toLocaleDateString('ko-KR')} 작성</span>
                    {deadline && !isAnswered && (
                      <span style={{ color: isExpired ? 'var(--danger)' : 'var(--warning)', fontWeight: 500 }}>
                        {isExpired
                          ? `🚨 기한 만료 (${deadline.toLocaleDateString('ko-KR')})`
                          : `${deadline.toLocaleDateString('ko-KR')}까지 답변`}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
