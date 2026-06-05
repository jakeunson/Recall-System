'use client';

import React from 'react';
import Link from 'next/link';
import { MOCK_MEMBERS } from '@/lib/mock-data';

// trustScore 기반 아바타 배경색 반환
function getAvatarColor(score: number): { bg: string; color: string } {
  if (score >= 75) return { bg: 'rgba(22, 163, 74, 0.1)', color: 'var(--success)' };
  if (score >= 50) return { bg: 'rgba(217, 119, 6, 0.1)', color: 'var(--warning)' };
  return { bg: 'rgba(220, 38, 38, 0.08)', color: 'var(--danger)' };
}

// 정당별 브랜드 색상 (Hex -> RGBA 지원)
function getPartyColor(party: string): string {
  switch (party) {
    case '국민의힘': return '#E61E2B';
    case '더불어민주당': return '#004EA2';
    case '개혁신당': return '#FF7F00';
    case '조국혁신당': return '#0073CF';
    default: return 'var(--border-2)';
  }
}

export default function MembersPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 600, marginBottom: '6px' }}>국회의원 평가</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 'var(--font-sm)' }}>전체 의원의 프로필과 최신 평가 기록을 확인하세요.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <select style={{
              appearance: 'none',
              padding: '9px 32px 9px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-2)',
              backgroundColor: 'var(--bg-2)',
              fontSize: 'var(--font-sm)',
              color: 'var(--text-1)',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
            }}>
              <option>전체 정당</option>
              <option>국민의힘</option>
              <option>더불어민주당</option>
              <option>개혁신당</option>
              <option>조국혁신당</option>
            </select>
            <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <div style={{ position: 'relative' }}>
            <select style={{
              appearance: 'none',
              padding: '9px 32px 9px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-2)',
              backgroundColor: 'var(--bg-2)',
              fontSize: 'var(--font-sm)',
              color: 'var(--text-1)',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
            }}>
              <option>전체 지역</option>
              <option>수도권</option>
              <option>영남권</option>
            </select>
            <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {MOCK_MEMBERS.map((member) => {
          const avatarColors = getAvatarColor(member.trustScore);
          const partyColor = getPartyColor(member.party);
          const defenseRate = member.indicators?.find(ind => ind.label === '내로남불 방어율')?.value || 0;
          const recentBill = member.sponsoredBills?.[0]?.title || '최근 대표발의 법안 없음';

          return (
            <Link key={member.id} href={`/members/${member.id}`} className="card-base" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              textDecoration: 'none',
              color: 'inherit',
              padding: '24px 20px 20px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              {/* 좌측 정당 색상 띠 (UI 통일성) */}
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: partyColor }} />

              {/* Member Identity */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: avatarColors.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--font-lg)',
                  fontWeight: 700,
                  color: avatarColors.color,
                  flexShrink: 0,
                  overflow: 'hidden',
                  border: `2px solid ${partyColor}33`,
                }}>
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    member.name.substring(0, 1)
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>{member.name}</span>
                    <span style={{
                      fontSize: '11px',
                      color: partyColor,
                      backgroundColor: `${partyColor}11`,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${partyColor}33`,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                    }}>
                      {member.party}
                    </span>
                  </div>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)' }}>{member.region}</span>
                </div>
              </div>

              {/* 상태 표시 / 한줄평 */}
              <div style={{ 
                fontSize: '11px', color: 'var(--text-2)', backgroundColor: 'var(--bg-3)', 
                padding: '8px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', 
                alignItems: 'center', gap: '6px', border: '1px solid var(--border)' 
              }}>
                <span style={{ fontSize: '13px' }}>📜</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  최근 입법: {recentBill}
                </span>
              </div>

              {/* 핵심 지표 3개 고정 배지형 노출 */}
              <div style={{
                display: 'flex',
                gap: '8px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border)',
                justifyContent: 'space-between',
              }}>
                {/* 신뢰도 */}
                <div style={{ flex: 1, backgroundColor: 'var(--bg-3)', padding: '10px 4px', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '4px', fontWeight: 600 }}>신뢰도</div>
                  <div style={{ fontSize: 'var(--font-lg)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: avatarColors.color }}>
                    {member.trustScore}
                  </div>
                </div>
                
                {/* 내로남불 방어율 */}
                <div style={{ flex: 1, backgroundColor: 'var(--bg-3)', padding: '10px 4px', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '4px', fontWeight: 600 }}>내로남불 방어</div>
                  <div style={{ fontSize: 'var(--font-lg)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: defenseRate >= 70 ? 'var(--success)' : defenseRate >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                    {defenseRate}%
                  </div>
                </div>

                {/* 출석률 (기본 첫번째 지표) */}
                {member.indicators?.[0] && (
                  <div style={{ flex: 1, backgroundColor: 'var(--bg-3)', padding: '10px 4px', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '4px', fontWeight: 600 }}>{member.indicators[0].label}</div>
                    <div style={{ fontSize: 'var(--font-lg)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>
                      {member.indicators[0].value}%
                    </div>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
