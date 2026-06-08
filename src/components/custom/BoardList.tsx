'use client';

import React from 'react';
import Link from 'next/link';

interface BoardListProps {
  posts: {
    id: string;
    title: string;
    author: string;
    views: number;
    likes: number;
    createdAt: string;
    category?: string;
  }[];
  basePath?: string;
}

export default function BoardList({ posts, basePath = '/board' }: BoardListProps) {
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}.${day}`;
  };

  return (
    <div className="card-base" style={{ padding: 0, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '14px' }}>
        <thead style={{ backgroundColor: 'var(--bg-3)', borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>
          <tr>
            <th style={{ padding: '12px 16px', fontWeight: 600, width: '60px' }}>번호</th>
            {posts[0]?.category && <th style={{ padding: '12px 16px', fontWeight: 600, width: '100px' }}>분류</th>}
            <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'left' }}>제목</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, width: '120px' }}>작성자</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, width: '80px' }}>작성일</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, width: '60px' }}>조회</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, width: '60px' }}>추천</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post, index) => (
            <tr key={post.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <td style={{ padding: '12px 16px', color: 'var(--text-3)' }}>{posts.length - index}</td>
              {post.category && (
                <td style={{ padding: '12px 16px', color: 'var(--text-2)', fontSize: '13px' }}>
                  {post.category}
                </td>
              )}
              <td style={{ padding: '12px 16px', textAlign: 'left' }}>
                <Link href={`${basePath}/${post.id}`} style={{ fontWeight: 500, color: 'var(--text-1)' }}>
                  {post.title}
                </Link>
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--text-2)' }}>{post.author}</td>
              <td style={{ padding: '12px 16px', color: 'var(--text-3)' }}>{formatDate(post.createdAt)}</td>
              <td style={{ padding: '12px 16px', color: 'var(--text-3)' }}>{post.views}</td>
              <td style={{ padding: '12px 16px', color: 'var(--accent)', fontWeight: 600 }}>{post.likes}</td>
            </tr>
          ))}
          {posts.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: '32px', color: 'var(--text-3)' }}>
                등록된 게시글이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
