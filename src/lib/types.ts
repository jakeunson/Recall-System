/**
 * Political OS — 공통 타입 정의
 */

// ─── 의원 ────────────────────────────────────────────
export interface SponsoredBill {
  billId: string;
  title: string;
  role: 'representative' | 'cosponsor';
}

export interface Member {
  id: string;
  name: string;
  party: string;
  region: string;
  trustScore: number; // 0–100
  indicators: Indicator[];
  statements: Statement[];
  electedHistory?: string[];
  sponsoredBills?: SponsoredBill[];
  photoUrl?: string;       // 실제 프로필 사진 URL
  hanjaName?: string;      // 한자명
  englishName?: string;    // 영문명
  committee?: string;      // 소속 상임위원회
}

export interface Indicator {
  label: string;
  value: number; // 0–100
}

export interface Statement {
  text: string;
  category: string;
  sourceUrl?: string;
}

// ─── 블라인드 퀴즈 ───────────────────────────────────
export type BlindVoteType = 'agree' | 'disagree' | 'hold';
export type BlindRevealState = 'blind' | 'voted' | 'revealing' | 'revealed';

export interface BlindQuiz {
  id: string;
  maskedStatement: string;   // 마스킹된 발언
  originalStatement: string;
  memberName: string;        // 정답 의원명
  memberParty: string;
  memberRegion: string;
  sourceUrl: string;
  agreeCount: number;
  disagreeCount: number;
  holdCount: number;
  createdAt: string;
  sourceType?: 'parliament' | 'news'; // 출처 구분 ('parliament' | 'news')
  originalMediaName?: string;         // 원본 언론사명 (예: '대한일보')
  maskedMediaName?: string;           // 마스킹된 언론사명 (예: '[C형 전국 종합 언론사]')
}

// ─── 팩트체크 ────────────────────────────────────────
export type FactCheckVerdict =
  | 'true'
  | 'mostly_true'
  | 'half_true'
  | 'mostly_false'
  | 'false'
  | 'hold';

export type ReactionType = 'verified' | 'needs_review';

export interface FactCheck {
  id: string;
  claim: string;           // 주장
  evidence: string;        // 근거
  verdict: FactCheckVerdict;
  sourceUrls: string[];
  verifiedCount: number;
  needsReviewCount: number;
  authorName: string;
  createdAt: string;
  aiToxicityScore?: number; // AI 위험 표현 감지 스코어
}

// ─── 법안 토론 ───────────────────────────────────────
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
  consensusScore: number;   // 0–100
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

// ─── 공개 질의 ───────────────────────────────────────
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

// ─── 게시물 카드 (범용) ──────────────────────────────
export type BoardType = 'blind' | 'factcheck' | 'bill' | 'question' | 'propose';

export interface PostSummary {
  id: string;
  boardType: BoardType;
  title: string;
  meta: string;             // 날짜, 작성자 등 부가 정보
  badge?: string;           // 상태 배지 텍스트
  badgeColor?: string;      // var(--success) 등
  href: string;
}

// ─── 사용자 (Mock) ───────────────────────────────────
export interface UserProfile {
  id: string;
  displayName: string;
  trustLevel: number;       // 1–5
}

// ─── 시민 입법 제안 (Phase 6) ────────────────────────
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

// ─── 국회의원 직접 인지 평가 ─────────────────────────
export interface MemberEvaluation {
  id: string;
  memberId: string;
  userId: string;
  userDisplayName: string;
  score: number; // 0-100 평점
  comment: string; // 한줄평 코멘트
  createdAt: string;
}

