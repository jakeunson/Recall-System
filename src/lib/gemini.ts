/**
 * Political OS — Gemini API Client (Server-side Only)
 *
 * 이 모듈은 Next.js Server-side(API Routes 및 Server Components) 환경 전용입니다.
 * 브라우저 환경 노출을 차단하기 위해 process.env.GEMINI_API_KEY를 안전하게 활용합니다.
 */

export interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
  }[];
}

/**
 * Gemini 2.5 Flash API를 호출하는 범용 서버 사이드 헬퍼 함수입니다.
 *
 * @param prompt AI에게 전달할 분석 대상 및 세부 텍스트
 * @param systemInstruction AI의 페르소나 및 응답 행동 지침 (시스템 지시사항)
 * @param responseMimeType 응답 형식 ("text/plain" 또는 구조적 출력을 위한 "application/json")
 */
export async function callGemini(
  prompt: string,
  systemInstruction: string,
  responseMimeType: "application/json" | "text/plain" = "text/plain"
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다. 프로젝트 루트에 .env.local 파일을 생성하고 키를 설정해 주세요.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [
        {
          text: systemInstruction,
        },
      ],
    },
    generationConfig: {
      responseMimeType,
      temperature: 0.1, // 분석의 정확성, 결정론적 재현성 보장을 위해 0.1로 고정
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API HTTP Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data: GeminiResponse = await response.json();
  const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textResult) {
    throw new Error("Gemini API 응답 결과에서 유효한 텍스트 본문(text)을 추출하지 못했습니다.");
  }

  return textResult;
}
