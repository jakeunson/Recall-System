export type ReplyType = 'evidence' | 'counter' | 'source';

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

export interface BillThread {
  id: string;
  billTitle: string;
  billCode: string;         // 법안 번호 (WIKI-22-XXXX)
  billSummary: string;
  diffData: DiffLine[];
  consensusScore: number;   // 0-100
  replyCount: number;
  createdAt: string;
}

export interface BillReply {
  id: string;
  threadId: string;
  replyType: ReplyType;
  content: string;
  sourceUrl?: string;       // null이면 "미검증"
  authorName: string;
  verifiedCount: number;
  needsReviewCount: number;
  createdAt: string;
}

export type ProposalStatus = 'draft' | 'community_review' | 'legal_review' | 'finalized' | 'needs_amendment';
export type LegalRating = 'constitutional' | 'needs_amendment' | 'unconstitutional';

export interface LegalOpinion {
  id: string;
  authorName: string;      // 자문위원 서명 (예: "헌법학_김변호사")
  rating: LegalRating;     // 합헌 / 수정보완 필요 / 위헌 소지
  comment: string;         // 상세 검토 의견
  createdAt: string;
}

export interface ProposalVersion {
  version: number;
  createdAt: string;
  authorName: string;
  diffData: DiffLine[];
  changeSummary: string;
}

export interface BillProposal {
  id: string;
  title: string;
  purpose: string;
  background: string;
  diffData: DiffLine[];    // V1 (최초 초안)
  status: ProposalStatus;
  authorName: string;
  createdAt: string;
  upvoteCount: number;
  versions: ProposalVersion[];
  legalOpinions: LegalOpinion[];
  aiToxicityScore?: number;   // AI 위험 표현 감지 스코어
  amendmentFeedback?: string; // 전문가 수정 권고 피드백 내용
}

export type ReactionType = 'agree' | 'disagree' | 'verified' | 'needs_review';
