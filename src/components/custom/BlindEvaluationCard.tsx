'use client';

import React from 'react';
import Link from 'next/link';
import { BlindQuiz } from '@/lib/types';

interface BlindEvaluationCardProps {
  quiz: BlindQuiz;
}

export default function BlindEvaluationCard({ quiz }: BlindEvaluationCardProps) {
  return (
    <Link 
      href={`/blind/${quiz.id}`} 
      className="card-base"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        textDecoration: 'none',
        color: 'inherit',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: '5px',
        backgroundColor: 'var(--accent)',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '8px' }}>
        <span style={{ 
          fontSize: '12px', 
          color: 'var(--text-3)', 
          fontWeight: 600,
          backgroundColor: 'var(--bg-3)',
          padding: '4px 10px',
          borderRadius: '16px'
        }}>
          {quiz.sourceType === 'parliament' ? '🎙️ 본회의 발언' : quiz.sourceType === 'news' ? '📰 뉴스 보도' : '📝 기타 출처'}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
          {new Date(quiz.createdAt).toLocaleDateString('ko-KR')}
        </span>
      </div>

      <div style={{
        padding: '16px',
        backgroundColor: 'var(--bg-3)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text-1)',
        fontSize: 'var(--font-base)',
        lineHeight: 1.6,
        fontWeight: 500,
        marginLeft: '8px',
      }}>
        "{quiz.maskedStatement}"
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: 'auto', 
        paddingTop: '16px',
        borderTop: '1px solid var(--border)',
        paddingLeft: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>
            참여 현황
          </span>
          <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 700 }}>
            {quiz.agreeCount + quiz.disagreeCount + quiz.holdCount}명
          </span>
        </div>
        
        <div style={{ 
          fontSize: '13px', 
          fontWeight: 600, 
          color: 'var(--text-2)',
          backgroundColor: 'var(--bg-2)',
          border: '1px solid var(--border-2)',
          padding: '6px 14px',
          borderRadius: '20px',
          transition: 'all 0.15s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--accent)';
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.borderColor = 'var(--accent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-2)';
          e.currentTarget.style.color = 'var(--text-2)';
          e.currentTarget.style.borderColor = 'var(--border-2)';
        }}
        >
          평가하고 결과 보기 →
        </div>
      </div>
    </Link>
  );
}
