'use client';

import React, { useState, useEffect } from 'react';

interface NaverNewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
}

interface MemberNewsProps {
  memberName: string;
  isBlind: boolean;
}

export default function MemberNews({ memberName, isBlind }: MemberNewsProps) {
  const [news, setNews] = useState<NaverNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true);
        setError(false);
        
        // 의정 활동을 결합하여 명확한 의원 뉴스 수집 (노이즈 방지)
        const response = await fetch(`/api/news?q=${encodeURIComponent(memberName + ' 국회의원 의정')}`);
        
        if (!response.ok) {
          throw new Error('News API response not ok');
        }

        const data = await response.json();
        setNews(data);
      } catch (err) {
        console.error('Failed to load lawmaker news:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (memberName) {
      fetchNews();
    }
  }, [memberName]);

  // 네이버 API의 <b> 등의 HTML 노이즈 기호를 정규식으로 정제하는 헬퍼
  const cleanHtml = (text: string) => {
    if (!text) return '';
    return text
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&apos;/g, "'");
  };

  // 날짜 형식 이쁘게 다듬기
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-base" style={{ padding: '16px', backgroundColor: 'var(--bg-2)', border: '1px solid var(--border-2)', animation: 'pulse 1.5s infinite' }}>
            <div style={{ height: '14px', backgroundColor: 'var(--bg-3)', width: '70%', borderRadius: '3px', marginBottom: '8px' }}></div>
            <div style={{ height: '10px', backgroundColor: 'var(--bg-3)', width: '90%', borderRadius: '2px', marginBottom: '6px' }}></div>
            <div style={{ height: '8px', backgroundColor: 'var(--bg-3)', width: '30%', borderRadius: '2px' }}></div>
          </div>
        ))}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    );
  }

  if (error || news.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--bg-2)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: 0 }}>
          📰 검색 제휴 뉴스 또는 등록된 공식 활동 보도가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* ⚠️ 인지 편향 블라인드 모드 작동 경고 배지 */}
      {isBlind && (
        <div style={{ 
          fontSize: '10px', 
          fontWeight: 800, 
          color: 'var(--warning)', 
          backgroundColor: 'rgba(251, 191, 36, 0.04)', 
          padding: '6px 12px', 
          borderRadius: '4px', 
          border: '1px solid rgba(251, 191, 36, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          ⚠️ 인지 편향 제거 스위치가 가동되어 있습니다. 뉴스 타이틀 내 특정 소속 당명 및 진영 선동 단어가 제거 마스킹되어 보일 수 있습니다.
        </div>
      )}

      {news.map((item, idx) => {
        let cleanedTitle = cleanHtml(item.title);
        let cleanedDesc = cleanHtml(item.description);

        // 블라인드 모드 시 제목과 본문에서 정당명을 마스킹하여 진영 편향 사전 예방
        if (isBlind) {
          cleanedTitle = cleanedTitle
            .replace(/더불어민주당|민주당/g, '[A당]')
            .replace(/국민의힘|국힘/g, '[B당]')
            .replace(/조국혁신당/g, '[C당]')
            .replace(/개혁신당/g, '[D당]');
            
          cleanedDesc = cleanedDesc
            .replace(/더불어민주당|민주당/g, '[A당]')
            .replace(/국민의힘|국힘/g, '[B당]')
            .replace(/조국혁신당/g, '[C당]')
            .replace(/개혁신당/g, '[D당]');
        }

        return (
          <a
            key={idx}
            href={item.originallink || item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="card-base"
            style={{
              display: 'block',
              textDecoration: 'none',
              padding: '16px',
              backgroundColor: 'var(--bg-2)',
              border: '1px solid var(--border-2)',
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
              <strong style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.4 }}>
                {cleanedTitle}
              </strong>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-4)', flexShrink: 0, marginTop: '2px' }}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </div>
            
            <p style={{ fontSize: '10px', color: 'var(--text-3)', lineHeight: 1.5, margin: '0 0 8px 0' }}>
              {cleanedDesc.length > 120 ? `${cleanedDesc.substring(0, 120)}...` : cleanedDesc}
            </p>

            <span style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
              🕒 보도일: {formatDate(item.pubDate)}
            </span>
          </a>
        );
      })}
    </div>
  );
}
