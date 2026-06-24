export type QuestionStatus = 'open' | 'answered' | 'closed' | 'disputed';

export interface PublicQuestion {
  id: string;
  questionCode: string;     // QU-2026-NNNN
  targetMember: string;
  targetMemberId: string;   // 소명 대상 국회의원 고유 ID (M01, M02 등)
  title: string;
  content: string;
  sourceUrl?: string;
  status: QuestionStatus;
  voteCount: number;
  authorName: string;
  createdAt: string;
  deadline?: string;
  disputeRequested?: boolean; // 의원의 이의 신청 여부
  disputeResolved?: boolean;  // 전문가 재심사 해결 여부
  aiToxicityScore?: number;   // AI 위험 표현 감지 스코어
}
