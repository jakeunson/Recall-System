'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return (
    <div className="flex h-screen w-full bg-bg-2 text-text-1 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 bg-bg-2">
        <Topbar onMenuToggle={() => setMobileMenuOpen(!isMobileMenuOpen)} />
        {isMobileMenuOpen && (
          <MobileNav isOpen={isMobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        )}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full max-w-[var(--content-max)] mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
