'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: '홈', path: '/', icon: 'home' },
  { label: '대시보드', path: '/dashboard', icon: 'bar-chart' },
  { label: '블라인드 평가', path: '/blind', icon: 'eye-off' },
  { label: '법안 토론', path: '/bills', icon: 'file-text' },
  { label: '공개 질의', path: '/questions', icon: 'message-square' },
  { label: '의원 리포트', path: '/members', icon: 'users' },
] as const;

function getIconSvg(name: string, isActive: boolean) {
  const color = isActive ? 'currentColor' : 'currentColor';
  const className = "w-4 h-4";
  
  switch (name) {
    case 'home':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
    case 'bar-chart':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>;
    case 'eye-off':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>;
    case 'file-text':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
    case 'message-square':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
    case 'users':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
    default:
      return null;
  }
}

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
    <div className="flex h-screen w-full bg-bg-2 text-text-1 overflow-hidden font-sans">
      
      {/* ── 데스크탑 사이드바 ── */}
      <aside className="hidden md:flex flex-col w-[var(--sidebar-w)] bg-bg border-r border-border shrink-0 z-20">
        <div className="h-[var(--topbar-h)] flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3 outline-none group">
            <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <span className="font-bold text-base tracking-tight text-text-1">
              국민소환제
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-5 px-4 space-y-1">
          <div className="px-2 pb-2 mt-2 text-xs font-bold tracking-wider text-text-3 uppercase">
            Menu
          </div>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-border-2",
                  active 
                    ? "bg-bg-3 text-accent font-semibold" 
                    : "text-text-2 hover:bg-bg-3/50 hover:text-text-1"
                )}
              >
                <div className={cn("shrink-0", active ? "text-accent" : "text-text-3")}>
                  {getIconSvg(item.icon, active)}
                </div>
                {item.label}
              </Link>
            );
          })}
          
          {userSession?.trustLevel === 10 && (
            <>
              <div className="px-2 pt-6 pb-2 text-xs font-bold tracking-wider text-text-3 uppercase">
                Admin
              </div>
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors outline-none",
                  pathname.startsWith('/admin')
                    ? "bg-bg-3 text-accent font-semibold" 
                    : "text-text-2 hover:bg-bg-3/50 hover:text-text-1"
                )}
              >
                <div className={cn("shrink-0", pathname.startsWith('/admin') ? "text-accent" : "text-text-3")}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                관리자 패널
              </Link>
            </>
          )}
        </div>
        
        {/* User Status at bottom of sidebar */}
        {userSession && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                {userSession.displayName.substring(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-text-1 truncate">{userSession.displayName}</div>
                <div className="text-xs text-text-3 mt-0.5">Level {userSession.trustLevel}</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ── 메인 영역 ── */}
      <div className="flex flex-col flex-1 min-w-0 bg-bg-2">
        
        {/* Top Header */}
        <header className="h-[var(--topbar-h)] flex items-center justify-between px-4 md:px-8 border-b border-border bg-header-bg backdrop-blur-md sticky top-0 z-10 shrink-0">
          
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-1.5 -ml-1.5 rounded-md text-text-2 hover:bg-bg-3"
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            
            {/* Mobile Logo */}
            <span className="md:hidden font-bold text-[15px] text-text-1">국민소환제</span>

            {/* Desktop Breadcrumbs / Search Area (Placeholder for now) */}
            <div className="hidden md:flex items-center text-sm text-text-3">
              <span className="font-medium text-text-2">{NAV_ITEMS.find(item => isActive(item.path))?.label || '관리'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {userSession ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-3 rounded-full border border-border bg-bg hover:bg-bg-3 hover:border-border-2 transition-all shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
                >
                  <span className="text-sm font-semibold text-text-1 truncate max-w-[100px]">
                    {userSession.displayName}
                  </span>
                  <svg className="w-3.5 h-3.5 text-text-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-48 bg-bg border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-3 border-b border-border bg-bg-2">
                      <div className="font-bold text-sm text-text-1">{userSession.displayName}</div>
                      <div className="text-xs text-text-3 mt-0.5">신뢰 등급 {userSession.trustLevel}</div>
                    </div>
                    <div className="p-1.5">
                      <Link href="/dashboard" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-3 py-2 text-sm text-text-1 hover:bg-bg-3 rounded-md transition-colors"
                      >
                        내 대시보드
                      </Link>
                      <button
                        onClick={() => {
                          localStorage.removeItem('user_session');
                          window.dispatchEvent(new Event('user-session-changed'));
                          setIsDropdownOpen(false);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm text-danger font-medium hover:bg-danger/5 rounded-md transition-colors mt-1"
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="btn-primary text-xs px-4 py-3 h-8">
                로그인
              </Link>
            )}
          </div>
        </header>

        {/* Mobile Drawer Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
            {/* Drawer */}
            <div className="relative w-64 max-w-[80vw] h-full bg-bg border-r border-border shadow-xl flex flex-col animate-in slide-in-from-left duration-200">
              <div className="h-[var(--topbar-h)] flex items-center px-5 border-b border-border">
                <span className="font-bold text-text-1">국민소환제 메뉴</span>
              </div>
              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-md text-lg font-medium transition-colors",
                        active ? "bg-bg-3 text-accent" : "text-text-2"
                      )}
                    >
                      <div className={cn("shrink-0", active ? "text-accent" : "text-text-3")}>
                        {getIconSvg(item.icon, active)}
                      </div>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full max-w-[var(--content-max)] mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
