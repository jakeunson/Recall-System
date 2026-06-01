/**
 * Political OS - Intelligence Layer (Simulated)
 * This layer simulates integration with Google Cloud Vertex AI (Gemini 1.5 Pro).
 */

export interface AQSResult {
  auto_score: number;
  specificity_score: number;
  data_score: number;
  actionability_score: number;
  generic_penalty: number;
  rationale: string;
}

export interface ImpactResult {
  pass_probability: number;
  economic_impact: string;
  legal_conflicts: string[];
}

/**
 * Simulates Gemini AI analyzing answer quality
 */
export async function analyzeAnswerQuality(question: string, answer: string): Promise<AQSResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Logic to simulate AI scoring based on keywords
  const hasData = /[\d%백만|조|억]/.test(answer);
  const hasSpecifics = /[조항|법|계획|추진]/.test(answer);
  const isGeneric = /[검토|노력|최선]/.test(answer);

  return {
    auto_score: hasData && hasSpecifics ? 85 : 45,
    specificity_score: hasSpecifics ? 90 : 30,
    data_score: hasData ? 95 : 20,
    actionability_score: 80,
    generic_penalty: isGeneric ? 15 : 0,
    rationale: "답변이 구체적인 법령 조항을 인용하고 수치 기반의 계획을 제시하고 있습니다."
  };
}

/**
 * Simulates L-Impact Simulation using Vertex AI Vector Search & Gemini
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function simulateLegislativeImpact(_billText: string): Promise<ImpactResult> {
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    pass_probability: 0.68,
    economic_impact: "소상공인 1인당 평균 연 120만원의 수익 증대 효과가 예측됩니다.",
    legal_conflicts: ["정보통신산업 진흥법 제14조와 조문 중복 가능성"],
  };
}

export interface VoteData {
  is_deviated: boolean;
  pai_norm: number;
  cci: number;
}

/**
 * WDI (Voting Deviation Index) Calculation Logic
 * WDI(i) = (1/N) * Σ [ δ(i,b) * (1 + λ*PAI_norm(b)) * (1 + μ*CCI(i,b)) ]
 */
export function calculateWDI(votes: VoteData[], lambda = 0.6, mu = 0.4): number {
  if (votes.length === 0) return 0;

  const scores = votes.map(v => {
    const delta = v.is_deviated ? 1 : 0;
    const weight = (1 + lambda * v.pai_norm) * (1 + mu * v.cci);
    return delta * weight;
  });

  const rawWdi = scores.reduce((a, b) => a + b, 0) / votes.length;
  return rawWdi * 100; // Normalized to 100 for display
}
