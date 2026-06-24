// WDI (Vote Defection Index)
export interface WDIInput {
  billId: string;
  memberVote: 'yes' | 'no' | 'abstain' | 'absent';
  partyLine: 'yes' | 'no' | 'abstain' | 'free';
  paiNorm: number;  // [0, 1]
  cci: number;      // 0.0 | 0.5 | 1.0
}

// TSR (Trust Score Rating)
export interface TSRComponents {
  ahs: number;  // Activity History Score
  eqs: number;  // Engagement Quality Score
  idi: number;  // Information Diversity Index [0, 1]
  cvb: number;  // Constituency Verification Bonus
}

export type TSRGrade = 'S' | 'A' | 'B' | 'C';

// AQS (Answer Quality Score)
export interface AQSAutoScore {
  specificityScore: number;
  dataScore: number;
  actionabilityScore: number;
  genericPenalty: number;
}

export type AQSGrade = 'S' | 'A' | 'B' | 'C' | 'F';

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

export interface MemberScore {
  memberId: string;
  scoreType: 'wdi' | 'tsr' | 'aqs';
  value: number;
  date: string;
}
