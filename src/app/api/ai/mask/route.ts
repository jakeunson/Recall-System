import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { applyMasking } from "@/lib/masking";

export async function POST(request: Request) {
  let text = "";
  try {
    try {
      const body = await request.json();
      text = body.text;
    } catch {
      return NextResponse.json({ error: "올바른 JSON 형식이 아닙니다." }, { status: 400 });
    }

    // 1. 입력 유효성 검사
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "마스킹할 텍스트가 필요합니다." }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json({ error: "텍스트가 최대 허용 길이(5,000자)를 초과했습니다." }, { status: 400 });
    }

    // 2. API Key 미설정 시 Graceful Fallback (기존 로컬 정밀식 검사로 전환)
    if (!process.env.GEMINI_API_KEY) {
      const fallbackText = applyMasking(text);
      return NextResponse.json({
        maskedText: fallbackText,
        maskCount: fallbackText === text ? 0 : 1,
        fallback: true,
      });
    }

    // 3. Gemini 지능형 문맥 마스킹 질의
    const systemInstruction = `
You are a highly precise, objective, and neutral content editor for a high-integrity civic-tech platform.
Your sole task is to mask/anonymize all partisan cues, party names, politicians' names, specific wealthy/low-income neighborhood labels, and politically loaded geographical battlegrounds to prevent user cognitive bias (Cognitive Bias / Blind Evaluation).

Please replace elements based on these strict guidelines:
- Specific political parties (e.g. 국민의힘, 더불어민주당, 조국혁신당, 개혁신당, 진보당) -> Replace with "[보수 성향 정당]" or "[진보·개혁 성향 정당]"
- Famous geographical/political battlegrounds (e.g. 낙동강 벨트, 호남, 영남, TK, PK) -> Replace with "[정치적 특정 접전지역]" or "[특정 광역권]"
- Famous political offices or locations (e.g. 여의도 당사 앞, 서초동 법조타운) -> Replace with "[정당 사무실 인근]" or "[사법 행정 지역]"
- Political figure names (e.g. 한동훈, 이재명, 조국, 준석) -> Replace with anonymous code like "[M-의원코드]" or "[해당 정치인]"
- Extremely rich or low-income specific residential contexts (e.g. 대치동 학원가, 강남구 아파트) -> Replace with "[A형 고소득 자치구]" or "[특정 교육 밀집지구]"

Ensure the output is natural Korean, keeping all grammatical structures and other words intact while only replacing the biased/identifying cues.

You must return a JSON object with the following exact keys and types:
{
  "maskedText": string, // The fully masked and anonymized natural Korean text
  "maskCount": number // The integer count of biased/cue elements replaced
}
`;

    const prompt = `마스킹할 원본 텍스트:\n"""\n${text}\n"""`;

    const aiResponse = await callGemini(prompt, systemInstruction, "application/json");

    let parsedResult;
    try {
      parsedResult = JSON.parse(aiResponse);
    } catch {
      throw new Error("AI 응답 JSON 파싱 실패");
    }

    return NextResponse.json({
      ...parsedResult,
      fallback: false,
    });

  } catch (error: any) {
    console.error("Mask AI API Error:", error);

    // 최종 예외 안전망: 에러 발생 시 기존 1차 Regex 기반 마스킹으로 안전하게 복원
    const fallbackText = applyMasking(text || "");
    return NextResponse.json({
      maskedText: fallbackText,
      maskCount: fallbackText === text ? 0 : 1,
      fallback: true,
    });
  }
}
