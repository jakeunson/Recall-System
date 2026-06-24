import React from 'react';
import Link from 'next/link';

export default function BlindEvaluationCTA() {
  return (
    <section className="bg-card border border-border rounded-xl p-6 flex items-center justify-between gap-6 flex-wrap shadow-sm">
      <div>
        <h3 className="text-base font-bold mb-2">
          👁️ 블라인드 평가 참여하기
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          발언자 정보 없이 오직 내용만으로 평가합니다. 확증 편향 없는 시민 검증에 참여하세요.
        </p>
      </div>
      <Link href="/blind" className="btn-primary shrink-0 px-6 py-3">
        평가 참여 →
      </Link>
    </section>
  );
}
