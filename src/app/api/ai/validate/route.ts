import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { callGroq } from "@/lib/groq";
import { detectEmotionWords } from "@/lib/emotion-filter";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    // 1. 입력 유효성 검사 및 남용 방지
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "검사할 텍스트가 필요합니다." }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json({ error: "텍스트가 최대 허용 길이(5,000자)를 초과했습니다." }, { status: 400 });
    }

    // 2. API Key 미설정 검사 (Groq, Gemini 둘 다 없을 경우 Local 처리)
    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      const localResult = detectEmotionWords(text);
      return NextResponse.json({
        emotionScore: localResult.hasEmotionWords ? 70 : 0,
        detectedKeywords: localResult.detectedWords,
        suggestions: [
          "감정 자극 표현을 배제하고 구체적인 통계 수치나 객체적 공공 데이터 근거 위주로 작성해 주세요."
        ],
        warningMessage: localResult.warningMessage,
        fallback: true,
        provider: "local",
      });
    }

    // 3. AI 지능형 감정 분석 질의
    const systemInstruction = `
You are an advanced, completely neutral, and objective linguistic editor for a high-integrity civic-tech platform.
Your task is to analyze the input Korean text for political emotional agitation, loaded words, hostile framing, hate speech, inflammatory incitement, or extreme bias.

You must return a JSON object with the following exact keys and types:
{
  "emotionScore": number, // 0 to 100 representing emotional intensity (0 = purely data-driven/neutral, 100 = highly inflammatory/hateful)
  "detectedKeywords": string[], // Specific highly loaded/emotional or biased terms found in the text
  "suggestions": string[], // 1 to 3 concrete Korean suggestions on how to rewrite the text to be objective, neutral, and data-driven
  "warningMessage": string // A respectful message guiding the citizen if emotionScore >= 40, otherwise empty string ""
}
`;

    const prompt = `검사할 시민 제출 내용:\n"""\n${text}\n"""`;

    let aiResponse = "";
    let provider = "";

    try {
      // Tier 1: Groq 시도
      if (process.env.GROQ_API_KEY) {
        aiResponse = await callGroq(prompt, systemInstruction, "json_object");
        provider = "groq";
      } else {
        throw new Error("GROQ_API_KEY 미설정");
      }
    } catch (groqError) {
      console.warn("Groq API 실패, Gemini 우회 시도:", groqError);
      
      // Tier 2: Gemini 시도
      if (process.env.GEMINI_API_KEY) {
        aiResponse = await callGemini(prompt, systemInstruction, "application/json");
        provider = "gemini";
      } else {
        throw new Error("GEMINI_API_KEY 미설정");
      }
    }
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(aiResponse);
    } catch {
      // JSON 파싱 실패 시 로컬 Fallback
      throw new Error("AI 응답 JSON 파싱 실패");
    }

    return NextResponse.json({
      ...parsedResult,
      fallback: false,
      provider,
    });

  } catch (error: any) {
    console.error("Emotion AI Validate Error:", error);
    
    // 최종 예외 안전망: 에러 발생 시 기존 1차 Regex 분석기로 안전하게 후퇴
    try {
      const { text } = await request.clone().json();
      const localResult = detectEmotionWords(text || "");
      return NextResponse.json({
        emotionScore: localResult.hasEmotionWords ? 70 : 0,
        detectedKeywords: localResult.detectedWords,
        suggestions: ["데이터와 사실 근거 위주로 수정해 주세요."],
        warningMessage: localResult.warningMessage,
        fallback: true,
        provider: "local",
      });
    } catch {
      return NextResponse.json({
        emotionScore: 0,
        detectedKeywords: [],
        suggestions: [],
        warningMessage: "",
        fallback: true,
        provider: "local",
      });
    }
  }
}
