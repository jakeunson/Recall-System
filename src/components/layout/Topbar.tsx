'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, getIconSvg } from './navigation';

export default function Topbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const pathname = usePathname();
  const [userSession, setUserSession] = useState<{ id: string; displayName: string; trustLevel: number } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateSession = () => {
    const saved = localStorage.getItem('user_session');
    if (saved) {
      try { setUserSession(JSON.parse(saved)); } catch { setUserSession(null); }
    } else {
      setUserSession(null);
    }
  };

  useEffect(() => {
    updateSession();
    window.addEventListener('user-session-changed', updateSession);
    window.addEventListener('storage', updateSession);
    return () => {
      window.removeEventListener('user-session-changed', updateSession);
      window.removeEventListener('storage', updateSession);
    };
  }, []);

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
    <header className="h-[var(--topbar-h)] flex items-center justify-between px-4 md:px-8 border-b border-border bg-header-bg backdrop-blur-md sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden p-1.5 -ml-1.5 rounded-md text-text-2 hover:bg-bg-3"
          onClick={onMenuToggle}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
        <span className="md:hidden font-bold text-[15px] text-text-1">국민소환제</span>
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
          <Link href="/login" className="btn-primary text-xs px-4 py-3 h-8">
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
