export * from './member';
export * from './bill';
export * from './recall';
export * from './scoring';
export * from './auth';

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