/**
 * Political OS — 마스킹 유틸리티
 *
 * 정당명·지역구·인물명 등 편향 유발 키워드를 중립 레이블로 치환합니다.
 * PRD Section 2.2 Dynamic Masking System의 규칙 기반 간소화 버전.
 */

// ─── 마스킹 규칙 ─────────────────────────────────────

const PARTY_RULES: [RegExp, string][] = [
  [/국민의힘|개혁신당/g, '[보수·중도우파 성향 정당]'],
  [/더불어민주당|조국혁신당|진보당/g, '[진보·개혁 성향 정당]'],
  [/우리 민주당/g, '우리 진영 정당'],
  [/보수 정당/g, '보수 성향 정당'],
  [/진보 정당/g, '진보 성향 정당'],
];

const REGION_RULES: [RegExp, string][] = [
  // 고소득 도심 자치구
  [/강남구|서초구|송파구|용산구/g, '[A형 고소득 도심 자치구]'],
  // 서민 주거 밀집
  [/노원구|도봉구|강북구|중랑구/g, '[B형 서민 주거 자치구]'],
  // 신개발 주거지구
  [/화성시|세종시|판교/g, '[C형 신개발 주거지구]'],
  // 대도시
  [/광주|대구|부산|인천|대전|울산/g, '[D형 광역 대도시]'],
  // 특정 지역
  [/호남|영남|충청|강원|제주/g, '[E형 특정 광역권]'],
];

const PERSON_RULES: [RegExp, string][] = [
  // 주요 정치인명 (의원 DB가 없으므로 발언 내 컨텍스트 마스킹)
  [/우리 대표|당 대표|원내대표/g, '[해당 정당 대표]'],
];

const MEDIA_RULES: [RegExp, string][] = [
  [/조선일보|중앙일보|동아일보/g, '[A형 보수·우파 성향 언론사]'],
  [/한겨레|경향신문|오마이뉴스/g, '[B형 진보·개혁 성향 언론사]'],
  [/대한일보|서울일보|한국일보/g, '[C형 전국 종합 언론사]'],
];

// ─── 마스킹 함수 ─────────────────────────────────────

/**
 * 텍스트에서 정당·지역·인물 관련 편향 키워드를 중립 레이블로 치환합니다.
 */
export function applyMasking(text: string): string {
  let result = text;

  for (const [pattern, replacement] of PARTY_RULES) {
    result = result.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of REGION_RULES) {
    result = result.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of PERSON_RULES) {
    result = result.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of MEDIA_RULES) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

/**
 * 언론 보도 매체명만 특정하여 중립 필터링 처리합니다.
 */
export function applyMediaMasking(mediaName: string): string {
  let result = mediaName;
  for (const [pattern, replacement] of MEDIA_RULES) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * 의원 데이터 배열 전체에 마스킹을 적용합니다. (statements만 마스킹)
 */
export function maskMemberStatements<T extends { statements: { text: string; category: string }[] }>(
  members: T[]
): T[] {
  return members.map((m) => ({
    ...m,
    statements: m.statements.map((s) => ({ ...s, text: applyMasking(s.text) })),
  }));
}

/**
 * 블라인드 모드: 정당명을 블러 처리할 태그로 감쌉니다.
 * CSS에서 .blurred { filter: blur(4px); user-select: none; } 를 적용하세요.
 */
export function wrapPartyWithBlur(text: string): string {
  let result = text;
  const parties = ['국민의힘', '더불어민주당', '조국혁신당', '개혁신당', '진보당'];
  for (const party of parties) {
    result = result.replaceAll(party, `<span class="blurred">${party}</span>`);
  }
  return result;
}

// ─── 익명 ID 생성 ────────────────────────────────────

/**
 * 의원 인덱스를 기반으로 익명 식별 코드를 생성합니다.
 * 예: L-◆◆1, L-◆◆2
 */
export function generateAnonymousId(index: number): string {
  return `L-◆◆${index + 1}`;
}
