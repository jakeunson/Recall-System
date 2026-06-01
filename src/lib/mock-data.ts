/**
 * Political OS — 중앙화된 Mock 데이터
 *
 * Phase 1~6 전체에서 사용하는 Mock 데이터 모음.
 * Supabase 연동 시 이 파일을 DB 조회 함수로 교체합니다.
 */

import type {
  Member,
  BlindQuiz,
  FactCheck,
  BillThread,
  BillReply,
  PublicQuestion,
  PostSummary,
  BillProposal,
} from './types';

// ─── 의원 데이터 ─────────────────────────────────────

import realMembers from './members.json';

export const MOCK_MEMBERS: Member[] = realMembers as Member[];

// ─── 블라인드 퀴즈 ───────────────────────────────────

export const MOCK_QUIZZES: BlindQuiz[] = [
  {
    id: 'Q001',
    maskedStatement:
      '보수 성향 정당의 가치를 지키기 위해 이번 예산안은 [A형 고소득 도심 자치구]의 인프라 확충에 집중되어야 합니다.',
    originalStatement:
      '보수 정당의 가치를 지키기 위해 이번 예산안은 강남구의 인프라 확충에 집중되어야 합니다.',
    memberName: '김철수',
    memberParty: '국민의힘',
    memberRegion: '서울 강남구 갑',
    sourceUrl: 'https://open.assembly.go.kr/bills/22/XXXXXX',
    agreeCount: 342,
    disagreeCount: 158,
    holdCount: 89,
    createdAt: '2026-05-01T09:00:00+09:00',
    sourceType: 'parliament',
  },
  {
    id: 'Q002',
    maskedStatement:
      '우리 진영 정당은 서민 경제 활성화를 위해 [E형 특정 광역권] 지역의 신산업 벨트 조성을 적극 지원할 것입니다.',
    originalStatement:
      '우리 민주당은 서민 경제 활성화를 위해 호남 지역의 신산업 벨트 조성을 적극 지원할 것입니다.',
    memberName: '이영희',
    memberParty: '더불어민주당',
    memberRegion: '광주 북구 을',
    sourceUrl: 'https://open.assembly.go.kr/bills/22/YYYYYY',
    agreeCount: 521,
    disagreeCount: 203,
    holdCount: 114,
    createdAt: '2026-05-05T14:00:00+09:00',
    sourceType: 'parliament',
  },
  {
    id: 'Q003',
    maskedStatement:
      '검찰 개혁은 시대적 과제이며, [진보·개혁 성향 정당]은 법치주의 확립을 위해 모든 역량을 집중하겠습니다.',
    originalStatement:
      '검찰 개혁은 시대적 과제이며, 혁신당은 법치주의 확립을 위해 모든 역량을 집중하겠습니다.',
    memberName: '박준영',
    memberParty: '조국혁신당',
    memberRegion: '비례대표',
    sourceUrl: 'https://open.assembly.go.kr/bills/22/ZZZZZZ',
    agreeCount: 178,
    disagreeCount: 412,
    holdCount: 67,
    createdAt: '2026-05-10T11:30:00+09:00',
    sourceType: 'parliament',
  },
  {
    id: 'Q004',
    maskedStatement:
      '이번 철도 파업은 명분 없는 정치 파업이므로, [보수·중도우파 성향 정당]의 가치에 따라 정부는 무관용 원칙으로 엄정 대응해야 합니다. [A형 보수·우파 성향 언론사] 인터뷰에서 밝힌 바 있습니다.',
    originalStatement:
      '이번 철도 파업은 명분 없는 정치 파업이므로, 개혁신당의 가치에 따라 정부는 무관용 원칙으로 엄정 대응해야 합니다. 조선일보 인터뷰에서 밝힌 바 있습니다.',
    memberName: '최민서',
    memberParty: '개혁신당',
    memberRegion: '경기 화성시 정',
    sourceUrl: 'https://www.daehanilbo.co.kr/news/12345',
    agreeCount: 295,
    disagreeCount: 189,
    holdCount: 56,
    createdAt: '2026-05-12T15:20:00+09:00',
    sourceType: 'news',
    originalMediaName: '대한일보',
    maskedMediaName: '[C형 전국 종합 언론사]',
  },
];

// ─── 팩트체크 ────────────────────────────────────────

export const MOCK_FACTCHECKS: FactCheck[] = [
  {
    id: 'FC001',
    claim: '"우리 당 집권 이후 국민 1인당 소득이 15% 증가했습니다."',
    evidence:
      '통계청 2026년 1분기 가계금융복지조사에 따르면, 1인당 가처분소득은 전년 대비 2.3% 증가에 그쳤습니다. 15%는 명목 GDP 성장률과 혼동한 수치로 보입니다.',
    verdict: 'mostly_false',
    sourceUrls: [
      'https://kostat.go.kr/householdFinance',
      'https://ecos.bok.or.kr',
    ],
    verifiedCount: 184,
    needsReviewCount: 23,
    authorName: '시민검증단_A',
    createdAt: '2026-05-12T10:00:00+09:00',
  },
  {
    id: 'FC002',
    claim: '"소상공인 보호법 개정안으로 연 120만원 수익 증가 효과가 있습니다."',
    evidence:
      '중소벤처기업부 용역 연구(2025)에서 디지털 전환 지원을 받은 소상공인 평균 매출 증가액은 연 107~134만원으로 나타났습니다. 발언 내용은 연구 결과 범위 내입니다.',
    verdict: 'mostly_true',
    sourceUrls: [
      'https://www.mss.go.kr/2025/smallbiz-digital-report',
    ],
    verifiedCount: 256,
    needsReviewCount: 31,
    authorName: '데이터검증_B',
    createdAt: '2026-05-14T15:00:00+09:00',
  },
  {
    id: 'FC003',
    claim: '"이 의원의 22대 국회 본회의 출석률은 98%입니다."',
    evidence:
      '열린국회정보 API 기준 22대 국회 1차 회기(2024.5~2024.12) 본회의 출석률은 97.8%로, 발언 내용과 거의 일치합니다.',
    verdict: 'true',
    sourceUrls: [
      'https://open.assembly.go.kr/attendance',
    ],
    verifiedCount: 412,
    needsReviewCount: 8,
    authorName: '출석검증_C',
    createdAt: '2026-05-16T09:00:00+09:00',
  },
];

// ─── 법안 토론 ───────────────────────────────────────

export const MOCK_BILL_THREADS: BillThread[] = [
  {
    id: 'BT001',
    billTitle: '소상공인 보호 및 지원에 관한 법률 개정안',
    billCode: 'WIKI-22-1049',
    billSummary:
      '소상공인의 디지털 전환 지원 및 AI 활용 능력 배양을 위한 국가·지자체 책무를 강화하는 개정안.',
    diffData: [
      { type: 'unchanged', text: '제1조(목적) 이 법은 소상공인의 보호 및 경영안정을 지원함으로써' },
      { type: 'removed',   text: '소상공인의 사회적ㆍ경제적 지위 향상을 도모함을 목적으로 한다.' },
      { type: 'added',     text: '소상공인의 자생력을 확보하고 디지털 전환을 지원하여 지속가능한 성장을 도모함을 목적으로 한다.' },
      { type: 'unchanged', text: '제2조(정의) 이 법에서 사용하는 용어의 뜻은 다음과 같다.' },
      { type: 'added',     text: '3. "디지털 전환"이란 전통적 상행위에 정보통신기술을 접목하여 경영 효율성을 높이는 과정을 말한다.' },
      { type: 'unchanged', text: '제3조(국가 및 지방자치단체의 책무) 국가와 지방자치단체는' },
      { type: 'removed',   text: '소상공인의 경영안정을 위한 시책을 수립ㆍ시행하여야 한다.' },
      { type: 'added',     text: '소상공인의 인공지능(AI) 활용 능력 배양 및 스마트 상점 확산을 위한 구체적인 지원 방안을 마련하여야 한다.' },
    ],
    consensusScore: 82,
    replyCount: 24,
    createdAt: '2026-05-01T00:00:00+09:00',
  },
  {
    id: 'BT002',
    billTitle: '청년 주거 안정 특별법 제정안',
    billCode: 'WIKI-22-1102',
    billSummary:
      '만 19~39세 청년의 주거비 부담 완화를 위한 공공임대 확대 및 월세 세액공제 확대를 규정하는 특별법.',
    diffData: [
      { type: 'added', text: '제1조(목적) 이 법은 청년의 주거 안정을 도모하고 주거비 부담을 경감함을 목적으로 한다.' },
      { type: 'added', text: '제2조(정의) "청년"이란 19세 이상 39세 이하인 사람을 말한다.' },
      { type: 'added', text: '제3조(청년 주거 지원) 국가는 청년 공공임대주택을 연 5만 호 이상 공급하여야 한다.' },
    ],
    consensusScore: 67,
    replyCount: 41,
    createdAt: '2026-05-08T00:00:00+09:00',
  },
];

export const MOCK_BILL_REPLIES: BillReply[] = [
  {
    id: 'BR001',
    threadId: 'BT001',
    replyType: 'evidence',
    content: '디지털 전환 정의 조항 신설은 현대 상행위의 온라인/디지털 변화 흐름을 적법하게 반영하므로 법률 실효성을 증진시키는 매우 긍정적인 방향입니다.',
    sourceUrl: 'https://www.mss.go.kr/2025/report',
    authorName: '정책연구_김시민',
    verifiedCount: 18,
    needsReviewCount: 1,
    createdAt: '2026-05-02T10:00:00+09:00',
  },
  {
    id: 'BR002',
    threadId: 'BT001',
    replyType: 'counter',
    content: 'AI 활용능력 배양 지원 책무를 강화하는 부분은 구체적인 국가 예산 배정이 뒷받침되지 않으면 실질적인 스마트 기기 보급이나 교육이 불가합니다. 재정 조달 조항 보강이 선행되어야 합니다.',
    sourceUrl: 'https://open.assembly.go.kr/budget/2026',
    authorName: '재정분석_이동혁',
    verifiedCount: 12,
    needsReviewCount: 2,
    createdAt: '2026-05-03T14:30:00+09:00',
  },
  {
    id: 'BR003',
    threadId: 'BT001',
    replyType: 'source',
    content: '소상공인시장진흥공단의 2025년도 실태 조사 결과에 따르면, 소상공인의 약 72.4%가 디지털 격차 해소를 위해 국가 주도의 맞춤형 교육 인프라를 가장 시급한 현안으로 지적했습니다.',
    sourceUrl: 'https://www.semas.or.kr/stat/2025',
    authorName: '학계보고_박영철',
    verifiedCount: 24,
    needsReviewCount: 0,
    createdAt: '2026-05-04T09:15:00+09:00',
  },
  {
    id: 'BR004',
    threadId: 'BT002',
    replyType: 'evidence',
    content: '청년 주택 연 5만 호 공급은 국토교통부 5개년 청년 특별 공급 로드맵의 핵심 계획과 정확하게 부합하며, 청년 1인 가구 주거 비용 경감에 결정적 기여를 할 것으로 증명됩니다.',
    sourceUrl: 'https://www.molit.go.kr/2025/housing',
    authorName: '주거복지_안재희',
    verifiedCount: 32,
    needsReviewCount: 3,
    createdAt: '2026-05-09T11:00:00+09:00',
  },
];

// ─── 공개 질의 ───────────────────────────────────────

export const MOCK_QUESTIONS: PublicQuestion[] = [
  {
    id: 'QU001',
    questionCode: 'QU-2026-0012',
    targetMember: '김철수 의원',
    targetMemberId: 'M01',
    title: '소상공인 보호법 개정안 찬성 표결 근거 요청',
    content:
      '2026년 4월 12일 본회의에서 소상공인 보호법 개정안에 찬성 표결하셨습니다. 해당 법안의 디지털 전환 지원 예산 출처와 집행 계획을 구체적으로 공개해 주시기 바랍니다.\n\n[📢 의원실 공식 소명 답변서]\n안녕하십니까, 김철수 의원실입니다. 귀하께서 질의하신 디지털 전환 지원 예산은 중소벤처기업부의 "스마트 상점 기술 보급 사업" 기존 예산 350억 원을 우선 전용하여 집행될 예정이며, 부족분은 내년도 본예산 심사 시 최우선 순위로 증액 확보할 것을 법률 부칙에 명시하였습니다. 상세 예산 배분표는 의원실 공식 블로그에 투명하게 공개해 두었습니다. 관심 가져 주셔서 감사합니다.',
    sourceUrl: 'https://open.assembly.go.kr/bills/22/XXXXXX/vote',
    status: 'answered',
    voteCount: 1482,
    authorName: '시민_홍길동',
    createdAt: '2026-04-15T09:00:00+09:00',
    deadline: '2026-04-22T09:00:00+09:00',
  },
  {
    id: 'QU002',
    questionCode: 'QU-2026-0045',
    targetMember: '이영희 의원',
    targetMemberId: 'M02',
    title: '본회의 출석률 저조에 대한 소명 요청',
    content:
      '22대 국회 2차 회기 중 본회의 출석률이 64%로 집계됩니다. 나머지 36% 불출석에 대한 사유를 공개해 주시기 바랍니다.',
    sourceUrl: 'https://open.assembly.go.kr/attendance/22',
    status: 'open',
    voteCount: 892,
    authorName: '시민_김민준',
    createdAt: '2026-05-01T14:00:00+09:00',
    deadline: '2026-05-22T14:00:00+09:00',
  },
  {
    id: 'QU003',
    questionCode: 'QU-2026-0089',
    targetMember: '박준영 의원',
    targetMemberId: 'M03',
    title: '지역구 예산 집행 불투명성 질의',
    content:
      '2026년 지역구 SOC 예산 중 약 32억원의 집행 내역이 공개되지 않았습니다. 세부 집행 내역 및 수혜 사업체 목록을 공개해 주시기 바랍니다.',
    sourceUrl: 'https://www.digitalbrain.go.kr/budget',
    status: 'open',
    voteCount: 2103,
    authorName: '시민_이수진',
    createdAt: '2026-05-10T11:00:00+09:00',
    deadline: '2026-05-31T11:00:00+09:00',
  },
  {
    id: 'QU004',
    questionCode: 'QU-2026-0102',
    targetMember: '현역의원 X',
    targetMemberId: 'M01',
    title: '입법 공약 미이행에 대한 공개 질의',
    content:
      '22대 국회 개원 공약이었던 "청년 창업 지원법" 발의가 회기 종료 후에도 이루어지지 않았습니다. 미이행 사유와 향후 계획을 밝혀 주시기 바랍니다.',
    status: 'closed',
    voteCount: 3421,
    authorName: '시민_박철호',
    createdAt: '2026-02-01T09:00:00+09:00',
    deadline: '2026-05-01T09:00:00+09:00',
  },
];

// ─── 홈 피드 (최신 게시물 통합) ─────────────────────

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
    id: 'FC001',
    boardType: 'factcheck',
    title: '"집권 이후 소득 15% 증가" 발언 팩트체크',
    meta: '2026.05.12 · 검증 184명',
    badge: '대체로 거짓',
    badgeColor: 'var(--danger)',
    href: '/factcheck/FC001',
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

// ─── 플랫폼 통계 ─────────────────────────────────────

export const MOCK_PLATFORM_STATS = {
  memberCount: 300,
  verifiedBillCount: 12482,
  activeQuestionCount: 158,
  factcheckCount: 847,
} as const;

// ─── 시민 입법 제안 모의 데이터 (Phase 6) ─────────────

export const MOCK_PROPOSALS: BillProposal[] = [
  {
    id: 'PR001',
    title: '전세사기 방지 및 임차인 보증금 보호 강화 특별 제안',
    purpose: '임대차 계약 시 임대인의 선순위 담보권 및 세금 체납 정보를 실시간 의무 공개하도록 하여 전세사기를 사전 예방함.',
    background: '최근 전세사기 사태 등으로 청년·신혼부부의 전세 보증금 피해가 막대합니다. 계약 시 임대인의 체납 여부를 임차인이 미리 검토할 수 없어 속수무책으로 당하는 불평등 임대차 정보 구조를 시정하고자 발의합니다.',
    status: 'community_review',
    authorName: '시민_이강산',
    createdAt: '2026-05-15T09:00:00+09:00',
    upvoteCount: 234,
    diffData: [
      { type: 'unchanged', text: '제1조(목적) 이 법은 주택의 임대차에 관하여 「민법」에 대한 특례를 규정함으로써' },
      { type: 'removed', text: '국민 주거생활의 안정을 보장함을 목적으로 한다.' },
      { type: 'added', text: '임차인의 보증금 권리 보호를 확고히 하고 공정한 거래 정보를 공개하여 국민 주거생활의 안정을 도모함을 목적으로 한다.' },
      { type: 'added', text: '제3조의7(임대인의 세금 체납 정보 등 제공 의무) 임대인은 임대차 계약 체결 시 임차인에게 국세징수법에 따른 납세증명서 및 선순위 확정일자 부여 현황 정보를 의무적으로 제시하여야 한다.' }
    ],
    versions: [
      {
        version: 1,
        createdAt: '2026-05-15T09:00:00+09:00',
        authorName: '시민_이강산',
        changeSummary: '최초 시민 제안 법안 초안 발의',
        diffData: [
          { type: 'unchanged', text: '제1조(목적) 이 법은 주택의 임대차에 관하여 「민법」에 대한 특례를 규정함으로써' },
          { type: 'removed', text: '국민 주거생활의 안정을 보장함을 목적으로 한다.' },
          { type: 'added', text: '임차인의 보증금 권리 보호를 확고히 하고 공정한 거래 정보를 공개하여 국민 주거생활의 안정을 도모함을 목적으로 한다.' },
          { type: 'added', text: '제3조의7(임대인의 세금 체납 정보 등 제공 의무) 임대인은 임대차 계약 체결 시 임차인에게 국세징수법에 따른 납세증명서 및 선순위 확정일자 부여 현황 정보를 의무적으로 제시하여야 한다.' }
        ]
      },
      {
        version: 2,
        createdAt: '2026-05-16T14:00:00+09:00',
        authorName: '집단지성_박변호',
        changeSummary: '임대인 세금 체납 증명 첨부 의무화 및 위반 시 무조건 계약 해제 권한 신설 보완',
        diffData: [
          { type: 'unchanged', text: '제1조(목적) 이 법은 주택의 임대차에 관하여 「민법」에 대한 특례를 규정함으로써' },
          { type: 'removed', text: '국민 주거생활의 안정을 보장함을 목적으로 한다.' },
          { type: 'added', text: '임차인의 보증금 권리 보호를 확고히 하고 공정한 거래 정보를 공개하여 국민 주거생활의 안정을 도모함을 목적으로 한다.' },
          { type: 'added', text: '제3조의7(임대인의 세금 체납 정보 등 제공 의무) 임대인은 임대차 계약 체결 시 임차인의 동의를 얻어 미납국세 및 지방세 열람 권한을 제공하거나 관련 증명서를 계약서 작성 시 첨부하여야 하며, 이를 위반하거나 거짓 제시할 시 임차인은 최고 없이 계약을 무효 및 해제할 수 있다.' }
        ]
      }
    ],
    legalOpinions: [
      {
        id: 'LO001',
        authorName: '헌법학_장준혁 변호사',
        rating: 'constitutional',
        comment: '임차인의 알 권리 보장 및 정보 비대칭 해소를 통한 피해 예방 측면에서 입법 목적이 정당하고 합헌적인 범주입니다. 다만 미납 국세 및 지방세 열람 편의성을 강화하는 후속 행정 명령이나 전산 시스템 연계가 병행된다면 실제 거래 현장에서의 실효성이 크게 향상될 것으로 평가됩니다.',
        createdAt: '2026-05-17T11:00:00+09:00'
      }
    ]
  },
  {
    id: 'PR002',
    title: '인공지능 서비스 개인정보 주권 및 알고리즘 투명성 보호 제안',
    purpose: '생성형 AI 모델 및 추천 서비스의 알고리즘 원리를 시민이 쉽게 이해할 수 있도록 공개하고, 무단 데이터 수집 및 학습에 대한 정당한 대가와 거부권을 보장함.',
    background: '거대 IT 기업들이 시민들의 동의 없이 생성형 AI의 가중치 학습 용도로 데이터를 수집하여 상업적 이득을 취하고 있으나, 시민들은 거부조차 할 수 없는 불평등을 해결하기 위해 개인정보 주권 기반 법안을 제안합니다.',
    status: 'legal_review',
    authorName: '시민_김우주',
    createdAt: '2026-05-14T10:00:00+09:00',
    upvoteCount: 145,
    diffData: [
      { type: 'unchanged', text: '제1조(목적) 이 법은 개인정보의 처리 및 보호에 관한 사항을 규정함으로써' },
      { type: 'removed', text: '개인의 자유와 권리를 보호하고, 나아가 개인의 존엄과 가치를 구현함을 목적으로 한다.' },
      { type: 'added', text: '개인의 데이터 주권을 확립하고, 인공지능 알고리즘의 설명 의무 및 투명성을 제고하여 존엄과 가치를 실현함을 목적으로 한다.' },
      { type: 'added', text: '제28조의8(인공지능 학습 거부권 및 설명요구권) 정보주체는 자신의 개인정보가 인공지능 학습에 사용되는 것을 언제든지 거부할 권리를 가지며, 서비스 제공자는 주요 의사결정 알고리즘의 원리를 알기 쉽게 설명하여야 한다.' }
    ],
    versions: [
      {
        version: 1,
        createdAt: '2026-05-14T10:00:00+09:00',
        authorName: '시민_김우주',
        changeSummary: 'AI 알고리즘 투명성 및 학습 동의권 입법 초안 제출',
        diffData: [
          { type: 'unchanged', text: '제1조(목적) 이 법은 개인정보의 처리 및 보호에 관한 사항을 규정함으로써' },
          { type: 'removed', text: '개인의 자유와 권리를 보호하고, 나아가 개인의 존엄과 가치를 구현함을 목적으로 한다.' },
          { type: 'added', text: '개인의 데이터 주권을 확립하고, 인공지능 알고리즘의 설명 의무 및 투명성을 제고하여 존엄과 가치를 실현함을 목적으로 한다.' },
          { type: 'added', text: '제28조의8(인공지능 학습 거부권 및 설명요구권) 정보주체는 자신의 개인정보가 인공지능 학습에 사용되는 것을 언제든지 거부할 권리를 가지며, 서비스 제공자는 주요 의사결정 알고리즘의 원리를 알기 쉽게 설명하여야 한다.' }
        ]
      }
    ],
    legalOpinions: [
      {
        id: 'LO002',
        authorName: 'IT전문_박상현 변호사',
        rating: 'needs_amendment',
        comment: '빅테크 기업의 데이터 무단 스크래핑 제어 등 정보 주체 보호 취지에는 적극 동의하나, "언제든지 학습 사용 거부 및 철회 권리"를 무소급 적용할 경우, 이미 고정화된 AI 파라미터(Neural Weights) 내에서 특정 개인의 학습 기여도를 완벽하게 추려내 삭제 및 소거하는 기술적 조치가 대단히 어렵습니다. 따라서 법 조문의 실효성을 기하기 위해서는 "수집 단계에서의 명시적 Opt-in 동의 체계와 상업적 이익 공유 비율 정의" 형태로 조항의 자구를 현실적이고 유연하게 수정·보완할 필요가 있습니다.',
        createdAt: '2026-05-18T16:30:00+09:00'
      }
    ]
  }
];
