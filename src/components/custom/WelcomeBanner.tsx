'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/hooks';

export default function WelcomeBanner() {
  const { session } = useSession();

  return (
    <section className="rounded-xl p-8 md:p-10 text-white flex justify-between items-center gap-6 flex-wrap bg-accent shadow-sm relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex flex-col gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold bg-white/10 px-2.5 py-1 rounded-full text-white/90 border border-white/10 backdrop-blur-sm">
            🟢 서비스 운영 중
          </span>
          {session && (
            <span className="text-xs font-medium text-white/80">
              {session.displayName}님 환영합니다
            </span>
          )}
        </div>
        <h1 className="text-2xl md:text-[28px] font-bold text-white leading-tight tracking-tight mt-1">
          국민소환제
        </h1>
        <p className="text-lg text-white/70 leading-relaxed max-w-[520px]">
          국회의원의 의정 활동을 데이터와 시민의 눈으로 함께 검증합니다.
        </p>
      </div>
      {!session && (
        <Link href="/login" className="bg-white text-accent px-6 py-3 rounded-md font-bold text-base shrink-0 transition-opacity hover:opacity-90 shadow-sm relative z-10">
          참여하기 →
        </Link>
      )}
    </section>
  );
}
