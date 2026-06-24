'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, getIconSvg } from './navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const [userSession, setUserSession] = useState<{ id: string; displayName: string; trustLevel: number } | null>(null);

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

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    if (path === '/bills') return pathname === '/bills' || (pathname.startsWith('/bills/') && !pathname.startsWith('/bills/propose'));
    return pathname.startsWith(path);
  };

  return (
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
  );
}
