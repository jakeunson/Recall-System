'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/types';
import Link from 'next/link';

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
    <div className="min-h-[calc(100vh-var(--topbar-h))] flex items-center justify-center p-10 bg-background">
      <div className="max-w-[520px] w-full bg-secondary border border-border rounded-lg p-9 shadow-lg flex flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-accent/10 border border-accent/20 rounded-md text-accent mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-2">
            체험 로그인 및 역할 선택
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            국민소환제 플랫폼에서 등급별(시민, 검증단, 의원 대표) 권한과 참여 활동을 테스트하기 위해 체험할 역할을 선택해 주세요.
          </p>
        </div>

        {/* Current Status Box if Logged In */}
        {currentSession && (
          <div className="bg-accent/10 border border-accent/20 rounded-md px-5 py-4 flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-accent font-semibold">현재 체험 로그인 상태</span>
              <span className="text-sm font-bold text-foreground flex items-center gap-2">
                {currentSession.displayName}
                <span className="text-sm font-medium text-muted-foreground bg-border px-1.5 py-0.5 rounded-sm">
                  신뢰 등급 {currentSession.trustLevel}
                </span>
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-xs font-semibold text-danger border border-danger/20 bg-danger/5 px-3 py-3 rounded-sm transition-colors hover:bg-danger/10"
            >
              로그아웃
            </button>
          </div>
        )}

        {/* Preset Selector */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-muted-foreground">역할 프리셋 선택</h2>
          <div className="flex flex-col gap-2.5">
            {PRESET_USERS.map((user) => {
              const isSelected = currentSession?.id === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => handleLogin({ id: user.id, displayName: user.displayName, trustLevel: user.trustLevel })}
                  className={`text-left rounded-md px-5 py-4 flex flex-col gap-2 transition-colors duration-200 border ${
                    isSelected 
                      ? 'bg-accent/10 border-accent' 
                      : 'bg-card border-border hover:border-border-2'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-sm font-bold text-foreground">
                      {user.displayName}
                    </span>
                    <span className={`text-sm font-mono font-semibold px-2 py-0.5 rounded-full border ${
                      isSelected
                        ? 'text-accent bg-accent/10 border-accent/20'
                        : 'text-muted-foreground bg-secondary border-border'
                    }`}>
                      LEVEL {user.trustLevel}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {user.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <hr className="flex-1 border-t border-border" />
          <span>또는 이름 직접 입력</span>
          <hr className="flex-1 border-t border-border" />
        </div>

        {/* Custom Nickname Input Form */}
        <form onSubmit={handleCustomLogin} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="시민 이름 입력 (예: 유권자_정의롭)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="flex-1 bg-background border border-border rounded-sm px-4 py-3 text-base text-foreground outline-none transition-colors focus:border-accent"
            />
            <button
              type="submit"
              disabled={!customName.trim()}
              className={`px-6 rounded-sm text-base font-bold transition-colors ${
                customName.trim()
                  ? 'bg-foreground text-secondary cursor-pointer'
                  : 'bg-border text-muted-foreground cursor-not-allowed'
              }`}
            >
              진입
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
