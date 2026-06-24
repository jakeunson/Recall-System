export interface SponsoredBill {
  billId: string;
  title: string;
  role: 'representative' | 'cosponsor';
}

export interface Indicator {
  label: string;
  value: number; // 0-100
}

export interface Statement {
  text: string;
  category: string;
  sourceUrl?: string;
}

export interface Member {
  id: string;
  name: string;
  party: string;
  region: string;
  trustScore: number; // 0-100
  indicators: Indicator[];
  statements: Statement[];
  electedHistory?: string[];
  sponsoredBills?: SponsoredBill[];
  photoUrl?: string;       // 실제 프로필 사진 URL
  hanjaName?: string;      // 한자명
  englishName?: string;    // 영문명
  committee?: string;      // 소속 상임위원회
}

export interface MemberEvaluation {
  id: string;
  memberId: string;
  userId: string;
  userDisplayName: string;
  score: number; // 0-100 평점
  comment: string; // 한줄평 코멘트
  createdAt: string;
}
