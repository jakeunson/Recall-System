import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { analyzeAnswerQuality } from "@/lib/intelligence";

export async function POST(request: Request) {
  try {
    const { question, answer } = await request.json();

    // 1. 입력 유효성 검사
    if (!question || !answer || typeof question !== "string" || typeof answer !== "string") {
      return NextResponse.json({ error: "질문과 답변 텍스트가 모두 필요합니다." }, { status: 400 });
    }

    if (question.length > 5000 || answer.length > 5000) {
      return NextResponse.json({ error: "텍스트가 최대 허용 길이(5,000자)를 초과했습니다." }, { status: 400 });
    }

    // 2. API Key 미설정 시 Graceful Fallback (기존 로컬 시뮬레이션 AQS 결과 반환)
    if (!process.env.GEMINI_API_KEY) {
      const localResult = await analyzeAnswerQuality(question, answer);
      return NextResponse.json({
        totalScore: localResult.auto_score,
        specificity: localResult.specificity_score,
        dataQuality: localResult.data_score,
        actionability: localResult.actionability_score,
        genericPenalty: localResult.generic_penalty,
        rationale: localResult.rationale + " (로컬 분석 엔진 적용)",
        fallback: true,
      });
    }

    // 3. Gemini AQS 정량적 평가 질의
    const systemInstruction = `
You are an extremely objective, strict, and impartial civic data scientist evaluating a public representative's response to an official citizen inquiry.
Your goal is to score the representative's answer against the citizen's question on four core dimensions.

Your grading criteria:
1. specificity (0-100): Does the response cite precise legislative bills, articles, policy codes, or clear governmental schedules?
2. dataQuality (0-100): Does the response include actual numbers, percentages, budgets, statistical citations, or verifiable empirical data?
3. actionability (0-100): Are the future commitments, steps, and execution plans clear, concrete, and measurable?
4. genericPenalty (0-50): Dedicate score points if the answer is stuffed with empty political boilerplates like "최선을 다해 적극 검토하겠습니다" (I will review this positively with best effort) without substance.

Calculate totalScore as: (specificity * 0.35) + (dataQuality * 0.35) + (actionability * 0.3) - genericPenalty. Ensure totalScore is bound between 0 and 100.

You must return a JSON object with the following exact keys and types:
{
  "totalScore": number,
  "specificity": number,
  "dataQuality": number,
  "actionability": number,
  "genericPenalty": number,
  "rationale": string // 1-2 sentences in Korean explaining the concrete evaluation reasoning
}
`;

    const prompt = `
[시민의 공개 질의 내용]:
"""
${question}
"""

[국회의원의 소명 답변 내용]:
"""
${answer}
"""
`;

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
    console.error("AQS AI API Error:", error);

    // 최종 예외 안전망: 오류 발생 시 기존의 로컬 시뮬레이션 결과로 우아하게 백업
    try {
      const { question, answer } = await request.clone().json();
      const localResult = await analyzeAnswerQuality(question || "", answer || "");
      return NextResponse.json({
        totalScore: localResult.auto_score,
        specificity: localResult.specificity_score,
        dataQuality: localResult.data_score,
        actionability: localResult.actionability_score,
        genericPenalty: localResult.generic_penalty,
        rationale: "답변 품질 평가 처리가 완료되었습니다. (로컬 예비 시스템 전환)",
        fallback: true,
      });
    } catch {
      return NextResponse.json({
        totalScore: 50,
        specificity: 50,
        dataQuality: 50,
        actionability: 50,
        genericPenalty: 0,
        rationale: "임시 답변 품질 측정이 적용되었습니다.",
        fallback: true,
      });
    }
  }
}
