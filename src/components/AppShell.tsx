'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: '홈', path: '/' },
  { label: '대시보드', path: '/dashboard' },
  { label: '블라인드 평가', path: '/blind' },
  { label: '법안 토론', path: '/bills' },
  { label: '공개 질의', path: '/questions' },
  { label: '의원 리포트', path: '/members' },
] as const;

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [userSession, setUserSession] = useState<{ id: string; displayName: string; trustLevel: number } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    const saved = localStorage.getItem('user_session');
    if (saved) {
      try { setUserSession(JSON.parse(saved)); } catch { /* 무시 */ }
    }
  }, []);

  const updateSession = () => {
    const saved = localStorage.getItem('user_session');
    if (saved) {
      try { setUserSession(JSON.parse(saved)); } catch { setUserSession(null); }
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

  // 드롭다운 외부 클릭 닫기
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    if (path === '/bills') return pathname === '/bills' || (pathname.startsWith('/bills/') && !pathname.startsWith('/bills/propose'));
    return pathname.startsWith(path);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>

      {/* ── Top Navigation Bar ── */}
      <header style={{
        height: 'var(--topbar-h)',
        backgroundColor: 'var(--header-bg)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 200,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}>
        <div style={{
          maxWidth: 'var(--content-max)',
          margin: '0 auto',
          height: '100%',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '0',
        }}>

          {/* 로고 */}
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginRight: '32px',
            flexShrink: 0,
            textDecoration: 'none',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              backgroundColor: 'var(--accent)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 'var(--font-base)', color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              국민소환제
            </span>
          </Link>

          {/* 메인 네비게이션 — 데스크탑 */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }} className="desktop-nav">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-sm)',
                  fontWeight: isActive(item.path) ? 700 : 500,
                  color: isActive(item.path) ? 'var(--accent)' : 'var(--text-2)',
                  backgroundColor: isActive(item.path) ? 'var(--accent-bg)' : 'transparent',
                  transition: 'background-color 0.15s, color 0.15s',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-3)';
                    e.currentTarget.style.color = 'var(--text-1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-2)';
                  }
                }}
              >
                {item.label}
              </Link>
            ))}
            {/* 관리자 메뉴 (신뢰 등급 10 전용) */}
            {userSession?.trustLevel === 10 && (
              <Link
                href="/admin"
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-sm)',
                  fontWeight: pathname.startsWith('/admin') ? 700 : 500,
                  color: pathname.startsWith('/admin') ? 'var(--accent)' : 'var(--text-2)',
                  backgroundColor: pathname.startsWith('/admin') ? 'var(--accent-bg)' : 'transparent',
                  textDecoration: 'none',
                }}
              >
                관리
              </Link>
            )}
          </nav>

          {/* 우측 액션 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', flexShrink: 0 }}>
            {userSession ? (
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px 6px 8px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-2)',
                    backgroundColor: 'var(--bg-2)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-2)'}
                >
                  {/* 아바타 */}
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                  }}>
                    {userSession.displayName.substring(0, 1)}
                  </div>
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-1)', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {userSession.displayName}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="fade-in" style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: '192px',
                    backgroundColor: 'var(--bg-2)',
                    border: '1px solid var(--border-2)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    overflow: 'hidden',
                    zIndex: 999,
                  }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--text-1)', marginBottom: '2px' }}>
                        {userSession.displayName}
                      </div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)' }}>
                        신뢰 등급 {userSession.trustLevel}
                      </div>
                    </div>
                    <div style={{ padding: '6px' }}>
                      <Link href="/dashboard" style={{
                        display: 'block',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-sm)',
                        color: 'var(--text-1)',
                        textDecoration: 'none',
                        transition: 'background-color 0.1s',
                      }}
                        onClick={() => setIsDropdownOpen(false)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-3)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        내 대시보드
                      </Link>
                      <button
                        onClick={() => {
                          localStorage.removeItem('user_session');
                          window.dispatchEvent(new Event('user-session-changed'));
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--font-sm)',
                          color: 'var(--danger)',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'background-color 0.1s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="btn-primary" style={{ padding: '7px 16px', fontSize: 'var(--font-sm)' }}>
                로그인
              </Link>
            )}

            {/* 모바일 햄버거 */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                display: 'none',
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-1)',
                cursor: 'pointer',
              }}
              aria-label="메뉴"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {isMobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 드로어 */}
        {isMobileMenuOpen && (
          <div className="fade-in" style={{
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--bg-2)',
            padding: '8px 16px 16px',
          }}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '11px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-base)',
                  fontWeight: isActive(item.path) ? 700 : 400,
                  color: isActive(item.path) ? 'var(--accent)' : 'var(--text-1)',
                  backgroundColor: isActive(item.path) ? 'var(--accent-bg)' : 'transparent',
                  textDecoration: 'none',
                  marginBottom: '2px',
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* ── 메인 콘텐츠 ── */}
      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', width: '100%', padding: '28px 20px' }}>
          {children}
        </div>
      </main>

      {/* 반응형 스타일 */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
