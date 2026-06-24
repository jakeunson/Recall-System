'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, getIconSvg } from './navigation';

export default function MobileNav({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    if (path === '/bills') return pathname === '/bills' || (pathname.startsWith('/bills/') && !pathname.startsWith('/bills/propose'));
    return pathname.startsWith(path);
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-40 flex">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
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
                onClick={onClose}
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
  );
}
