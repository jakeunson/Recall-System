'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/types';

const PRESET_USERS: (UserProfile & { description: string })[] = [
  {
    id: 'U001',
    displayName: '시민_홍길동',
    trustLevel: 1,
    description: '기본 신뢰 레벨 1의 일반 유권자 계정. 블라인드 평가 참여 및 일반 질의 열람 가능.',
  },
  {
    id: 'U002',
    displayName: '시민검증단_A',
    trustLevel: 3,
    description: '신뢰 레벨 3의 우수 검증단 계정. 팩트체크 검증 참여 및 공식 소환 지지 가능.',
  },
  {
    id: 'U003',
    displayName: '데이터검증_B',
    trustLevel: 4,
    description: '신뢰 레벨 4의 전문 평가단 계정. 팩트체크 리포트 작성 및 법안 조문 제안 권한.',
  },
  {
    id: 'U004',
    displayName: '국회의원 김철수',
    trustLevel: 5,
    description: '신뢰 레벨 5의 국회의원 공식 대변인 계정. 시민들의 공개 소환에 공식 답변 등록 가능.',
  },
  {
    id: 'U005',
    displayName: '서비스운영자_마스터',
    trustLevel: 10,
    description: '신뢰 레벨 10의 플랫폼 총괄 운영자 계정. 국회의원 의정 활동 영상 업로드 및 시민 콘텐츠 승인/삭제 권한.',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [customName, setCustomName] = useState('');
  const [currentSession, setCurrentSession] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_session');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return null;
  });

  // 로그인 처리 함수
  const handleLogin = (user: UserProfile) => {
    localStorage.setItem('user_session', JSON.stringify(user));
    
    // AppShell 등 다른 컴포넌트가 세션 변경을 즉시 감지할 수 있도록 커스텀 이벤트 발행
    window.dispatchEvent(new Event('user-session-changed'));
    
    // 이전 페이지나 홈으로 이동
    router.push('/');
  };

  // 직접 이름 입력 로그인
  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newUser: UserProfile = {
      id: `U_custom_${Date.now()}`,
      displayName: customName.trim(),
      trustLevel: 1, // 직접 가입 시 기본 레벨 1
    };
    handleLogin(newUser);
  };

  // 로그아웃 (세션 초기화)
  const handleLogout = () => {
    localStorage.removeItem('user_session');
    setCurrentSession(null);
    window.dispatchEvent(new Event('user-session-changed'));
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - var(--topbar-h))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      backgroundColor: 'var(--bg)',
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '36px',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            backgroundColor: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent)',
            marginBottom: '16px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            체험 로그인 및 역할 선택
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
            국민소환제 플랫폼에서 등급별(시민, 검증단, 의원 대표) 권한과 참여 활동을 테스트하기 위해 체험할 역할을 선택해 주세요.
          </p>
        </div>

        {/* Current Status Box if Logged In */}
        {currentSession && (
          <div style={{
            backgroundColor: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>현재 체험 로그인 상태</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-1)' }}>
                {currentSession.displayName}
                <span style={{ 
                  marginLeft: '8px', 
                  fontSize: '11px', 
                  fontWeight: 500, 
                  color: 'var(--text-2)',
                  backgroundColor: 'var(--border)',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  신뢰 등급 {currentSession.trustLevel}
                </span>
              </span>
            </div>
            <button 
              onClick={handleLogout}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--danger)',
                border: '1px solid rgba(248, 113, 113, 0.2)',
                backgroundColor: 'rgba(248, 113, 113, 0.05)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.05)'}
            >
              로그아웃
            </button>
          </div>
        )}

        {/* Preset Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-2)' }}>역할 프리셋 선택</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PRESET_USERS.map((user) => {
              const isSelected = currentSession?.id === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => handleLogin({ id: user.id, displayName: user.displayName, trustLevel: user.trustLevel })}
                  style={{
                    textAlign: 'left',
                    background: isSelected ? 'var(--accent-bg)' : 'var(--bg-3)',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'border-color 0.2s, background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-2)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-1)' }}>
                      {user.displayName}
                    </span>
                    <span style={{ 
                      fontSize: '11px', 
                      fontFamily: 'var(--font-mono)', 
                      fontWeight: 600,
                      color: isSelected ? 'var(--accent)' : 'var(--text-2)',
                      backgroundColor: isSelected ? 'var(--accent-bg)' : 'var(--bg-2)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-lg)',
                      border: isSelected ? '1px solid var(--accent-border)' : '1px solid var(--border)'
                    }}>
                      LEVEL {user.trustLevel}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>
                    {user.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-3)' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
          <span>또는 이름 직접 입력</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
        </div>

        {/* Custom Nickname Input Form */}
        <form onSubmit={handleCustomLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="시민 이름 입력 (예: 유권자_정의롭)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                fontSize: '13px',
                color: 'var(--text-1)',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            />
            <button
              type="submit"
              disabled={!customName.trim()}
              className="btn-primary"
              style={{
                padding: '0 24px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: customName.trim() ? 'pointer' : 'not-allowed',
                backgroundColor: customName.trim() ? 'var(--text-1)' : 'var(--border)',
                color: customName.trim() ? 'var(--bg-2)' : 'var(--text-3)',
                boxShadow: 'none'
              }}
            >
              진입
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
