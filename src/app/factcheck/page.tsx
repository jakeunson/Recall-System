'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFactChecks, useSession } from '@/lib/hooks';
import { FactCheckVerdict } from '@/lib/types';
import { SkeletonCard } from '@/components/custom/SkeletonUI';

// VERDICT_MAP definition
export const VERDICT_MAP: Record<FactCheckVerdict, { label: string; bg: string; color: string; border: string }> = {
  true: {
    label: '사실 (True)',
    bg: 'bg-success/10',
    color: 'text-success',
    border: 'border-success/20',
  },
  mostly_true: {
    label: '대체로 사실',
    bg: 'bg-accent/10',
    color: 'text-accent',
    border: 'border-accent/20',
  },
  half_true: {
    label: '절반의 사실',
    bg: 'bg-warning/10',
    color: 'text-warning',
    border: 'border-warning/20',
  },
  mostly_false: {
    label: '대체로 거짓',
    bg: 'bg-rose-500/5',
    color: 'text-rose-600',
    border: 'border-rose-500/20',
  },
  false: {
    label: '거짓 (False)',
    bg: 'bg-danger/10',
    color: 'text-danger',
    border: 'border-danger/20',
  },
  hold: {
    label: '판단 보류',
    bg: 'bg-card',
    color: 'text-muted-foreground',
    border: 'border-border-2',
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
    <div className="max-w-[1200px] mx-auto py-8 px-6 fade-in">
      
      {/* ── Header ── */}
      <div className="flex flex-wrap justify-between items-start gap-5 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="badge badge-accent">Civic Verification</span>
            <span className="text-sm text-muted-foreground font-semibold font-mono">PHASE 4</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground mb-3 tracking-tight">
            시민 팩트체크 게시판
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-[800px]">
            시민들이 직접 주장과 근거 및 팩트 출처를 기록하여 정치 발언의 진위 여부를 다각도로 검증하는 집단지성 커뮤니티입니다. 
            검증된 데이터와 출처 유무에 근거하여 판단해 주세요.
          </p>
        </div>

        {session ? (
          <Link href="/factcheck/new" className="btn-primary inline-flex items-center gap-2">
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
            className="btn-primary inline-flex items-center gap-2 cursor-pointer"
          >
            <span>🔒</span>
            팩트체크 검증단 등록
          </button>
        )}
      </div>

      {/* ── Search and Filters ── */}
      <div className="bg-secondary card-base py-4 px-5 mb-8 flex flex-row items-center gap-4 flex-wrap">
        {/* Search Input */}
        <div className="flex-1 min-w-[280px] relative">
          <input 
            type="text" 
            placeholder="주장, 근거, 검증단원 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-5 py-3 rounded-sm border border-border bg-card text-sm text-foreground outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Filters Grid */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setSelectedVerdict('all')}
            className={`btn-secondary px-5 py-2 text-xs border transition-colors ${
              selectedVerdict === 'all' 
                ? 'bg-accent/10 border-accent text-accent' 
                : 'bg-card border-border text-muted-foreground hover:bg-secondary'
            }`}
          >
            전체 보기
          </button>
          
          {Object.entries(VERDICT_MAP).map(([verdictKey, details]) => {
            const isSelected = selectedVerdict === verdictKey;
            return (
              <button
                key={verdictKey}
                onClick={() => setSelectedVerdict(verdictKey)}
                className={`btn-secondary px-5 py-2 text-xs border transition-colors ${
                  isSelected 
                    ? `${details.bg} ${details.color}` 
                    : 'bg-card border-border text-muted-foreground hover:bg-secondary'
                }`}
                style={{ borderColor: isSelected ? 'var(--' + details.color.replace('text-', '') + ')' : undefined }} // simplified inline style for dynamic border
              >
                {details.label.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Fact Check Grid ── */}
      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} height="280px" />
          ))}
        </div>
      ) : filteredChecks.length === 0 ? (
        <div className="card-base bg-secondary py-12 px-6 text-center text-muted-foreground">
          <p className="font-mono">NO_FACT_CHECKS_FOUND_FOR_CRITERIA</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-6">
          {filteredChecks.map((item, idx) => {
            const verdictDetails = VERDICT_MAP[item.verdict];
            const hasSources = item.sourceUrls && item.sourceUrls.length > 0;
            const isVoted = votedIds.includes(item.id);

            return (
              <div 
                key={item.id}
                className="card-base bg-secondary flex flex-col justify-between min-h-[280px]"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-3.5">
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      VERIFY {item.id}
                    </span>

                    <span className={`badge border ${verdictDetails.bg} ${verdictDetails.color} ${verdictDetails.border}`}>
                      {verdictDetails.label}
                    </span>
                  </div>

                  <blockquote className="text-base font-bold text-foreground leading-relaxed mb-4 line-clamp-3 overflow-hidden text-ellipsis border-l-4 border-accent pl-3 not-italic">
                    {item.claim}
                  </blockquote>

                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 overflow-hidden text-ellipsis mb-5">
                    {item.evidence}
                  </p>
                </div>

                {/* Footer Controls */}
                <div className="border-t border-border pt-4 px-6 pb-6 flex justify-between items-center bg-card rounded-b-lg">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {item.authorName}
                      </span>
                      {hasSources ? (
                        <span className="text-xs font-bold font-mono bg-success/10 text-success px-1 py-0.5 rounded-sm border border-success/20">
                          출처 {item.sourceUrls.length}
                        </span>
                      ) : (
                        <span className="text-xs font-bold font-mono bg-card text-muted-foreground px-1 py-0.5 rounded-sm border border-border-2">
                          미검증
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Inline quick vote buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleVote(item.id, 'verified')}
                        disabled={isVoted}
                        className={`btn-secondary px-2 py-1 text-xs border transition-colors ${
                          isVoted ? 'border-border text-muted-foreground opacity-50 cursor-not-allowed' : 'border-success/50 text-success hover:bg-success/5'
                        }`}
                      >
                        ✓ 사실 {item.verifiedCount}
                      </button>
                      <button
                        onClick={() => handleVote(item.id, 'needs_review')}
                        disabled={isVoted}
                        className={`btn-secondary px-2 py-1 text-xs border transition-colors ${
                          isVoted ? 'border-border text-muted-foreground opacity-50 cursor-not-allowed' : 'border-danger/50 text-danger hover:bg-danger/5'
                        }`}
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
