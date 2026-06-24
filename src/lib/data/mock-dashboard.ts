import { PostSummary } from '../types';

export const MOCK_RECENT_POSTS: PostSummary[] = [
  {
    id: 'Q003',
    boardType: 'blind',
    title: '이 발언의 주인공은 누구일까요? — 검찰 개혁 발언',
    meta: '2026.05.10 · 찬성 178 / 반대 412',
    badge: '퀴즈',
    badgeColor: 'var(--accent)',
    href: '/blind/Q003',
  },
  {
    id: 'PR001',
    boardType: 'propose',
    title: '전세사기 방지 및 임차인 보증금 보호 강화 시민 제안',
    meta: '2026.05.15 · 공감 234 · 자문단 합헌 판정',
    badge: '시민 검토 중',
    badgeColor: 'var(--accent)',
    href: '/bills/propose/PR001',
  },
  {
    id: 'QU002',
    boardType: 'question',
    title: '이영희 의원 본회의 출석률 저조(64%)에 대한 공개 소명 요구',
    meta: '2026.05.18 · 동의 892명 · SLA 진행 중',
    badge: '답변 대기',
    badgeColor: 'var(--warning)',
    href: '/questions/QU002',
  },
  {
    id: 'BT001',
    boardType: 'bill',
    title: '소상공인 보호 및 지원에 관한 법률 개정안',
    meta: '2026.05.01 · 합의도 82% · 토론 24건',
    badge: '진행 중',
    badgeColor: 'var(--success)',
    href: '/bills/BT001',
  },
];

export const MOCK_PLATFORM_STATS = {
  memberCount: 300,
  verifiedBillCount: 12482,
  activeQuestionCount: 158,
  factcheckCount: 847, // 유지 (UI에서 아직 사용할 수 있으므로)
} as const;
