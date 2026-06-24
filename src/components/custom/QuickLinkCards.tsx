import React from 'react';
import Link from 'next/link';

const LINKS = [
  { href: '/blind', emoji: '👁️', title: '블라인드 평가', desc: '발언자 정보 없이 의정 발언을 평가해보세요', color: 'text-accent' },
  { href: '/questions', emoji: '💬', title: '공개 질의', desc: '의원에게 직접 질문을 등록하고 공감을 모아보세요', color: 'text-warning' },
  { href: '/bills', emoji: '📋', title: '법안 토론', desc: '개정 법안의 조문 변경 사항을 비교하고 의견 나눠요', color: 'text-success' },
  { href: '/members', emoji: '📊', title: '의원 리포트', desc: '데이터 기반으로 분석된 의원별 종합 평가 리포트', color: 'text-blue-500' },
];

export default function QuickLinkCards() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {LINKS.map((item) => (
        <Link key={item.href} href={item.href} className="card-base flex flex-col gap-2 p-6 hover:scale-[1.02] transition-transform">
          <div className="text-[24px]">{item.emoji}</div>
          <div className={`font-bold text-sm ${item.color}`}>{item.title}</div>
          <div className="text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
        </Link>
      ))}
    </section>
  );
}
