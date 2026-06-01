'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    label: '홈',
    path: '/',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    label: '마이 대시보드',
    path: '/dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" />
        <rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="12" width="7" height="9" />
        <rect x="3" y="16" width="7" height="5" />
      </svg>
    ),
  },
  {
    label: '블라인드 퀴즈',
    path: '/blind',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    ),
  },
  {
    label: '법안 토론',
    path: '/bills',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    label: '시민 입법',
    path: '/bills/propose',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    label: '공개 질의',
    path: '/questions',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    label: '의원 리포트',
    path: '/members',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
] as const;

const getPageTitle = (path: string) => {
  if (path === '/') return '홈';
  const found = NAV_ITEMS.find(item => item.path !== '/' && path.startsWith(item.path));
  if (found) return found.label;
  if (path.startsWith('/auth/login')) return '체험 로그인';
  if (path.startsWith('/blind')) return '블라인드 평가';
  return '국민소환제';
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [userSession, setUserSession] = useState<{ id: string; displayName: string; trustLevel: number } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // 라이트 모드 강제 고정
    document.documentElement.setAttribute('data-theme', 'light');

    // Hydration 이후 클라이언트 사이드에서만 localStorage 로드 (SSR 미스매치 방지)
    const saved = localStorage.getItem('user_session');
    if (saved) {
      try {
        setUserSession(JSON.parse(saved));
      } catch {
        // 무시
      }
    }
  }, []);

  const updateSession = () => {
    const saved = localStorage.getItem('user_session');
    if (saved) {
      try {
        setUserSession(JSON.parse(saved));
      } catch {
        setUserSession(null);
      }
    } else {
      setUserSession(null);
    }
  };

  useEffect(() => {
    window.addEventListener('user-session-changed', updateSession);
    window.addEventListener('storage', updateSession);

    return () => {
      window.removeEventListener('user-session-changed', updateSession);
      window.removeEventListener('storage', updateSession);
    };
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: isSidebarOpen ? 'var(--sidebar-w)' : '56px',
        borderRight: '1px solid var(--border)',
        backgroundColor: 'var(--bg-2)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        zIndex: 200,
        height: '100%',
        overflow: 'hidden',
        flexShrink: 0,
      }}>

        {/* Logo */}
        <div style={{
          padding: isSidebarOpen ? '20px 20px' : '20px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderBottom: '1px solid var(--border)',
          minHeight: 'var(--topbar-h)',
        }}>
          <div style={{
            width: '22px',
            height: '22px',
            backgroundColor: 'var(--accent)',
            borderRadius: '4px',
            flexShrink: 0,
          }} />
          {isSidebarOpen && (
            <span style={{
              fontWeight: 600,
              fontSize: 'var(--font-sm)',
              letterSpacing: '-0.03em',
              whiteSpace: 'nowrap',
              color: 'var(--text-1)',
            }}>
              국민소환제
            </span>
          )}
        </div>

        {/* Nav */}
        <nav style={{
          flex: 1,
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflowY: 'auto',
        }}>
          {NAV_ITEMS.map((item) => {
            let isActive = false;
            if (item.path === '/') {
              isActive = pathname === '/';
            } else if (item.path === '/bills') {
              // /bills 로 시작하되, /bills/propose 가 아닐 때만 법안 토론 활성화
              isActive = pathname === '/bills' || (pathname.startsWith('/bills/') && !pathname.startsWith('/bills/propose'));
            } else {
              isActive = pathname.startsWith(item.path);
            }

            return (
              <Link
                key={item.path}
                href={item.path}
                title={!isSidebarOpen ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: isSidebarOpen ? '10px 12px' : '10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'var(--accent-bg)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-2)',
                  fontSize: 'var(--font-sm)',
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none',
                  transition: 'background-color 0.15s, color 0.15s',
                  whiteSpace: 'nowrap',
                  justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                }}
              >
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </span>
                {isSidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}

          {/* 마스터 전용 관리자 데스크 메뉴 */}
          {userSession && userSession.trustLevel === 10 && (
            <Link
              href="/admin"
              title={!isSidebarOpen ? '관리자 데스크' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: isSidebarOpen ? '10px 12px' : '10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: pathname.startsWith('/admin') ? 'var(--accent-bg)' : 'transparent',
                color: pathname.startsWith('/admin') ? 'var(--accent)' : 'var(--text-2)',
                fontSize: 'var(--font-sm)',
                fontWeight: pathname.startsWith('/admin') ? 600 : 400,
                textDecoration: 'none',
                transition: 'background-color 0.15s, color 0.15s',
                whiteSpace: 'nowrap',
                justifyContent: isSidebarOpen ? 'flex-start' : 'center',
              }}
            >
              <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </span>
              {isSidebarOpen && <span>관리자 데스크</span>}
            </Link>
          )}
        </nav>

        {/* Collapse Button */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              color: 'var(--text-3)',
              fontSize: 'var(--font-xs)',
              fontWeight: 600,
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'border-color 0.15s, color 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label={isSidebarOpen ? '사이드바 접기' : '사이드바 펼치기'}
          >
            {isSidebarOpen ? '← 접기' : '→'}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflowY: 'auto' }}>

        {/* Topbar */}
        <header style={{
          height: 'var(--topbar-h)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          backgroundColor: 'var(--header-bg)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 150,
          justifyContent: 'space-between',
          gap: '16px',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-1)', fontWeight: 600 }}>
            {getPageTitle(pathname)}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* 플랫폼 상태 배지 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              backgroundColor: 'var(--accent-bg)',
              borderRadius: '20px',
              border: '1px solid var(--accent-border)',
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                backgroundColor: 'var(--accent)',
                borderRadius: '50%',
                boxShadow: '0 0 6px var(--accent)',
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-1)' }}>실시간 검증 중</span>
            </div>

            {userSession ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'var(--accent-bg)',
                    borderRadius: '50%',
                    border: '1px solid var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    transition: 'transform 0.15s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {userSession.displayName.substring(0, 1)}
                </button>

                {isDropdownOpen && (
                  <>
                    <div 
                      onClick={() => setIsDropdownOpen(false)}
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
                    />
                    <div 
                      className="fade-in"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '40px',
                        width: '200px',
                        backgroundColor: 'var(--bg-2)',
                        border: '1px solid var(--border-2)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        zIndex: 999,
                        boxShadow: 'var(--shadow-lg)'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {userSession.displayName}
                        </span>
                        <span style={{ 
                          fontSize: 'var(--font-xs)', 
                          fontWeight: 600, 
                          color: 'var(--text-1)', 
                          backgroundColor: 'var(--bg-3)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          width: 'fit-content',
                          border: '1px solid var(--border)'
                        }}>
                          신뢰 등급 {userSession.trustLevel}
                        </span>
                      </div>
                      <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
                      <button
                        onClick={() => {
                          localStorage.removeItem('user_session');
                          window.dispatchEvent(new Event('user-session-changed'));
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          fontSize: 'var(--font-sm)',
                          color: 'var(--danger)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '4px 0'
                        }}
                      >
                        세션 로그아웃
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/auth/login" style={{
                fontSize: 'var(--font-sm)',
                color: 'var(--text-1)',
                fontWeight: 600,
                border: '1px solid var(--border)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-2)',
                transition: 'border-color 0.2s, background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.backgroundColor = 'var(--accent-bg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.backgroundColor = 'var(--bg-2)';
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                체험 로그인
              </Link>
            )}
          </div>
        </header>

        <main style={{ flex: 1 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '32px 20px' }}>
            {children}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
