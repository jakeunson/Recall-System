/**
 * 실시간 열린국회 API 연동 모듈 (Fetcher)
 * PRD Section 3.2.1 Data Source 참조
 */

const API_KEY = process.env.OPEN_ASSEMBLY_API_KEY || 'DEMO_KEY';
const BASE_URL = 'https://open.assembly.go.kr/portal/openapi';

/**
 * 열린국회 API 공통 Fetcher
 */
export async function fetchOpenAssemblyAPI(endpoint: string, params: Record<string, string> = {}) {
  const urlParams = new URLSearchParams({
    KEY: API_KEY,
    Type: 'json',
    pIndex: '1',
    pSize: '10',
    ...params
  });

  const url = `${BASE_URL}/${endpoint}?${urlParams.toString()}`;

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      throw new Error(`API Request failed: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Open Assembly API Fetch Error:', error);
    return null;
  }
}

/**
 * 국회의원 인적사항 및 기본 정보 조회
 */
export async function getMemberInfo(memberName: string) {
  // 열린국회 API 'nwvrqwxyaytdioooc' (국회의원 인적사항) - 엔드포인트명은 예시
  const data = await fetchOpenAssemblyAPI('nwvrqwxyaytdioooc', {
    HG_NM: memberName
  });
  return data;
}

/**
 * 발의 법안 목록 조회
 */
export async function getMemberBills(memberName: string) {
  // 열린국회 API 'nzacqvxrcajyymuto' (국회의원 발의법률안)
  const data = await fetchOpenAssemblyAPI('nzacqvxrcajyymuto', {
    PROPOSER: memberName
  });
  return data;
}

/**
 * 본회의 출석 정보 조회
 */
export async function getMemberAttendance(memberName: string) {
  // 열린국회 API 'nvqbyncfasiyymuqm' (본회의 출석정보)
  const data = await fetchOpenAssemblyAPI('nvqbyncfasiyymuqm', {
    HG_NM: memberName
  });
  return data;
}
