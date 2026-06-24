import React from 'react';
import Link from 'next/link';
import Tooltip from '@/components/custom/Tooltip';

export interface BillCardProps {
  id: string;
  billCode: string;
  createdAt: string;
  billTitle: string;
  billSummary: string;
  consensusScore: number;
  replyCount: number;
  index: number;
}

export default function BillCard({
  id,
  billCode,
  createdAt,
  billTitle,
  billSummary,
  consensusScore,
  replyCount,
  index,
}: BillCardProps) {
  let consensusColorText = 'text-warning';
  let consensusColorBg = 'bg-warning';
  
  if (consensusScore >= 80) {
    consensusColorText = 'text-success';
    consensusColorBg = 'bg-success';
  } else if (consensusScore < 50) {
    consensusColorText = 'text-danger';
    consensusColorBg = 'bg-danger';
  }

  return (
    <div 
      className="card-base flex flex-col justify-between p-6"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold text-muted-foreground bg-card px-2.5 py-1 rounded-full">
            {billCode}
          </span>
          
          <span className="text-xs text-muted-foreground">
            등록일: {new Date(createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>

        <Link href={`/bills/${id}`} className="group block">
          <h3 className="text-lg font-bold text-foreground mb-3 leading-snug transition-colors group-hover:text-accent">
            {billTitle}
          </h3>
        </Link>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-3">
          {billSummary}
        </p>
      </div>

      <div>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <Tooltip
              content={`여론 합의도 = 시민 직접 투표 기반 찬성\n80% 이상: 높은 합의 (✅ 녹색)\n50~79%: 부분 합의 (⚠️ 주황)\n50% 미만: 높은 갈등 (❌ 빨간)`}
              width={250}
            >
              <span className="text-xs font-semibold text-muted-foreground cursor-help">
                여론 합의도 ⓘ
              </span>
            </Tooltip>
            <span className={`text-xs font-bold ${consensusColorText}`}>
              {consensusScore}% 찬성
            </span>
          </div>
          
          <div className="w-full h-1.5 bg-card rounded-sm overflow-hidden">
            <div 
              className={`h-full rounded-sm ${consensusColorBg}`}
              style={{ width: `${consensusScore}%` }} 
            />
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-border pt-4">
          <span className="text-xs text-muted-foreground font-medium">
            💬 댓글 {replyCount}개
          </span>

          <Link href={`/bills/${id}`} className="btn-secondary px-4 py-2 text-xs">
            조문 확인 및 토론 →
          </Link>
        </div>
      </div>
    </div>
  );
}
