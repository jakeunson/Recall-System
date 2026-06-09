/**
 * Political OS — Groq API Client (Server-side Only)
 *
 * 이 모듈은 Next.js Server-side(API Routes 및 Server Components) 환경 전용입니다.
 * 브라우저 환경 노출을 차단하기 위해 process.env.GROQ_API_KEY를 안전하게 활용합니다.
 */

export interface GroqResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
}

/**
 * Groq API (Llama 3 기반)를 호출하는 범용 서버 사이드 헬퍼 함수입니다.
 * OpenAI Chat Completions 규격을 따릅니다.
 *
 * @param prompt AI에게 전달할 분석 대상 및 세부 텍스트
 * @param systemInstruction AI의 페르소나 및 응답 행동 지침 (시스템 지시사항)
 * @param responseFormat 응답 형식 ("text" 또는 구조적 출력을 위한 "json_object")
 */
export async function callGroq(
  prompt: string,
  systemInstruction: string,
  responseFormat: "json_object" | "text" = "text"
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY가 설정되지 않았습니다.");
  }

  const url = "https://api.groq.com/openai/v1/chat/completions";

  const requestBody: any = {
    model: "llama-3.3-70b-versatile", // 권장 모델, 필요시 llama3-8b-8192 사용
    messages: [
      {
        role: "system",
        content: systemInstruction,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.1, // 분석의 정확성, 결정론적 재현성 보장을 위해 낮게 설정
  };

  if (responseFormat === "json_object") {
    requestBody.response_format = { type: "json_object" };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // HTTP Status가 429일 때 이를 식별하기 쉽게 에러 메시지 구성
    throw new Error(`Groq API HTTP Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data: GroqResponse = await response.json();
  const textResult = data.choices?.[0]?.message?.content;

  if (!textResult) {
    throw new Error("Groq API 응답 결과에서 유효한 텍스트 본문(content)을 추출하지 못했습니다.");
  }

  return textResult;
}
