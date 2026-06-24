'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SkeletonCard } from '@/components/custom/SkeletonUI';

const BOARD_TYPE_LABEL: Record<string, string> = {
  blind: '블라인드 평가',
  question: '공개 질의',
  bill: '법안 토론',
};

const BOARD_TYPE_COLOR: Record<string, string> = {
  blind: 'bg-accent/10 text-accent',
  question: 'bg-warning/10 text-warning',
  bill: 'bg-success/10 text-success',
};

interface Post {
  id: string;
  boardType: string;
  title: string;
  meta: string;
  href: string;
}

interface RecentActivityFeedProps {
  posts: Post[];
  loading: boolean;
}

export default function RecentActivityFeed({ posts, loading }: RecentActivityFeedProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'blind' | 'question' | 'bill'>('all');

  const filteredPosts = posts.filter(post =>
    activeTab === 'all' ? true : post.boardType === activeTab
  );

  return (
    <section className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      {/* 탭 헤더 */}
      <div className="pt-4 px-5 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">최근 활동</h2>
        </div>
        <div className="flex items-center gap-2">
          {([
            { key: 'all', label: '전체' },
            { key: 'blind', label: '블라인드' },
            { key: 'question', label: '공개 질의' },
            { key: 'bill', label: '법안 토론' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab-item px-4 py-2 text-sm ${activeTab === tab.key ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 피드 리스트 */}
      {loading ? (
        <div className="p-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} height="60px" />)}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm">
          게시글이 없습니다.
        </div>
      ) : (
        <div>
          {filteredPosts.map((post) => (
            <Link key={post.id} href={post.href} className="post-row px-5 py-4 flex items-center gap-4 hover:bg-muted transition-colors border-b border-border last:border-0">
              {/* 분류 뱃지 */}
              <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-md ${BOARD_TYPE_COLOR[post.boardType] || 'bg-muted text-muted-foreground'} min-w-[70px] text-center`}>
                {BOARD_TYPE_LABEL[post.boardType] ?? post.boardType}
              </span>

              {/* 제목 */}
              <span className="flex-1 text-sm font-medium text-foreground truncate">
                {post.title}
              </span>

              {/* 메타 */}
              <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                {post.meta}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
