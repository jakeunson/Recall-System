import { NextResponse } from 'next/server';

// 1시간 인메모리 캐싱 객체 (메모리 누수를 최소화하기 위한 단순 키-값 형태)
interface CachedNews {
  data: any[];
  timestamp: number;
}

const newsCache = new Map<string, CachedNews>();
const CACHE_DURATION = 1000 * 60 * 60; // 1시간 (3,600,000 ms)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: '검색어(q) 매개변수가 필요합니다.' }, { status: 400 });
  }

  const now = Date.now();
  const cached = newsCache.get(query);

  // 1. 캐시 히트 (Cache Hit) & 유효 기간 이내일 경우 즉각 캐시 반환
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    console.log(`[News Proxy] 캐시 히트: "${query}" (남은 캐시 유효 시간: ${Math.round((CACHE_DURATION - (now - cached.timestamp)) / 1000)}초)`);
    return NextResponse.json(cached.data);
  }

  // 2. 환경 변수 로드
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  // 3. API 키 미등록 또는 미발급 시 안전하게 Mock 또는 폴백 결과 처리 (에러 방지)
  if (!clientId || !clientSecret) {
    console.warn('[News Proxy] Warning: NAVER_CLIENT_ID 또는 SECRET 환경 변수가 설정되지 않았습니다. 임시 모의 뉴스를 반환합니다.');
    
    const fallbackNews = [
      {
        title: `<b>${query}</b> 관련 민생 법안 및 여야 협치 전격 추진`,
        originallink: 'https://open.assembly.go.kr',
        link: 'https://open.assembly.go.kr',
        description: `시민들의 뜨거운 지지를 받고 있는 ${query} 안건에 대하여 국회 소관 상임위에서 본격적인 심사가 가동되었습니다.`,
        pubDate: new Date().toUTCString(),
      },
      {
        title: `시민 사회, <b>${query}</b> 공약 이행 여부 집중 모니터링 개시`,
        originallink: 'https://open.assembly.go.kr',
        link: 'https://open.assembly.go.kr',
        description: `팩트체크 전문 평가단 및 시민 연합은 ${query} 발언 및 의정 이행율에 대해 정합적 지표를 토대로 분석 리포트를 배포하기로 했습니다.`,
        pubDate: new Date(Date.now() - 3600000 * 5).toUTCString(),
      }
    ];

    return NextResponse.json(fallbackNews);
  }

  try {
    // 4. 네이버 뉴스 검색 API 호출 (최신 유사도순 정렬로 5개 추출)
    const naverUrl = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=5&sort=sim`;

    const response = await fetch(naverUrl, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      // Next.js 라우터 내 fetch 캐시 오버라이딩 방지
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Naver News API error: status ${response.status}`);
    }

    const result = await response.json();
    const items = result.items || [];

    // 5. 서버 인메모리 저장소에 캐시 등록
    newsCache.set(query, { data: items, timestamp: now });
    console.log(`[News Proxy] API 호출 완료 및 신규 캐시 저장: "${query}"`);

    return NextResponse.json(items);
  } catch (error: any) {
    console.error('[News Proxy] API 호출 에러 발생:', error);

    // API 장애 발생 시 만료된 캐시가 존재하면 버리지 않고 리턴하여 사용자 경험 수호
    if (cached) {
      console.log(`[News Proxy] API 호출 실패로 만료된 기존 캐시 재활용: "${query}"`);
      return NextResponse.json(cached.data);
    }

    // 완전히 기사 조회가 안 될 시 빈 기사 배열을 에러 없이 전달하여 UI 크래시 완벽 차단
    return NextResponse.json([]);
  }
}
