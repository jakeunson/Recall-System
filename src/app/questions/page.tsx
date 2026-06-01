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

  // Upvote Question
  const handleVote = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      alert('소명 요구 동의 서명은 시민 회원 로그인 후 이용하실 수 있습니다. 체험 로그인 페이지로 이동합니다.');
      router.push('/auth/login');
      return;
    }

    await upvoteQuestion(id);
  };

  // Filter and search questions
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

  // Sort by vote count descending
  const sortedQuestions = [...filteredQuestions].sort((a, b) => b.voteCount - a.voteCount);

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto' }} className="fade-in">
      
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span className="badge badge-accent">대국민 소명 요구</span>
              <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>제7단계</span>
            </div>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 600, color: 'var(--text-1)', marginBottom: '8px' }}>
              🚨 의정 소명 공개 요구 피드 (공개 소환)
            </h1>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.6 }}>
              시민들이 특정 국회의원의 불투명한 의정 활동, 표결 이탈, 혹은 공약 불이행에 대한 공식적인 해명을 서면 요구합니다.<br />
              모든 질의에는 <strong>7일의 답변 데드라인(SLA)</strong>이 적용되며 기한 초과 미답변 시 평판 감점과 공식 소환장이 발송됩니다.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
            <Link href="/questions/new" className="btn-primary" style={{ padding: '12px 20px', fontSize: 'var(--font-sm)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span>🚨 소명 요구서 발의하기</span>
            </Link>
            {session && (
              <div className="badge" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', padding: '6px 12px', fontSize: 'var(--font-xs)' }}>
                시민 위원 서명: <strong>{session.displayName}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-3)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '6px 14px', borderRadius: '4px', border: 'none', fontSize: 'var(--font-xs)', fontWeight: 700, cursor: 'pointer',
              backgroundColor: activeTab === 'all' ? 'var(--bg-2)' : 'transparent',
              color: activeTab === 'all' ? 'var(--text-1)' : 'var(--text-3)',
            }}
          >
            전체
          </button>
          <button
            onClick={() => setActiveTab('open')}
            style={{
              padding: '6px 14px', borderRadius: '4px', border: 'none', fontSize: 'var(--font-xs)', fontWeight: 700, cursor: 'pointer',
              backgroundColor: activeTab === 'open' ? 'var(--bg-2)' : 'transparent',
              color: activeTab === 'open' ? 'var(--warning)' : 'var(--text-3)',
            }}
          >
            답변 대기
          </button>
          <button
            onClick={() => setActiveTab('answered')}
            style={{
              padding: '6px 14px', borderRadius: '4px', border: 'none', fontSize: 'var(--font-xs)', fontWeight: 700, cursor: 'pointer',
              backgroundColor: activeTab === 'answered' ? 'var(--bg-2)' : 'transparent',
              color: activeTab === 'answered' ? 'var(--success)' : 'var(--text-3)',
            }}
          >
            답변 완료
          </button>
        </div>

        <input
          type="text"
          placeholder="의원명, 소명 요구 제목/내용 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-2)', color: 'var(--text-1)', fontSize: 'var(--font-xs)', outline: 'none',
            flex: 1, maxWidth: '400px', minWidth: '220px'
          }}
        />
      </div>

      {/* Question List */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '24px' 
      }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} height="180px" />
          ))
        ) : sortedQuestions.length === 0 ? (
          <div className="card-base" style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-3)', backgroundColor: 'var(--bg-2)' }}>
            필터 조건에 부합하는 시민들의 공개 소명 요구서가 없습니다.
          </div>
        ) : (
          sortedQuestions.map((q) => {
            const isAnswered = q.status === 'answered';
            const isExpired = q.deadline ? new Date(q.deadline).getTime() < new Date().getTime() : false;
            const alreadyVoted = hasUpvoted(q.id);

            let statusText = '⏳ 답변 대기';
            let statusColor = 'var(--warning)';
            let statusBg = 'rgba(251, 191, 36, 0.05)';

            if (isAnswered) {
              statusText = '✔️ 소명 완료';
              statusColor = 'var(--success)';
              statusBg = 'rgba(22, 163, 74, 0.05)';
            } else if (isExpired) {
              statusText = '🚨 소명 만료';
              statusColor = 'var(--danger)';
              statusBg = 'rgba(220, 38, 38, 0.04)';
            }

            return (
              <div 
                key={q.id}
                className="card-base"
                style={{ padding: '28px', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-2)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', fontWeight: 700 }}>
                      {q.questionCode}
                    </span>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px',
                      backgroundColor: statusBg, color: statusColor, border: `1px solid ${statusColor}20`
                    }}>
                      {statusText}
                    </span>
                  </div>

                  {/* Vote button */}
                  <button
                    onClick={(e) => handleVote(q.id, e)}
                    disabled={alreadyVoted}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border)',
                      backgroundColor: alreadyVoted ? 'var(--accent-bg)' : 'var(--bg-3)', padding: '5px 12px', borderRadius: '6px', fontSize: 'var(--font-xs)',
                      fontWeight: 700, color: alreadyVoted ? 'var(--accent)' : 'var(--text-2)', cursor: alreadyVoted ? 'not-allowed' : 'pointer', zIndex: 5, transition: 'all 0.2s'
                    }}
                  >
                    <span>▲ 요구동의</span>
                    <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{q.voteCount}</strong>
                  </button>
                </div>

                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--text-1)', marginBottom: '10px', lineHeight: 1.4 }}>
                  {q.title}
                </h3>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: 'var(--font-xs)', color: 'var(--text-2)', marginBottom: '16px' }}>
                  <span>소명 대상: <strong style={{ color: 'var(--accent)' }}>{q.targetMember}</strong></span>
                  <span style={{ color: 'var(--border)' }}>|</span>
                  <span>발의 시민: <strong>{q.authorName}</strong></span>
                </div>

                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-3)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                  {q.content}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-2)', marginTop: '20px', paddingTop: '12px', fontSize: '11px', color: 'var(--text-3)' }}>
                  <span>발의일: {new Date(q.createdAt).toLocaleDateString('ko-KR')}</span>
                  {q.deadline && !isAnswered && (
                    <span style={{ color: isExpired ? 'var(--danger)' : 'var(--text-2)', fontWeight: 600 }}>
                      {isExpired ? '답변기한 경과' : `답변 기한: ${new Date(q.deadline).toLocaleDateString('ko-KR')}`}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
