'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuestions, useSession } from '@/lib/hooks';
import { SkeletonCard } from '@/components/custom/SkeletonUI';

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
      router.push('/login');
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
    <div className="flex flex-col gap-6 fade-in">
      
      {/* ── Header ── */}
      <section className="bg-secondary border border-border rounded-md px-7 py-6">
        <div className="flex justify-between items-start flex-wrap gap-5">
          <div className="flex-1 min-w-[300px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-warning text-sm">공개 질의</span>
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              국회의원 공개 질의
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              의원의 의정 활동에 대해 시민들이 직접 질문하고 해명을 요구하는 공간입니다.<br />
              많은 공감을 받은 질문은 의원에게 공식 전달되며, 7일 이내에 답변이 제공됩니다.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <Link href="/questions/new" className="btn-primary px-6 py-3 text-sm font-bold">
              ✍️ 질문 등록하기
            </Link>
          </div>
        </div>
      </section>

      {/* ── Filter & Search ── */}
      <div className="flex gap-4 items-center justify-between flex-wrap">
        <div className="tab-bar gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`tab-item ${activeTab === 'all' ? 'active' : ''}`}
          >
            전체 질문
          </button>
          <button
            onClick={() => setActiveTab('open')}
            className={`tab-item ${activeTab === 'open' ? 'active' : ''}`}
          >
            답변 대기
          </button>
          <button
            onClick={() => setActiveTab('answered')}
            className={`tab-item ${activeTab === 'answered' ? 'active' : ''}`}
          >
            답변 완료
          </button>
        </div>

        <input
          type="text"
          placeholder="의원명, 질문 제목/내용 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-base max-w-[300px]"
        />
      </div>

      {/* ── Question List ── */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} height="180px" />
          ))
        ) : sortedQuestions.length === 0 ? (
          <div className="card-base py-16 px-10 text-center text-muted-foreground col-[1/-1]">
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
            let statusColor = 'text-warning';
            let statusBg = 'bg-warning/10';

            if (isAnswered) {
              statusText = '✔️ 답변 완료';
              statusColor = 'text-success';
              statusBg = 'bg-success/10';
            } else if (isExpired) {
              statusText = '🚨 기한 만료';
              statusColor = 'text-danger';
              statusBg = 'bg-danger/10';
            }

            return (
              <div 
                key={q.id}
                className="card-base p-6 flex flex-col group"
              >
                <div className="flex justify-between items-center mb-3.5">
                  <div className="flex items-center gap-2">
                    <div className={`text-sm font-bold px-2.5 py-1 rounded-full ${statusBg} ${statusColor}`}>
                      {statusText}
                    </div>
                    {deadlineBadge && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full font-mono border ${
                        isExpired 
                          ? 'bg-danger/5 text-danger border-danger/15' 
                          : 'bg-warning/5 text-warning border-warning/15'
                      }`}>
                        {deadlineBadge}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleVote(q.id, e)}
                    disabled={alreadyVoted}
                    className={`inline-flex items-center gap-2 border px-3 py-3 rounded-full text-xs font-semibold transition-colors duration-200 ${
                      alreadyVoted 
                        ? 'bg-secondary border-border-2 text-accent cursor-default' 
                        : 'bg-card border-border text-muted-foreground hover:bg-secondary cursor-pointer'
                    }`}
                  >
                    <span>👍 공감</span>
                    <strong className="text-foreground">{q.voteCount}</strong>
                  </button>
                </div>

                <Link href={`/questions/${q.id}`} className="flex-1 flex flex-col group">
                  <h3 className="text-base font-bold text-foreground mb-2 leading-snug transition-colors group-hover:text-accent">
                    {q.title}
                  </h3>

                  <div className="flex gap-2 items-center text-xs text-muted-foreground mb-4">
                    <span>대상: <strong className="text-foreground">{q.targetMember}</strong></span>
                    <span className="text-border-2">|</span>
                    <span>작성자: <strong>{q.authorName}</strong></span>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 overflow-hidden mb-0">
                    {q.content}
                  </p>

                  <div className="flex justify-between border-t border-border mt-auto pt-4 text-xs text-muted-foreground">
                    <span>{new Date(q.createdAt).toLocaleDateString('ko-KR')} 작성</span>
                    {deadline && !isAnswered && (
                      <span className={`font-medium ${isExpired ? 'text-danger' : 'text-warning'}`}>
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
