# 제품 요구사항 정의서 (PRD)
## 국민소환제 플랫폼 — Political OS v1.0

**문서 버전:** 1.1.0  
**작성 기준일:** 2025년 Q3 (v1.1: GCP 기술 스택 추가)  
**분류:** Confidential / Internal Architecture Specification  
**작성:** Senior Solution Architect & Lead Product Manager (Civic-Tech Division)

---

## 목차

1. [핵심 분석 알고리즘 설계 (Core Algorithms)](#section-1)
2. [인지 편향 차단 UX 및 데이터 마스킹 (Anti-Bias Architecture)](#section-2)
3. [공공 소환 및 답변 SLA 시스템 (Public Pressure Logic)](#section-3)
4. [데이터 아키텍처 및 무결성 (Data Integrity)](#section-4)
5. [서비스 확장 및 공공 인프라 전략](#section-5)
6. [Google Cloud 기반 기술 스택 설계 (GCP Architecture)](#section-6)

---

## Executive Summary

국민소환제 플랫폼은 대한민국 국회의원의 의정 활동 데이터를 객관적·정량적으로 수집·정제·시각화하여, 유권자가 감정이나 진영 논리가 아닌 **데이터 기반**으로 대의민주주의를 감시할 수 있도록 설계된 Civic-Tech OS다. 본 PRD는 플랫폼의 5개 핵심 기술 도메인에 대한 알고리즘 수식, 데이터 스키마, 구현 로직, 리스크 대응 방안을 포함한다.

---

<a name="section-1"></a>
## Section 1. 핵심 분석 알고리즘 설계 (Core Algorithms)

### 1.1 WDI (Voting Deviation Index) — 표결 이탈 지수

#### 1.1.1 개요

WDI는 특정 의원이 소속 정당의 당론 표결에서 얼마나 이탈하였는지를 측정하되, 단순 이탈 빈도가 아닌 **해당 안건의 국민적 관심도**와 **지역구 이해관계 충돌 여부**를 가중치로 포함하여 이탈의 정치적 의미를 차별화한다.

#### 1.1.2 수식 정의

기본 이탈 여부(binary):

```
δ(i, b) = {
  1,  if vote(member_i, bill_b) ≠ party_line(bill_b)
  0,  otherwise
}
```

국민적 관심도 지수 (Public Attention Index, PAI):

```
PAI(b) = α·ln(1 + search_volume(b)) + β·media_coverage_score(b) + γ·petition_count(b)
```

단, α + β + γ = 1 (기본값: α=0.4, β=0.35, γ=0.25)

정규화: PAI_norm(b) = PAI(b) / max(PAI) ∈ [0, 1]

지역구 이해관계 충돌 지수 (Constituency Conflict Index, CCI):

```
CCI(i, b) = {
  1.0,   if 지역구 경제·복지 직접 영향 법안이고 party_line과 지역구 이익이 상충
  0.5,   if 간접 영향
  0.0,   if 무관
}
```

CCI는 법안 메타데이터(소관 상임위, 예산 배분 지역, 산업 분류 코드)를 기반으로 반자동 산출하고, 플랫폼 운영위원회의 주기적 검수를 거친다.

최종 WDI 수식:

```
WDI(i) = (1/N) · Σ_{b=1}^{N} [ δ(i,b) · (1 + λ·PAI_norm(b)) · (1 + μ·CCI(i,b)) ]
```

여기서:
- N: 해당 회기 내 총 표결 안건 수
- λ: PAI 가중치 민감도 계수 (기본값: 0.6)
- μ: CCI 가중치 민감도 계수 (기본값: 0.4)

WDI 정규화 (최종 표시):

```
WDI_score(i) = WDI(i) / WDI_max · 100
```

#### 1.1.3 구현 코드 스니펫 (Python)

```python
import numpy as np
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class BillVote:
    bill_id: str
    member_vote: str       # "yes" | "no" | "abstain" | "absent"
    party_line: str        # "yes" | "no" | "abstain" | "free"
    pai_norm: float        # [0, 1]
    cci: float             # 0.0 | 0.5 | 1.0

def compute_delta(vote: BillVote) -> int:
    if vote.party_line == "free":
        return 0  # 자유 표결은 이탈 아님
    return int(vote.member_vote != vote.party_line)

def compute_wdi(votes: List[BillVote], lambda_=0.6, mu=0.4) -> float:
    if not votes:
        return 0.0
    scores = []
    for v in votes:
        delta = compute_delta(v)
        weight = (1 + lambda_ * v.pai_norm) * (1 + mu * v.cci)
        scores.append(delta * weight)
    return np.mean(scores)

def normalize_wdi(raw_wdi: float, max_wdi: float) -> float:
    return (raw_wdi / max_wdi) * 100 if max_wdi > 0 else 0.0
```

#### 1.1.4 데이터 스키마 (PostgreSQL)

```sql
CREATE TABLE bill_votes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id         VARCHAR(20) NOT NULL REFERENCES bills(id),
    member_id       VARCHAR(10) NOT NULL REFERENCES members(id),
    vote_result     VARCHAR(10) CHECK (vote_result IN ('yes','no','abstain','absent')),
    party_line      VARCHAR(10),
    pai_norm        NUMERIC(5,4),
    cci             NUMERIC(3,1),
    session_code    VARCHAR(10),
    voted_at        TIMESTAMPTZ NOT NULL,
    source_ref      TEXT NOT NULL,        -- 열린국회 API endpoint
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wdi_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id       VARCHAR(10) NOT NULL,
    session_code    VARCHAR(10) NOT NULL,
    raw_wdi         NUMERIC(8,6),
    wdi_score       NUMERIC(5,2),
    computed_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (member_id, session_code)
);
```

#### 1.1.5 Risk & Mitigation

| 리스크 | 설명 | 대응책 |
|--------|------|--------|
| 당론 데이터 미공개 | 정당이 공식 당론을 발표하지 않는 경우 δ 산출 불가 | 원내대표 발언·보도자료를 NLP로 당론 추론, 불확실도 표기 |
| PAI 조작 가능성 | 특정 세력이 검색량·청원수를 인위적으로 부풀릴 수 있음 | bot-score 필터 적용 (Google Trends z-score 이상치 제거), 이동 평균 7일 적용 |
| CCI 주관성 | 지역구 이해관계 분류가 정치적으로 편향될 수 있음 | 법안 소관 상임위 코드 + 예산처 지역별 예산 배분 데이터를 기반으로 규칙 기반 산출 + 외부 학술위원회 반기 검수 |

---

### 1.2 TSR (Trust Score Ranking) — 사용자 신뢰 점수

#### 1.2.1 개요

TSR은 플랫폼 내 시민 참여(청원, 평가, 의견 제출)의 **신뢰도 가중치**를 부여하기 위한 사용자 점수 체계다. 단순 활동량이 아닌, '좌표 찍기'(특정 의원 타겟 여론 조작)와 '에코챔버'(편향된 정보 소비) 패턴을 기술적으로 감지·억제한다.

#### 1.2.2 4가지 구성 지표

**Component 1: 활동 이력 점수 (Activity History Score, AHS)**

```
AHS(u) = Σ_{t=1}^{T} [ a_t · e^{-λ·(T_now - t)} ]
```

- a_t: t 시점 활동 가중치 (청원 서명=1.0, 답변 평가=0.8, 의원 질의=1.5)
- λ: 시간 감쇠 계수 = 0.05 (약 14일 반감기)

**Component 2: 체류 시간 품질 점수 (Engagement Quality Score, EQS)**

단순 체류 시간이 아닌 *콘텐츠 소비의 깊이*를 측정:

```
EQS(u) = Σ_{c} [ depth_ratio(c) · content_weight(c) ]

depth_ratio(c) = min(time_spent(u,c) / estimated_read_time(c), 1.5)
content_weight(c) = { 1.5 if c∈{회의록, 법안전문}, 1.0 if c∈{요약, 뉴스}, 0.5 if c∈{댓글} }
```

**Component 3: 정보 소비 다양성 지수 (Information Diversity Index, IDI)**

엔트로피 기반 편향 측정:

```
IDI(u) = -Σ_{k=1}^{K} p_k(u) · log(p_k(u))   /   log(K)
```

- K: 정당 수 (현행 원내 정당 기준, 최소 4)
- p_k(u): 사용자 u가 정당 k 관련 콘텐츠를 소비한 비율
- IDI ∈ [0, 1]: 0에 가까울수록 단일 편향, 1에 가까울수록 균형 소비

**Component 4: 지역구 인증 가산점 (Constituency Verification Bonus, CVB)**

```
CVB(u) = {
  0.20,   본인인증(주민등록) 기반 선거구 확인 완료
  0.10,   통신사 위치 기반 선거구 추정 (6개월 이상 거주)
  0.00,   미인증
}
```

**최종 TSR 산출:**

```
TSR_raw(u) = w1·AHS_norm + w2·EQS_norm + w3·IDI + w4·CVB
           + penalty_terms(u)

weights: w1=0.30, w2=0.25, w3=0.30, w4=0.15  (Σwi = 1.0)

penalty_terms(u) = -0.3 · flood_flag(u) - 0.5 · sockpuppet_flag(u)
```

**TSR 최종 등급:**

```
TSR_grade(u) = {
  S: TSR_raw ≥ 0.85  → 의견 가중치 ×1.5
  A: 0.70 ≤ TSR < 0.85 → ×1.2
  B: 0.50 ≤ TSR < 0.70 → ×1.0
  C: TSR < 0.50        → ×0.5 (열람 가능, 제출 제한)
}
```

#### 1.2.3 Sockpuppet 탐지 로직

```python
def detect_sockpuppet(user_id: str, db) -> bool:
    """
    동일 IP 대역 + 가입일 집중 + 특정 의원 집중 타겟팅 패턴 탐지
    """
    user = db.get_user(user_id)
    
    # 조건 1: 동일 /24 서브넷에서 24시간 내 5개 이상 계정
    subnet = '.'.join(user.last_ip.split('.')[:3])
    subnet_count = db.count_users_by_subnet(subnet, hours=24)
    
    # 조건 2: 특정 의원에게 제출 비율 > 80%
    target_ratio = db.get_single_member_action_ratio(user_id, days=30)
    
    # 조건 3: IDI < 0.1 (극단적 편향 소비)
    idi = compute_idi(user_id, db)
    
    flag = (subnet_count >= 5) and (target_ratio > 0.80) and (idi < 0.10)
    return flag
```

#### 1.2.4 Risk & Mitigation

| 리스크 | 설명 | 대응책 |
|--------|------|--------|
| 프라이버시 침해 | 지역구 인증 시 개인정보 수집 과다 | 주민등록번호 직접 수집 금지, 공공 마이데이터 API + 영지식 증명(ZKP) 기반 인증 |
| IDI 역차별 | 소수 관심사 가진 사용자(특정 지역구 이슈)가 낮은 IDI로 불이익 | IDI 하한선 보정: 지역구 인증 사용자는 IDI 최소 0.3 보장 |
| TSR 인플레이션 | 장기 사용자가 과도한 신뢰 점수 축적 | 연간 TSR 감쇠율 15% 적용, 비활동 6개월 시 B등급 강제 재조정 |

---

### 1.3 L-Impact Simulator — 입법 영향 시뮬레이터

#### 1.3.1 개요

입법 위키에 시민이 제안한 법안 초안(또는 의원 발의 예정 법안)에 대해:
1. **법령 충돌 분석 (Conflict Detection)**
2. **유사 법안 과거 통과율 예측 (Pass-Rate Prediction)**
3. **사회경제적 영향 시뮬레이션 (Impact Projection)**

을 NLP + 규칙 기반 시스템으로 수행한다.

#### 1.3.2 파이프라인 설계

```
[입력: 법안 텍스트]
        │
        ▼
┌─────────────────────┐
│  Preprocessing      │  형태소 분석 (Kiwi/KoNLPy)
│  & Normalization    │  조문 단위 분절, 법률 용어 정규화
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Legal Entity       │  조문 번호, 법령명, 조항 참조 추출
│  Recognition (LER)  │  Fine-tuned KoLegalBERT 활용
└────────┬────────────┘
         ├────────────────────────┐
         ▼                        ▼
┌─────────────────┐    ┌──────────────────────┐
│ Conflict        │    │ Similarity Search    │
│ Detection       │    │ (Past Bills)         │
│ Module          │    │                      │
└────────┬────────┘    └──────────┬───────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────────┐
│ 충돌 조문 목록  │    │ 유사 법안 군집 +     │
│ + 충돌 유형     │    │ 통과율 분포          │
│ (직접/간접)     │    │                      │
└────────┬────────┘    └──────────┬───────────┘
         └──────────┬─────────────┘
                    ▼
         ┌──────────────────────┐
         │  Impact Report       │
         │  Generator           │
         └──────────────────────┘
```

#### 1.3.3 충돌 탐지 알고리즘

```python
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

class ConflictDetector:
    def __init__(self, legal_corpus_embeddings, legal_corpus_metadata):
        self.model = SentenceTransformer('snunlp/KR-ELECTRA-discriminator')
        self.index = faiss.IndexFlatL2(768)
        self.index.add(legal_corpus_embeddings)
        self.metadata = legal_corpus_metadata

    def detect_conflicts(self, bill_clauses: list[str], 
                         top_k: int = 10,
                         conflict_threshold: float = 0.82) -> list[dict]:
        results = []
        embeddings = self.model.encode(bill_clauses, normalize_embeddings=True)
        
        for i, (clause, emb) in enumerate(zip(bill_clauses, embeddings)):
            distances, indices = self.index.search(
                emb.reshape(1, -1), top_k
            )
            for dist, idx in zip(distances[0], indices[0]):
                similarity = 1 - dist / 2  # L2 → cosine approx
                if similarity >= conflict_threshold:
                    match = self.metadata[idx]
                    conflict_type = self._classify_conflict(clause, match['text'])
                    results.append({
                        'input_clause_idx': i,
                        'matched_law': match['law_name'],
                        'matched_article': match['article_no'],
                        'similarity': round(similarity, 4),
                        'conflict_type': conflict_type
                    })
        return results

    def _classify_conflict(self, clause_a: str, clause_b: str) -> str:
        # Rule-based + LLM hybrid classifier
        # 직접 충돌: 동일 대상에 상반되는 의무/금지 규정
        # 간접 충돌: 관련 법령 위임 범위 초과
        # 중복: 내용 동일하나 다른 법령에 이미 존재
        ...
```

#### 1.3.4 통과율 예측 모델

유사 법안 검색 후, 과거 법안의 메타피처를 기반으로 통과율 회귀:

```
P_pass(b_new) = σ( β₀ + β₁·sim_score + β₂·sponsor_count 
                    + β₃·committee_opinion + β₄·ruling_party_ratio
                    + β₅·media_support_score + ε )
```

- σ: sigmoid 함수
- sim_score: 유사 법안 가중 평균 통과율
- committee_opinion: 소관위 전문위원 검토 의견 감성 점수 [-1, 1]
- ruling_party_ratio: 발의 시점 여당 의석 비율

**모델 학습 데이터:** 제17대~제22대 국회 전체 법안 (~24,000건), scikit-learn LogisticRegression + XGBoost 앙상블

#### 1.3.5 Risk & Mitigation

| 리스크 | 설명 | 대응책 |
|--------|------|--------|
| 법령 데이터 지연 | 법제처 API 업데이트 주기(월 1회)로 인한 신규 법령 미반영 | 법제처 RSS + 국회의안정보시스템 webhook 병행, 미반영 법령 경고 배지 표시 |
| 모델 편향 | 과거 통과율 데이터가 특정 정권 시기 편중 | 정권 코드(여당/야당 발의)를 명시적 변수로 분리, 공정성 감사 (Fairness Audit) 분기별 실시 |
| 허위 법안 제출 | 시민이 악의적 법안 초안을 업로드하여 시스템 오용 | 법안 제출 시 TSR ≥ B등급 필수, AI 욕설·혐오 필터 + 운영팀 48시간 내 검수 |

---

<a name="section-2"></a>
## Section 2. 인지 편향 차단 UX 및 데이터 마스킹 (Anti-Bias Architecture)

### 2.1 Delayed Attribution 로직

#### 2.1.1 설계 원칙

정치적 판단에서 가장 강력한 편향 유발 요소는 **발언자 정체성**의 선공개다. Delayed Attribution은 이를 역전시켜, 사용자가 *내용의 논리적 타당성*을 먼저 평가하게 만든다.

#### 2.1.2 인터랙션 플로우

```
[Phase 1: Content-First Display]
─────────────────────────────────────────────────────
 발언/표결 데이터가 카드 형태로 표시됨
 ┌────────────────────────────────────────┐
 │ 📋 발언 내용                           │
 │ "이 법안은 소상공인 보호를 위해 반드시 │
 │  통과되어야 합니다. 근거는..."         │
 │                                        │
 │  [동의]  [비동의]  [판단 보류]         │
 │  사용자 평가 완료 후 출처 공개         │
 └────────────────────────────────────────┘

[Phase 2: Attribution Reveal Animation]
─────────────────────────────────────────────────────
 사용자가 평가 버튼 클릭 → 2초 딜레이 후 reveal
 ┌────────────────────────────────────────┐
 │ ✅ 평가 완료                           │
 │                                        │
 │  발언자: ██████ 의원 (○○당, △△구)     │  ← fade-in
 │  발언 일시: 2025.06.15 국토위          │
 │  해당 법안: 소상공인 보호법 개정안     │
 │                                        │
 │  💡 같은 발언에 대한 전국 평가 분포:  │
 │  동의 ████████░░ 78%  비동의 22%      │
 │                                        │
 │  ⚠️ 귀하의 평가는 reveal 전 완료됨    │
 └────────────────────────────────────────┘
```

#### 2.1.3 기술 구현 (React + State Machine)

```typescript
type AttributionState = 
  | 'content_only'     // 콘텐츠만 표시
  | 'awaiting_vote'    // 사용자 평가 대기
  | 'voted'            // 평가 완료, reveal 대기
  | 'revealing'        // 애니메이션 중
  | 'revealed';        // 출처 공개 완료

interface ContentCard {
  content_id: string;
  masked_content: string;     // 편향 유발 키워드 제거된 텍스트
  raw_content: string;        // 서버측 암호화 보관
  attribution_encrypted: string; // 클라이언트에 암호화 전송
  reveal_key: string | null;  // voted 상태 후 서버가 발급
}

// Phase 1에서 서버는 attribution을 AES-256으로 암호화하여 전송
// Phase 2에서 사용자가 투표 완료 시 서버가 reveal_key 발급
// 클라이언트에서 복호화 → reveal 애니메이션 실행
```

#### 2.1.4 데이터 무결성 보장

```
사용자 투표 타임스탬프 < reveal_key 발급 타임스탬프
```

이를 위반하는 경우(클라이언트 조작 시도) 해당 투표 무효 처리 및 TSR 페널티 적용.

#### 2.1.5 Risk & Mitigation

| 리스크 | 설명 | 대응책 |
|--------|------|--------|
| Reveal 우회 | 브라우저 DevTools로 암호화된 attribution 추출 시도 | RSA-OAEP 기반 세션 키 교환, reveal_key TTL 30초 설정, 서버 로그 기반 이상 접근 탐지 |
| UX 거부감 | 사용자가 reveal 전 평가를 강제당하는 경험에 이탈 | '건너뛰기' 옵션 제공 (단, 건너뛴 항목은 TSR 점수 미반영 처리로 자연스러운 참여 유도) |

---

### 2.2 Dynamic Masking System

#### 2.2.1 마스킹 대상 키워드 범주

```yaml
masking_rules:
  party_names:
    - pattern: "(국민의힘|더불어민주당|조국혁신당|개혁신당|진보당)"
      replacement: "'{party_type}계 정당'"
      party_type_mapping:
        국민의힘: "보수"
        더불어민주당: "진보"
        조국혁신당: "개혁진보"
        # ...

  constituency_names:
    - pattern: "강남구|서초구|송파구"
      replacement: "A형 고소득 도심 자치구"
    - pattern: "노원구|도봉구|강북구"
      replacement: "B형 서민 주거 밀집 자치구"
    # 분류 기준: 통계청 소득분위 + 주거 밀도 + 산업 구조

  political_figures:
    - type: "regex"
      pattern: "의원명 DB(11,782개 현직/전직 의원)"
      replacement: "M[의원코드]"  # 예: M-2025-0042

  region_economy_types:
    - "제조업 중심 도시" → "C형 산업 기반 도시"
    - "농업·어업 지역"  → "D형 1차산업 지역"
    - "수도권 신도시"   → "E형 신개발 주거지구"
```

#### 2.2.2 실시간 NLP 마스킹 파이프라인

```
[텍스트 입력]
      │
      ▼
[Tokenizer: Kiwi 형태소 분석]
      │ (형태소 + 개체명 태깅)
      ▼
[NER: KoELECTRA 기반 개체명 인식]
  └─ PER (인물), ORG (기관/정당), LOC (지역), MISC
      │
      ▼
[Rule Engine: masking_rules.yaml 매칭]
  └─ 직접 매칭 → 즉시 치환
  └─ 컨텍스트 추론 필요 시 → Inference Module
      │
      ▼
[Inference Module: 정당 유추 방지]
  예: "한동훈" → M-2022-0138 (정당 미표기)
      "여의도 00빌딩" → "국회 인근 사무공간"
      │
      ▼
[Masked Text Output + Masking Log]
```

#### 2.2.3 마스킹 일관성 보장

동일 문서 내에서 동일 개체는 동일 메타레이블로 치환되어야 한다. 이를 위해 **Session-Scoped Entity Registry**를 유지:

```python
class MaskingSession:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.entity_registry: dict[str, str] = {}  # {원본: 마스킹값}
    
    def mask(self, entity: str, category: str) -> str:
        if entity not in self.entity_registry:
            label = self._generate_label(category)
            self.entity_registry[entity] = label
        return self.entity_registry[entity]
    
    def _generate_label(self, category: str) -> str:
        count = sum(1 for k, v in self.entity_registry.items() 
                    if v.startswith(category[0]))
        return f"{category[0]}{count+1:02d}"  # 예: L01, L02 (지역구)
```

#### 2.2.4 Risk & Mitigation

| 리스크 | 설명 | 대응책 |
|--------|------|--------|
| 과잉 마스킹 | 일반 명사가 정당/지역명과 겹쳐 의미 훼손 | Precision 우선 튜닝: NER confidence < 0.85 → 마스킹 스킵 + 원문 표시 |
| 마스킹 우회 | 이미지/스크린샷 형태의 정보 유통 | OCR 기반 이미지 텍스트 마스킹 (Tesseract-KR), 단 구현 Phase 2 예정 |
| 마스킹 역추론 | 메타레이블 패턴으로 정당/지역 역추론 가능 | 메타레이블 풀 다양화 + 주기적 레이블 셔플링 (월 1회) |

---

<a name="section-3"></a>
## Section 3. 공공 소환 및 답변 SLA 시스템 (Public Pressure Logic)

### 3.1 SLA 타이머 및 자동 평판 감점 로직

#### 3.1.1 소환 유형별 SLA 기준

```
┌──────────────────┬──────────────────┬──────────────────┬────────────────┐
│ 소환 유형        │ 1차 응답 기한    │ 정식 답변 기한   │ 미응답 페널티  │
├──────────────────┼──────────────────┼──────────────────┼────────────────┤
│ 긴급 민원        │ 24시간           │ 72시간           │ 일 -0.5점      │
│ 표결 근거 요청   │ 48시간           │ 7일              │ 일 -0.3점      │
│ 입법 위키 의견   │ 72시간           │ 14일             │ 일 -0.2점      │
│ 일반 정책 질의   │ 72시간           │ 21일             │ 일 -0.1점      │
└──────────────────┴──────────────────┴──────────────────┴────────────────┘
```

#### 3.1.2 평판 점수 자동 감점 수식

```
Rep_score(m, t) = Rep_score(m, t₀) + Σ_q [ -penalty(q) · overdue_days(q) · (1 + urgency(q)) ]

단:
  penalty(q): 소환 유형별 일 감점 (위 표 참조)
  overdue_days(q) = max(0, current_date - deadline(q))
  urgency(q): 긴급=1.0, 일반=0.5, 저우선=0.0

  상한 감점: 단일 미응답으로 최대 -15점 (30일 경과 시 cap)
  회복 메커니즘: 정식 답변 완료 + Answer Quality Score ≥ 70 → 누적 감점의 50% 회복
```

#### 3.1.3 미응답 데이터 SEO 강제 노출 피드 설계

미응답이 SLA 초과 시, 해당 데이터를 **구조화된 오픈 데이터 피드**로 자동 발행:

```json
// RSS/Atom + Schema.org 혼합 피드 구조
{
  "@context": "https://schema.org",
  "@type": "GovernmentService",
  "name": "국민소환제 미응답 공개 기록",
  "serviceType": "PoliticalAccountability",
  "provider": {
    "@type": "Person",
    "name": "M-2025-XXXX",        // 마스킹된 의원 코드
    "jobTitle": "국회의원",
    "memberOf": "대한민국 제22대 국회"
  },
  "description": "표결 근거 요청 후 7일 경과 미응답",
  "datePosted": "2025-09-01T00:00:00+09:00",
  "validThrough": "2025-12-31",
  "areaServed": {
    "@type": "AdministrativeArea",
    "name": "A형 도심 자치구 제X선거구"
  },
  "additionalProperty": {
    "@type": "PropertyValue",
    "name": "sla_status",
    "value": "OVERDUE",
    "unitText": "days_overdue",
    "minValue": 7
  }
}
```

**SEO 강제 노출 메커니즘:**
1. sitemap.xml 실시간 업데이트: 미응답 기록 페이지 우선순위 0.9 설정
2. Open Graph + Twitter Card 메타 자동 생성 (SNS 공유 시 요약 자동 표시)
3. Google Search Console API를 통한 색인 요청 자동화 (미응답 발생 후 24시간 이내)
4. 뉴스 RSS 피드 신디케이션: 제휴 언론사 자동 배포

#### 3.1.4 Risk & Mitigation

| 리스크 | 설명 | 대응책 |
|--------|------|--------|
| 허위 소환 | 악의적 목적의 대량 소환으로 특정 의원 괴롭힘 | 소환 제출 요건: TSR ≥ B등급 + 동일 안건 중복 소환 7일 쿨다운 |
| 법적 분쟁 | 의원측에서 명예훼손 소송 제기 가능성 | 공개 데이터는 '응답하지 않았다'는 사실만 기록 (의견/판단 미포함), 법률 자문단 운영 |
| 시스템 과부하 | 특정 이슈 시 소환 폭발적 증가 | Rate limiting: 의원 1인당 일 최대 소환 처리 50건, 초과분 대기열 처리 |

---

### 3.2 Answer Quality Scoring (AQS)

#### 3.2.1 평가 차원

AQS는 유권자 주관 평가(Crowd Scoring)와 자동화 평가(Auto Scoring)를 결합한다.

**Auto Scoring (AS) — 알고리즘 자동 평가:**

```
AS(answer) = w_len · length_score 
           + w_data · data_reference_score 
           + w_spec · specificity_score 
           + w_link · external_link_score

length_score = min(word_count / 300, 1.0)
data_reference_score = min(count(숫자+단위 패턴) / 5, 1.0)
specificity_score = 1 - generic_phrase_ratio(answer)  # "검토하겠습니다" 등 감지
external_link_score = min(count(verified_source_links) / 3, 1.0)

weights: w_len=0.15, w_data=0.35, w_spec=0.30, w_link=0.20
```

`generic_phrase_ratio` 탐지 패턴 예시:
```python
GENERIC_PHRASES = [
    "검토하겠습니다", "살펴보겠습니다", "노력하겠습니다",
    "최선을 다하겠습니다", "관계기관과 협의", "추진 중에 있습니다"
]
# 이러한 구문이 답변 전체에서 차지하는 비율 계산
```

**Crowd Scoring (CS) — 유권자 집단 평가:**

5개 차원, 각 5점 척도:

```
CS_dimensions = {
  "질문_부합성":  "내 질문에 직접적으로 답했나?",
  "근거_충실성":  "데이터/법률 근거를 제시했나?",
  "실행_계획성":  "구체적인 행동 계획이 있나?",
  "이해_용이성":  "일반인도 이해할 수 있게 썼나?",
  "후속_가능성":  "이 답변으로 진행 상황을 추적할 수 있나?"
}

CS_score = Σ_d (평균_평점_d) / 5  ×  20  → [0, 100]
```

TSR 가중 평균 적용:
```
CS_weighted = Σ_u (TSR_grade_weight(u) · rating(u)) / Σ_u (TSR_grade_weight(u))
```

**최종 AQS:**

```
AQS(answer) = 0.4 · AS(answer) · 100  +  0.6 · CS_weighted(answer)
```

AQS 등급:
- S (90-100): '데이터 성실 답변' 배지 수여
- A (75-89): '성실 답변'
- B (60-74): '기본 답변'
- C (40-59): '형식적 답변' — 평판 회복 효과 없음
- F (<40): '불성실 답변' — 추가 감점 -3점

---

<a name="section-4"></a>
## Section 4. 데이터 아키텍처 및 무결성 (Data Integrity)

### 4.1 Source-to-Context Mapping Pipeline

#### 4.1.1 데이터 소스 및 수집 계획

```
┌──────────────────────┬────────────────────────┬──────────────────┐
│ 데이터 소스          │ 수집 방법              │ 갱신 주기        │
├──────────────────────┼────────────────────────┼──────────────────┤
│ 열린국회 API         │ REST API (공식)        │ 실시간 ~ 일 1회  │
│ 국회 회의록          │ Open API + 웹 파싱     │ 회의 종료 후 6h  │
│ 법제처 국가법령정보  │ REST API (공식)        │ 월 2회           │
│ 빅카인즈 뉴스 DB     │ 제휴 API               │ 일 1회           │
│ 정부24 공공데이터    │ REST API               │ 주 1회           │
│ 선거관리위 선거 DB   │ 공공데이터포털 API     │ 분기 1회         │
└──────────────────────┴────────────────────────┴──────────────────┘
```

#### 4.1.2 맥락 왜곡 방지 파이프라인

핵심 문제: 발언/표결 데이터를 **맥락에서 분리**하면 의미가 왜곡됨.

```
[원시 데이터 수집]
        │
        ▼
[Context Anchoring Layer]
  ─ 모든 데이터 레코드에 필수 Context 메타필드 첨부:
    ├── context_type: FLOOR_SPEECH | COMMITTEE | PRESS | SNS
    ├── bill_id: 연관 법안 FK
    ├── agenda_item: 당시 심의 안건
    ├── speaker_intent_tag: PROPOSAL | OPPOSITION | QUESTION | DECLARATION
    ├── temporal_context: 발언 전후 5분 회의록 슬라이딩 윈도우
    └── source_chain: [원본URL, 수집시각, 수집방법, 해시값]
        │
        ▼
[Decontextualization Risk Scorer]
  ─ 발언이 맥락 없이 읽힐 때 의미 변질 가능성 점수 산출
  ─ 고위험(score > 0.7): 반드시 context_summary 함께 표시
        │
        ▼
[Quality Gate]
  ─ source_chain 무결성 검증 (SHA-256 해시 일치)
  ─ Context 필드 완결성 검사 (null 허용 불가)
  ─ 통과 실패 시 격리 큐(quarantine_queue) 이동 + 운영팀 알림
        │
        ▼
[적재: Primary DB + Immutable Audit Log]
```

#### 4.1.3 Context-Anchored 데이터 스키마

```sql
CREATE TABLE speech_records (
    id                  UUID PRIMARY KEY,
    member_id           VARCHAR(10) NOT NULL,
    raw_text            TEXT NOT NULL,
    masked_text         TEXT,                    -- 마스킹 처리본
    context_type        VARCHAR(20) NOT NULL,
    bill_id             VARCHAR(20),
    agenda_item         TEXT,
    speaker_intent_tag  VARCHAR(20),
    temporal_window     JSONB,                   -- 전후 5분 발언 배열
    decontext_risk_score NUMERIC(4,3),           -- [0,1]
    source_url          TEXT NOT NULL,
    source_collected_at TIMESTAMPTZ NOT NULL,
    source_hash         CHAR(64) NOT NULL,       -- SHA-256
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_intent CHECK (
        speaker_intent_tag IN ('PROPOSAL','OPPOSITION','QUESTION','DECLARATION','OTHER')
    )
);
```

---

### 4.2 Immutable Audit Log (불변 감사 로그)

#### 4.2.1 아키텍처 선택: 프라이빗 블록체인 vs 공개 원장

```
┌─────────────────────┬────────────────────────┬─────────────────────┐
│ 기준                │ 프라이빗 블록체인      │ 공개 원장 (앵커링)  │
├─────────────────────┼────────────────────────┼─────────────────────┤
│ 투명성              │ 참여자 제한 (낮음)     │ 완전 공개 (높음)    │
│ 성능                │ 높음 (초당 1000+ TPS)  │ 낮음 (가스비/지연)  │
│ 비용                │ 운영비 직접 부담       │ 온체인 비용 변동    │
│ 규제 리스크         │ 낮음                   │ 중간 (암호화폐 연관)│
│ 신뢰도              │ 운영사 의존            │ 수학적 보장         │
└─────────────────────┴────────────────────────┴─────────────────────┘
```

**권장 방안: Hybrid Approach**

- **일상 감사 로그**: 프라이빗 블록체인 (Hyperledger Fabric 기반) — 고성능, 저비용
- **중요 이벤트 앵커링**: Ethereum Mainnet에 주기적(일 1회) Merkle Root 등록 — 외부 검증 가능

#### 4.2.2 로그 체인 구조

```
Block N
┌─────────────────────────────────────────────────┐
│ block_hash:     SHA-256(prev_hash + payload)    │
│ prev_hash:      [Block N-1의 hash]              │
│ timestamp:      Unix epoch (ms)                 │
│ event_type:     DATA_UPDATE | SCORE_CHANGE |    │
│                 MASKING_APPLIED | ADMIN_ACTION  │
│ entity_id:      변경 대상 (member_id, bill_id)  │
│ field_changed:  변경된 필드명                   │
│ value_before:   이전 값 (암호화)                │
│ value_after:    이후 값 (암호화)                │
│ operator_id:    시스템 또는 관리자 ID           │
│ justification:  변경 사유 (자동/수동)           │
└─────────────────────────────────────────────────┘
```

#### 4.2.3 공개 감사 인터페이스

모든 시민이 의원별 점수 변동 이력을 조회할 수 있는 공개 API:

```
GET /api/v1/audit/member/{member_id}/score-history
→ 응답: 타임라인별 점수 변동 사유, 관련 블록 해시, Ethereum 앵커 Tx ID
```

#### 4.2.4 Risk & Mitigation

| 리스크 | 설명 | 대응책 |
|--------|------|--------|
| 관리자 데이터 조작 | 내부 관리자가 점수를 임의 수정할 가능성 | 모든 수동 수정은 2인 승인 (4-eyes principle) + 감사 로그 즉시 기록 |
| 블록체인 네트워크 공격 | 51% 공격 (프라이빗 체인) | Fabric의 PBFT 합의 알고리즘 + 검증 노드 최소 7개, 다중 기관 운영 |
| 개인정보 On-chain 기록 | GDPR/개인정보보호법과 충돌 | 체인에는 해시값과 익명 ID만 기록, 원본 데이터는 오프체인 암호화 저장 |

---

<a name="section-5"></a>
## Section 5. 서비스 확장 및 공공 인프라 전략

### 5.1 오픈 API 전략 — 국가 표준 정치 데이터 터미널

#### 5.1.1 API 계층 구조

```
┌───────────────────────────────────────────────────┐
│                  API Gateway                      │
│         (Kong Gateway + OAuth 2.0)                │
├────────────────┬──────────────────────────────────┤
│  Public Tier   │  Authenticated Tier  │ Gov Tier  │
│  (무인증)      │  (API Key)           │ (기관인증) │
├────────────────┼──────────────────────────────────┤
│ 의원 기본정보  │ WDI/TSR 조회         │ 원시 DB   │
│ 법안 목록      │ L-Impact 분석 요청   │ 실시간    │
│ 집계 통계      │ AQS 데이터           │ 스트리밍  │
│ Rate: 100/day  │ Rate: 10,000/day     │ 무제한    │
└────────────────┴──────────────────────────────────┘
```

#### 5.1.2 핵심 API 엔드포인트 명세

```yaml
openapi: 3.1.0
info:
  title: 국민소환제 Public API
  version: v1.0

paths:
  /v1/members/{id}/wdi:
    get:
      summary: 의원 WDI 조회
      parameters:
        - name: session
          in: query
          schema: { type: string, example: "22-1" }
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WDIResponse'

  /v1/bills/{id}/simulate:
    post:
      summary: L-Impact 시뮬레이션 요청
      requestBody:
        content:
          application/json:
            schema:
              properties:
                bill_text: { type: string, maxLength: 50000 }
      responses:
        202:
          description: 비동기 분석 접수
          content:
            application/json:
              schema:
                properties:
                  job_id: { type: string, format: uuid }
                  estimated_seconds: { type: integer }

  /v1/members/{id}/recall:
    post:
      summary: 공개 소환 제출
      security: [{ BearerAuth: [] }]
      requestBody:
        content:
          application/json:
            schema:
              required: [recall_type, question_text]
              properties:
                recall_type:
                  enum: [urgent, vote_reason, legislation, general]
                question_text: { type: string, maxLength: 2000 }
```

#### 5.1.3 데이터 거버넌스 모델

```
                    ┌─────────────────────┐
                    │  플랫폼 운영 법인   │
                    │  (비영리 재단 형태) │
                    └──────────┬──────────┘
                               │ 거버넌스
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │ 시민 자문단  │  │ 학술 검증단  │  │ 정부 협력단  │
   │ (유권자 대표 │  │ (정치학/법학 │  │ (행안부, 국회│
   │  100인 무작  │  │  교수 15인)  │  │  사무처 MOU) │
   │  위 선정)    │  │              │  │              │
   └──────────────┘  └──────────────┘  └──────────────┘
   
알고리즘 가중치 변경 시: 학술 검증단 승인 필수
운영 정책 변경 시: 시민 자문단 의견 수렴 (14일 공개 논의)
정부 데이터 연동 시: 정부 협력단 MOU 기반 처리
```

#### 5.1.4 국가 표준 인정 로드맵

```
Phase 1 (0~12개월): 기반 구축
  ├── 플랫폼 MVP 출시 (핵심 알고리즘 3종)
  ├── 열린국회 API 정식 파트너 등록
  └── 비영리 재단 법인 설립

Phase 2 (12~24개월): 신뢰 확보
  ├── 학술 논문 발표 (알고리즘 검증)
  ├── 언론사 제휴 데이터 피드 제공 (3사 이상)
  └── 지방의회 확장 (광역시·도 의회 데이터 연동)

Phase 3 (24~36개월): 제도화 추진
  ├── 행안부·국회사무처 공식 MOU
  ├── 공공데이터포털 "추천 데이터셋" 등재
  └── 입법 조사처 공식 분석 도구 채택 협의

Phase 4 (36개월~): 표준화
  ├── KS 표준 "정치 행동 데이터 명세" 제안
  └── 아시아 Civic-Tech 네트워크 공유 (대만 vTaiwan, 핀란드 Decidim 등)
```

#### 5.1.5 수익 모델 (비영리 지속가능성)

```
수익원                    비율    설명
─────────────────────────────────────────────────────
정부 보조금/공모사업       35%    행안부 디지털민주주의 공모
언론사 데이터 라이선스     25%    제휴 언론사 API 구독료
기업 CSR 후원             20%    ESG 공시 목적 기업 후원
시민 자발적 후원           15%    크라우드펀딩 모델
해외 라이선스 수출          5%    민주주의 국가 플랫폼 수출
```

#### 5.1.6 Risk & Mitigation

| 리스크 | 설명 | 대응책 |
|--------|------|--------|
| 정치적 압력 | 여야 의원들이 플랫폼 규제 입법 시도 | 비영리 재단 구조 + 해외 서버 미러링 + 오픈소스 공개로 규제 차단 어렵게 설계 |
| 정부 데이터 거부 | 열린국회 API 접근 차단 | 스크래핑 + 시민 크라우드소싱 데이터로 대체, 국제 민주주의 기구 압박 활용 |
| 사용자 이탈 | 복잡한 알고리즘으로 일반 시민 이탈 | 알고리즘 결과의 '쉬운 모드' UI 별도 제공 (점수만 표시), 전문가 모드 선택형 |
| 알고리즘 게이밍 | 의원실이 알고리즘을 파악하여 점수 조작 | 핵심 가중치 파라미터 비공개 + 분기별 가중치 재보정 + 역공학 탐지 모듈 |

---

<a name="section-6"></a>
## Section 6. Google Cloud 기반 기술 스택 설계 (GCP Architecture)

### 6.0 아키텍처 전환 근거

기존 AWS 중심 스택에서 GCP Ecosystem으로 전환하는 핵심 이유는 다음과 같다.

| 결정 요인 | AWS 대비 GCP 우위 |
|-----------|-------------------|
| **ML/NLP 통합** | Vertex AI가 KoELECTRA, Gemini 등 한국어 모델과 직접 통합 |
| **대규모 분석** | BigQuery의 서버리스 SQL이 의정 데이터 배치 분석에 최적 |
| **비용 모델** | BigQuery 온디맨드 쿼리 과금으로 초기 인프라 비용 최소화 |
| **데이터 파이프라인** | Dataflow (Apache Beam) + Pub/Sub 조합이 실시간 국회 데이터 수집에 적합 |
| **공공 데이터셋** | Google Cloud Public Datasets와 연계 용이 |
| **규정 준수** | Cloud KMS + VPC Service Controls로 개인정보보호법 대응 |

---

### 6.1 전체 아키텍처 다이어그램

```
╔══════════════════════════════════════════════════════════════════════════╗
║                     국민소환제 GCP Architecture                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  ┌─────────────────────────────────────────────────────────────────┐    ║
║  │                      DATA INGESTION LAYER                       │    ║
║  │                                                                 │    ║
║  │  열린국회 API ──┐                                               │    ║
║  │  법제처 API ────┼──► Cloud Pub/Sub ──► Dataflow (Beam) ──►     │    ║
║  │  뉴스 RSS ──────┘    (이벤트 스트림)    (변환/정제)             │    ║
║  │  회의록 크롤러 ──────────────────────────────────────────────►  │    ║
║  └───────────────────────────────┬─────────────────────────────────┘    ║
║                                  │                                       ║
║  ┌───────────────────────────────▼─────────────────────────────────┐    ║
║  │                      DATA STORAGE LAYER                         │    ║
║  │                                                                 │    ║
║  │  Cloud Storage (GCS)          BigQuery                          │    ║
║  │  ├─ raw/                      ├─ dataset: assembly              │    ║
║  │  ├─ processed/                │   ├─ bill_votes                 │    ║
║  │  └─ audit-logs/               │   ├─ speech_records             │    ║
║  │                               │   ├─ wdi_snapshots              │    ║
║  │  Firestore                    │   └─ tsr_scores                 │    ║
║  │  ├─ user_sessions             ├─ dataset: nlp_features          │    ║
║  │  ├─ recall_queue              └─ dataset: audit_immutable       │    ║
║  │  └─ masking_registry                                            │    ║
║  │                               AlloyDB (PostgreSQL-호환)         │    ║
║  │                               └─ 트랜잭션성 운영 DB             │    ║
║  └───────────────────────────────┬─────────────────────────────────┘    ║
║                                  │                                       ║
║  ┌───────────────────────────────▼─────────────────────────────────┐    ║
║  │                   AI / ML PROCESSING LAYER                      │    ║
║  │                                                                 │    ║
║  │  Vertex AI                                                      │    ║
║  │  ├─ Model Garden: Gemini 1.5 Pro (맥락 분석, AQS 자동 평가)    │    ║
║  │  ├─ Custom Training: KoELECTRA Fine-tune (NER, 충돌 탐지)      │    ║
║  │  ├─ Vector Search: L-Impact 법령 유사도 검색 (FAISS 대체)      │    ║
║  │  ├─ Pipelines: WDI/TSR 배치 계산 파이프라인                    │    ║
║  │  └─ Feature Store: 실시간 피처 서빙                             │    ║
║  │                                                                 │    ║
║  │  BigQuery ML                                                    │    ║
║  │  └─ 통과율 예측 모델 (BQML LogReg + XGBoost)                   │    ║
║  └───────────────────────────────┬─────────────────────────────────┘    ║
║                                  │                                       ║
║  ┌───────────────────────────────▼─────────────────────────────────┐    ║
║  │                   APPLICATION LAYER                             │    ║
║  │                                                                 │    ║
║  │  Cloud Run (컨테이너)          API Gateway                      │    ║
║  │  ├─ api-service (FastAPI)  ◄──┤ + Cloud Endpoints              │    ║
║  │  ├─ nlp-worker             │  └─ (OAuth 2.0 + API Key)         │    ║
║  │  ├─ sla-scheduler          │                                    │    ║
║  │  └─ masking-engine         │  Cloud Tasks                      │    ║
║  │                            │  └─ 비동기 작업 큐                │    ║
║  │  Firebase Hosting          │  Cloud Scheduler                  │    ║
║  │  └─ Next.js SSR (SSG)  ◄───┘  └─ 배치 WDI 재계산              │    ║
║  └───────────────────────────────┬─────────────────────────────────┘    ║
║                                  │                                       ║
║  ┌───────────────────────────────▼─────────────────────────────────┐    ║
║  │              SECURITY / GOVERNANCE LAYER                        │    ║
║  │                                                                 │    ║
║  │  Cloud KMS          Cloud Armor         VPC Service Controls    │    ║
║  │  Cloud IAM          Secret Manager      Cloud Audit Logs        │    ║
║  └─────────────────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

### 6.2 Data Ingestion Layer — Cloud Pub/Sub + Dataflow

#### 6.2.1 실시간 데이터 수집 파이프라인

열린국회 API, 법제처, 뉴스 RSS 등의 이종 데이터를 **Cloud Pub/Sub**으로 통합 수집하고, **Cloud Dataflow (Apache Beam)**으로 정제한다.

```python
# Dataflow 파이프라인 정의 (Apache Beam)
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.io.gcp.pubsub import ReadFromPubSub
from apache_beam.io.gcp.bigquery import WriteToBigQuery

class ParseAssemblyVote(beam.DoFn):
    """열린국회 API 표결 데이터 파싱 및 Context Anchoring"""
    def process(self, element):
        import json, hashlib
        from datetime import datetime, timezone

        raw = json.loads(element.decode('utf-8'))
        source_hash = hashlib.sha256(element).hexdigest()

        yield {
            'bill_id':          raw.get('BILL_ID'),
            'member_id':        raw.get('MONA_CD'),
            'vote_result':      self._normalize_vote(raw.get('RESULT_VOTE_MON')),
            'party_line':       None,           # 별도 NLP 추론
            'context_type':     'FLOOR_SPEECH',
            'source_url':       raw.get('_source_url'),
            'source_hash':      source_hash,
            'source_collected_at': datetime.now(timezone.utc).isoformat(),
            'voted_at':         raw.get('PROC_DT'),
            'decontext_risk_score': 0.0,        # Vertex AI 후처리
        }

    def _normalize_vote(self, raw_value: str) -> str:
        mapping = {'찬성': 'yes', '반대': 'no', '기권': 'abstain', '불참': 'absent'}
        return mapping.get(raw_value, 'absent')


def run_ingestion_pipeline(project_id: str, region: str):
    options = PipelineOptions(
        project=project_id,
        region=region,
        runner='DataflowRunner',
        streaming=True,                         # 스트리밍 모드
        enable_streaming_engine=True,
        max_num_workers=10,
    )

    with beam.Pipeline(options=options) as p:
        votes = (
            p
            | 'ReadFromPubSub' >> ReadFromPubSub(
                topic=f'projects/{project_id}/topics/assembly-votes-raw'
            )
            | 'ParseVotes' >> beam.ParDo(ParseAssemblyVote())
            | 'FilterInvalid' >> beam.Filter(
                lambda r: r['bill_id'] is not None and r['member_id'] is not None
            )
            | 'WriteToBigQuery' >> WriteToBigQuery(
                table=f'{project_id}:assembly.bill_votes',
                schema='SCHEMA_AUTODETECT',
                write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND,
                create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED,
            )
        )
```

#### 6.2.2 Pub/Sub 토픽 설계

```yaml
# Pub/Sub 토픽 구조
topics:
  assembly-votes-raw:
    description: "열린국회 API 표결 원시 데이터"
    retention: "7d"
    subscriptions:
      - dataflow-votes-sub (pull, ack_deadline: 60s)

  assembly-speeches-raw:
    description: "국회 회의록 발언 데이터"
    retention: "7d"
    subscriptions:
      - dataflow-speeches-sub
      - nlp-masking-sub          # 마스킹 엔진 별도 구독

  sla-events:
    description: "소환 생성/응답 이벤트"
    retention: "3d"
    subscriptions:
      - sla-scheduler-sub        # SLA 타이머 트리거
      - seo-feed-sub             # SEO 피드 생성기

  audit-log-events:
    description: "모든 데이터 변경 이벤트 (감사용)"
    retention: "30d"
    message_ordering: true       # 순서 보장 필수
    subscriptions:
      - blockchain-anchor-sub    # Hyperledger / Ethereum 앵커링
```

---

### 6.3 Data Storage Layer — BigQuery + Firestore + AlloyDB

#### 6.3.1 BigQuery 데이터셋 설계

BigQuery는 의정 분석의 **분석용 데이터 웨어하우스**로 사용한다. 트랜잭션이 필요한 운영 데이터는 AlloyDB에 보관한다.

```sql
-- BigQuery 데이터셋: assembly (의정 활동 데이터)
-- 파티션: voted_at (일별), 클러스터링: member_id, bill_id

CREATE TABLE `project.assembly.bill_votes`
PARTITION BY DATE(voted_at)
CLUSTER BY member_id, bill_id
OPTIONS (require_partition_filter = false)
AS SELECT
  GENERATE_UUID()                       AS id,
  CAST(NULL AS STRING)                  AS bill_id,
  CAST(NULL AS STRING)                  AS member_id,
  CAST(NULL AS STRING)                  AS vote_result,
  CAST(NULL AS STRING)                  AS party_line,
  CAST(NULL AS NUMERIC)                 AS pai_norm,
  CAST(NULL AS NUMERIC)                 AS cci,
  CAST(NULL AS STRING)                  AS session_code,
  CAST(NULL AS TIMESTAMP)               AS voted_at,
  CAST(NULL AS STRING)                  AS source_url,
  CAST(NULL AS STRING)                  AS source_hash,
  CURRENT_TIMESTAMP()                   AS created_at
WHERE FALSE;  -- 스키마 정의용

-- BigQuery ML: 표결 통과율 예측 모델 학습
CREATE OR REPLACE MODEL `project.nlp_features.pass_rate_model`
OPTIONS (
  model_type = 'LOGISTIC_REG',
  input_label_cols = ['passed'],
  data_split_method = 'RANDOM',
  data_split_eval_fraction = 0.2,
  l2_reg = 0.1
) AS
SELECT
  b.sim_score,
  b.sponsor_count,
  b.committee_opinion_score,
  b.ruling_party_ratio,
  b.media_support_score,
  b.passed
FROM `project.assembly.historical_bills` b
WHERE b.session_code NOT LIKE '22%';  -- 현 회기 제외 (리키지 방지)

-- WDI 배치 계산 쿼리 (Cloud Scheduler → BigQuery Jobs API)
CREATE OR REPLACE TABLE `project.assembly.wdi_snapshots`
PARTITION BY DATE(computed_at)
AS
WITH deviation AS (
  SELECT
    v.member_id,
    v.session_code,
    v.bill_id,
    CASE WHEN v.vote_result != v.party_line AND v.party_line != 'free'
         THEN 1 ELSE 0 END                                  AS delta,
    COALESCE(b.pai_norm, 0)                                 AS pai_norm,
    COALESCE(b.cci, 0.0)                                    AS cci
  FROM `project.assembly.bill_votes` v
  LEFT JOIN `project.assembly.bills` b USING (bill_id)
  WHERE DATE(v.voted_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
)
SELECT
  member_id,
  session_code,
  AVG(delta * (1 + 0.6 * pai_norm) * (1 + 0.4 * cci))     AS raw_wdi,
  AVG(delta * (1 + 0.6 * pai_norm) * (1 + 0.4 * cci))
    / MAX(AVG(delta * (1 + 0.6 * pai_norm) * (1 + 0.4 * cci)))
      OVER ()                                              * 100 AS wdi_score,
  CURRENT_TIMESTAMP()                                      AS computed_at
FROM deviation
GROUP BY member_id, session_code;
```

#### 6.3.2 Firestore 컬렉션 설계 (운영 실시간 데이터)

```javascript
// Firestore 문서 구조 (NoSQL)
// 컬렉션: users/{user_id}
{
  "tsr_grade": "A",              // S|A|B|C
  "tsr_raw": 0.76,
  "constituency_verified": true,
  "constituency_code": "1101",   // 암호화 저장
  "idi_score": 0.64,
  "last_activity": Timestamp,
  "sockpuppet_flag": false,
  "created_at": Timestamp
}

// 컬렉션: recalls/{recall_id}
{
  "member_id": "M-2025-0042",
  "recall_type": "vote_reason",
  "question_text_masked": "...",  // 마스킹 처리본
  "question_text_encrypted": "...", // Cloud KMS 암호화 원문
  "status": "AWAITING",           // AWAITING|RESPONDED|OVERDUE
  "sla_deadline": Timestamp,
  "submitted_by": "user_id",
  "submitter_tsr": "A",
  "overdue_days": 0,
  "penalty_applied": 0.0,
  "created_at": Timestamp
}

// 컬렉션: masking_sessions/{session_id}
{
  "entity_registry": {
    "강남구": "L01",
    "국민의힘": "P01"
  },
  "expires_at": Timestamp
}
```

#### 6.3.3 AlloyDB (PostgreSQL 호환) — 트랜잭션 운영 DB

트랜잭션 보장이 필요한 사용자 인증, TSR 점수 업데이트, SLA 상태 변경에 사용.

```sql
-- AlloyDB: 사용자 TSR 원자적 업데이트
CREATE OR REPLACE PROCEDURE update_tsr_atomic(
  p_user_id UUID,
  p_delta    NUMERIC,
  p_reason   TEXT
)
LANGUAGE plpgsql AS $$
DECLARE
  v_old_score NUMERIC;
  v_new_score NUMERIC;
BEGIN
  SELECT tsr_raw INTO v_old_score
  FROM users WHERE id = p_user_id FOR UPDATE;  -- 행 잠금

  v_new_score := LEAST(GREATEST(v_old_score + p_delta, 0.0), 1.0);

  UPDATE users SET tsr_raw = v_new_score WHERE id = p_user_id;

  -- 감사 로그 동시 기록
  INSERT INTO audit_events (entity_id, event_type, field_changed,
                             value_before, value_after, justification)
  VALUES (p_user_id, 'SCORE_CHANGE', 'tsr_raw',
          v_old_score::TEXT, v_new_score::TEXT, p_reason);

  -- Pub/Sub 알림 (Cloud Functions 트리거)
  PERFORM pg_notify('tsr_updated', json_build_object(
    'user_id', p_user_id,
    'old', v_old_score,
    'new', v_new_score
  )::text);
END;
$$;
```

---

### 6.4 AI / ML Processing Layer — Vertex AI

#### 6.4.1 Vertex AI 서비스 매핑

| 기존 스택 | GCP 대체 서비스 | 역할 |
|-----------|-----------------|------|
| FAISS (로컬 벡터 검색) | Vertex AI Vector Search | L-Impact 법령 유사도 검색 |
| Hugging Face Hub 모델 서빙 | Vertex AI Model Garden + Custom Training | KoELECTRA NER, 충돌 탐지 |
| 자체 Feature Engineering | Vertex AI Feature Store | WDI/TSR 피처 실시간 서빙 |
| MLflow 실험 관리 | Vertex AI Experiments + Metadata | 모델 버전 관리 |
| 수동 재학습 스크립트 | Vertex AI Pipelines | 주기적 모델 재학습 자동화 |
| GPT-4 API (AQS 자동 평가) | Gemini 1.5 Pro (Vertex AI) | 답변 품질 자동 분석 |

#### 6.4.2 Vertex AI Vector Search — L-Impact 법령 검색

```python
from google.cloud import aiplatform
from google.cloud.aiplatform.matching_engine import MatchingEngineIndex
from vertexai.language_models import TextEmbeddingModel

# 법령 임베딩 생성 및 인덱스 구축
def build_legal_corpus_index(project_id: str, region: str):
    aiplatform.init(project=project_id, location=region)

    # Vertex AI Text Embedding (한국어 지원 gecko 모델)
    embedding_model = TextEmbeddingModel.from_pretrained(
        "textembedding-gecko-multilingual@001"
    )

    # 법제처 전체 법령 조문 임베딩 (약 500만 조항 예상)
    # 배치 처리: Dataflow 파이프라인에서 호출
    def embed_clause(clause_text: str) -> list[float]:
        embeddings = embedding_model.get_embeddings([clause_text])
        return embeddings[0].values  # 768차원

    # Matching Engine 인덱스 생성
    index = aiplatform.MatchingEngineIndex.create_tree_ah_index(
        display_name="legal-corpus-index",
        contents_delta_uri="gs://project-legal-embeddings/initial/",
        dimensions=768,
        approximate_neighbors_count=10,
        distance_measure_type="COSINE_DISTANCE",
        leaf_node_embedding_count=500,
        leaf_nodes_to_search_percent=7,
    )

    # 엔드포인트 배포
    endpoint = aiplatform.MatchingEngineIndexEndpoint.create(
        display_name="legal-search-endpoint",
        public_endpoint_enabled=True,
    )
    endpoint.deploy_index(index=index, deployed_index_id="legal_v1")
    return endpoint


# 충돌 탐지 실행 (서비스 내 호출)
def detect_conflicts_vertex(bill_clauses: list[str],
                             endpoint_name: str,
                             threshold: float = 0.82) -> list[dict]:
    embedding_model = TextEmbeddingModel.from_pretrained(
        "textembedding-gecko-multilingual@001"
    )
    endpoint = aiplatform.MatchingEngineIndexEndpoint(endpoint_name)

    embeddings = embedding_model.get_embeddings(bill_clauses)
    query_vectors = [e.values for e in embeddings]

    # 배치 유사도 검색
    results = endpoint.find_neighbors(
        deployed_index_id="legal_v1",
        queries=query_vectors,
        num_neighbors=10,
    )

    conflicts = []
    for clause_idx, neighbors in enumerate(results):
        for neighbor in neighbors:
            similarity = 1 - neighbor.distance  # cosine
            if similarity >= threshold:
                conflicts.append({
                    'clause_idx': clause_idx,
                    'matched_id': neighbor.id,
                    'similarity': round(similarity, 4),
                })
    return conflicts
```

#### 6.4.3 Vertex AI Pipelines — WDI/TSR 자동 재계산

```python
from kfp import dsl
from kfp.v2 import compiler
from google.cloud import aiplatform

@dsl.component(
    base_image="python:3.11",
    packages_to_install=["google-cloud-bigquery", "pandas", "numpy"]
)
def compute_wdi_component(
    project_id: str,
    session_code: str,
    lambda_: float = 0.6,
    mu: float = 0.4,
) -> str:
    """BigQuery에서 표결 데이터 읽어 WDI 배치 계산"""
    from google.cloud import bigquery
    import json

    client = bigquery.Client(project=project_id)
    query = f"""
        SELECT member_id, session_code,
               AVG(delta * (1 + {lambda_} * pai_norm) * (1 + {mu} * cci)) AS raw_wdi
        FROM (
          SELECT v.member_id, v.session_code,
                 CASE WHEN v.vote_result != v.party_line
                      AND v.party_line != 'free' THEN 1 ELSE 0 END AS delta,
                 COALESCE(b.pai_norm, 0) AS pai_norm,
                 COALESCE(b.cci, 0.0) AS cci
          FROM `{project_id}.assembly.bill_votes` v
          LEFT JOIN `{project_id}.assembly.bills` b USING (bill_id)
          WHERE v.session_code = '{session_code}'
        )
        GROUP BY member_id, session_code
    """
    results = client.query(query).to_dataframe()
    return results.to_json(orient='records')


@dsl.component(
    base_image="python:3.11",
    packages_to_install=["google-cloud-bigquery", "pandas"]
)
def write_wdi_snapshot_component(wdi_json: str, project_id: str):
    """계산된 WDI를 BigQuery wdi_snapshots 테이블에 저장"""
    import pandas as pd
    from google.cloud import bigquery
    import json

    df = pd.read_json(wdi_json)
    max_wdi = df['raw_wdi'].max()
    df['wdi_score'] = df['raw_wdi'] / max_wdi * 100 if max_wdi > 0 else 0
    df['computed_at'] = pd.Timestamp.now(tz='UTC')

    client = bigquery.Client(project=project_id)
    client.load_table_from_dataframe(
        df, f"{project_id}.assembly.wdi_snapshots"
    ).result()


@dsl.pipeline(name="wdi-weekly-recompute", pipeline_root="gs://project-pipelines/")
def wdi_pipeline(project_id: str, session_code: str):
    compute_task = compute_wdi_component(
        project_id=project_id,
        session_code=session_code
    )
    write_wdi_snapshot_component(
        wdi_json=compute_task.output,
        project_id=project_id
    )

# 파이프라인 컴파일 및 Cloud Scheduler 등록
compiler.Compiler().compile(wdi_pipeline, "wdi_pipeline.json")
```

#### 6.4.4 Gemini 1.5 Pro — AQS 자동 평가 및 Delayed Attribution

```python
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig

vertexai.init(project="project-id", location="asia-northeast3")  # 서울 리전

# AQS 자동 평가 (Answer Quality Scoring)
def evaluate_answer_quality(question: str, answer: str) -> dict:
    model = GenerativeModel("gemini-1.5-pro")

    prompt = f"""
당신은 대한민국 국회의원 답변의 품질을 평가하는 시스템입니다.
아래 질문과 답변을 분석하고, 반드시 JSON 형식으로만 응답하세요.

[질문]
{question}

[답변]
{answer}

평가 기준:
- specificity_score (0-100): 구체적인 사실, 수치, 법령 근거 포함 여부
- data_score (0-100): 데이터/통계/예산 수치 인용 여부  
- actionability_score (0-100): 후속 조치 계획의 구체성
- generic_penalty (0-50): "검토하겠습니다" 등 형식적 표현 감점

JSON 응답 형식:
{{"specificity_score": 0, "data_score": 0, "actionability_score": 0,
  "generic_penalty": 0, "rationale": "한 문장 근거"}}
"""

    response = model.generate_content(
        prompt,
        generation_config=GenerationConfig(
            temperature=0.1,       # 낮은 온도로 일관성 확보
            max_output_tokens=512,
            response_mime_type="application/json",
        )
    )

    import json
    scores = json.loads(response.text)
    auto_score = (
        scores['specificity_score'] * 0.35
        + scores['data_score'] * 0.35
        + scores['actionability_score'] * 0.30
        - scores['generic_penalty']
    )
    scores['auto_score'] = round(max(0, min(100, auto_score)), 2)
    return scores


# Delayed Attribution: 발언 맥락 위험도 평가
def score_decontext_risk(clause_text: str, context_window: list[str]) -> float:
    model = GenerativeModel("gemini-1.5-flash")  # 비용 최적화
    context = "\n".join(context_window[:5])

    prompt = f"""
다음 발언이 주변 맥락(context) 없이 단독으로 읽혔을 때
의미가 왜곡될 가능성을 0.0~1.0 사이 숫자로만 답하세요.

[주변 맥락]
{context}

[평가 대상 발언]
{clause_text}

응답 (숫자만):"""

    response = model.generate_content(prompt)
    try:
        return float(response.text.strip())
    except ValueError:
        return 0.5  # 파싱 실패 시 중간값
```

#### 6.4.5 Vertex AI Feature Store — 실시간 피처 서빙

```python
from google.cloud.aiplatform import featurestore

# Feature Store 구조
# Entity Type: member (의원)
# Features: wdi_score, rep_score, sla_overdue_count, answer_rate
# Entity Type: user (시민)  
# Features: tsr_raw, idi_score, ahs_norm, cvb

def setup_feature_store(project_id: str, region: str):
    fs = featurestore.Featurestore.create(
        featurestore_id="political_os_features",
        online_store_fixed_node_count=1,
        project=project_id,
        location=region,
    )

    # 의원 피처 엔티티
    member_entity = fs.create_entity_type(
        entity_type_id="member",
        description="국회의원 의정 활동 피처",
    )
    member_entity.batch_create_features(feature_configs={
        "wdi_score":          {"value_type": "DOUBLE"},
        "rep_score":          {"value_type": "DOUBLE"},
        "sla_overdue_days":   {"value_type": "INT64"},
        "answer_rate_30d":    {"value_type": "DOUBLE"},
        "aqr_avg":            {"value_type": "DOUBLE"},
    })

    return fs
```

---

### 6.5 Application Layer — Cloud Run + API Gateway

#### 6.5.1 Cloud Run 서비스 구성

```yaml
# cloud-run-services.yaml
services:
  api-service:
    image: asia-northeast3-docker.pkg.dev/project/recall/api:latest
    framework: FastAPI
    min_instances: 2              # Cold Start 방지
    max_instances: 100
    cpu: 2
    memory: 2Gi
    concurrency: 80
    env:
      - ALLOYDB_DSN: ${SECRET_MANAGER:alloydb-dsn}
      - BIGQUERY_DATASET: assembly
      - VERTEX_ENDPOINT: ${VERTEX_SEARCH_ENDPOINT}
    annotations:
      run.googleapis.com/vpc-access-connector: projects/project/vpc-conn
      run.googleapis.com/vpc-access-egress: private-ranges-only

  nlp-masking-worker:
    image: asia-northeast3-docker.pkg.dev/project/recall/nlp-masking:latest
    min_instances: 1
    max_instances: 50
    cpu: 4
    memory: 8Gi                   # NLP 모델 로딩을 위한 메모리
    trigger: pubsub               # Pub/Sub Push 트리거

  sla-scheduler:
    image: asia-northeast3-docker.pkg.dev/project/recall/sla:latest
    min_instances: 1
    max_instances: 10
    trigger: cloud-scheduler      # Cron: "*/15 * * * *" (15분마다 SLA 점검)
```

#### 6.5.2 Cloud Armor — DDoS 및 악성 트래픽 차단

```yaml
# Cloud Armor 보안 정책
security_policy:
  name: "recall-waf-policy"
  rules:
    - priority: 1000
      action: "deny(403)"
      match:
        expr: "evaluatePreconfiguredExpr('sqli-stable')"  # SQL Injection

    - priority: 1100
      action: "deny(403)"
      match:
        expr: "evaluatePreconfiguredExpr('xss-stable')"   # XSS

    - priority: 2000
      action: "throttle"
      match:
        versioned_expr: "SRC_IPS_V1"
        config:
          src_ip_ranges: ["*"]
      rate_limit_options:
        rate_limit_threshold:
          count: 100
          interval_sec: 60         # IP당 분당 100 요청
        conform_action: "allow"
        exceed_action: "deny(429)"

    - priority: 3000               # 의원실 IP 범위 소환 제한
      action: "throttle"
      match:
        expr: "request.path.matches('/v1/members/.*/recall')"
      rate_limit_options:
        rate_limit_threshold:
          count: 50
          interval_sec: 86400      # 의원 1인당 일 50건 소환 제한
```

---

### 6.6 Security & Governance Layer

#### 6.6.1 Cloud KMS — 데이터 암호화 키 관리

```python
from google.cloud import kms_v1

class RecallCryptoService:
    """Delayed Attribution 및 개인정보 암호화/복호화"""

    def __init__(self, project_id: str, location: str, key_ring: str):
        self.client = kms_v1.KeyManagementServiceClient()
        self.key_name_attribution = (
            f"projects/{project_id}/locations/{location}"
            f"/keyRings/{key_ring}/cryptoKeys/attribution-key"
        )
        self.key_name_pii = (
            f"projects/{project_id}/locations/{location}"
            f"/keyRings/{key_ring}/cryptoKeys/pii-key"
        )

    def encrypt_attribution(self, plaintext: str) -> bytes:
        """의원명/출처 암호화 — Delayed Attribution Phase 1"""
        response = self.client.encrypt(
            request={
                "name": self.key_name_attribution,
                "plaintext": plaintext.encode("utf-8"),
            }
        )
        return response.ciphertext

    def decrypt_attribution(self, ciphertext: bytes) -> str:
        """reveal_key 발급 후 복호화 — Delayed Attribution Phase 2"""
        response = self.client.decrypt(
            request={
                "name": self.key_name_attribution,
                "ciphertext": ciphertext,
            }
        )
        return response.plaintext.decode("utf-8")

    def encrypt_pii(self, plaintext: str) -> bytes:
        """지역구 인증 개인정보 암호화 (CMEK)"""
        response = self.client.encrypt(
            request={"name": self.key_name_pii,
                     "plaintext": plaintext.encode("utf-8")}
        )
        return response.ciphertext
```

#### 6.6.2 BigQuery — Immutable Audit Log (감사 원장)

기존 Hyperledger Fabric 감사 로그를 BigQuery의 **Table Snapshot + WORM 정책**으로 대체하여, 별도 블록체인 인프라 없이 불변성을 구현한다. Ethereum 앵커링은 유지한다.

```sql
-- BigQuery 감사 로그 테이블 (삭제/수정 불가 정책 적용)
CREATE TABLE `project.audit_immutable.platform_audit_log`
PARTITION BY DATE(event_timestamp)
OPTIONS (
  require_partition_filter = false,
  -- WORM: 데이터 보존 정책 (Cloud Console에서 설정)
  -- default_table_expiration_days = NULL (영구 보존)
  description = "플랫폼 불변 감사 원장 — 수정/삭제 금지"
)
AS SELECT
  GENERATE_UUID()         AS log_id,
  CAST(NULL AS STRING)    AS event_type,       -- DATA_UPDATE|SCORE_CHANGE|ADMIN_ACTION
  CAST(NULL AS STRING)    AS entity_type,      -- MEMBER|USER|BILL|RECALL
  CAST(NULL AS STRING)    AS entity_id,
  CAST(NULL AS STRING)    AS field_changed,
  CAST(NULL AS STRING)    AS value_before_hash, -- SHA-256 해시
  CAST(NULL AS STRING)    AS value_after_hash,
  CAST(NULL AS STRING)    AS operator_id,
  CAST(NULL AS STRING)    AS justification,
  CAST(NULL AS STRING)    AS prev_log_hash,    -- 체인 연결
  CAST(NULL AS STRING)    AS log_hash,         -- SHA-256(prev_hash + payload)
  CAST(NULL AS TIMESTAMP) AS event_timestamp,
  CAST(NULL AS STRING)    AS ethereum_tx_id    -- 앵커링 Tx (일 1회 배치)
WHERE FALSE;

-- 감사 로그 체인 무결성 검증 쿼리
SELECT
  log_id,
  event_timestamp,
  CASE
    WHEN TO_HEX(SHA256(CONCAT(
      COALESCE(prev_log_hash, ''),
      entity_id, field_changed,
      value_before_hash, value_after_hash,
      operator_id, FORMAT_TIMESTAMP('%FT%TZ', event_timestamp)
    ))) = log_hash
    THEN 'VALID'
    ELSE 'TAMPERED ⚠️'
  END AS integrity_status
FROM `project.audit_immutable.platform_audit_log`
WHERE DATE(event_timestamp) = CURRENT_DATE()
ORDER BY event_timestamp;
```

#### 6.6.3 VPC Service Controls — 데이터 유출 방지

```yaml
# VPC Service Control 경계 설정
service_perimeter:
  name: "recall-data-perimeter"
  restricted_services:
    - bigquery.googleapis.com
    - storage.googleapis.com
    - aiplatform.googleapis.com
    - alloydb.googleapis.com
  
  ingress_policies:
    - from:
        identities:
          - serviceAccount:dataflow-sa@project.iam.gserviceaccount.com
          - serviceAccount:api-service-sa@project.iam.gserviceaccount.com
      to:
        operations:
          - service_name: bigquery.googleapis.com
            method_selectors:
              - method: google.cloud.bigquery.v2.JobService.InsertJob
              - method: google.cloud.bigquery.v2.TableService.GetTable

  access_levels:
    - "accessPolicies/policy_id/accessLevels/internal_network_only"
```

---

### 6.7 GCP 서비스 전체 매핑 요약

```
┌─────────────────────────┬───────────────────────────────────┬───────────────────────┐
│ 도메인                  │ GCP 서비스                        │ 대체 이전 스택        │
├─────────────────────────┼───────────────────────────────────┼───────────────────────┤
│ 데이터 수집/스트리밍    │ Cloud Pub/Sub                     │ Kafka                 │
│ 배치/스트리밍 처리      │ Cloud Dataflow (Apache Beam)      │ Apache Spark          │
│ 분석 DW                 │ BigQuery                          │ Redshift              │
│ 트랜잭션 DB             │ AlloyDB (PostgreSQL 호환)         │ RDS PostgreSQL        │
│ NoSQL / 실시간 DB       │ Firestore                         │ MongoDB               │
│ 캐싱                    │ Memorystore (Redis)               │ ElastiCache           │
│ 벡터 검색               │ Vertex AI Vector Search           │ FAISS (로컬)          │
│ NLP 모델 학습           │ Vertex AI Custom Training         │ SageMaker             │
│ NLP 모델 서빙           │ Vertex AI Model Endpoints         │ TorchServe            │
│ LLM (AQS, 위험도)       │ Gemini 1.5 Pro/Flash              │ OpenAI GPT-4 API      │
│ ML 파이프라인           │ Vertex AI Pipelines (KFP)        │ Airflow               │
│ 피처 스토어             │ Vertex AI Feature Store           │ Feast                 │
│ ML 예측 (SQL)           │ BigQuery ML                       │ 별도 추론 서버        │
│ ML 실험 관리            │ Vertex AI Experiments             │ MLflow                │
│ 컨테이너 서비스         │ Cloud Run                         │ ECS Fargate           │
│ API 관리                │ API Gateway + Cloud Endpoints     │ API Gateway (AWS)     │
│ 프론트엔드 호스팅       │ Firebase Hosting                  │ S3 + CloudFront       │
│ 비동기 작업 큐          │ Cloud Tasks                       │ SQS                   │
│ 스케줄러                │ Cloud Scheduler                   │ EventBridge           │
│ 암호화 키 관리          │ Cloud KMS (CMEK)                  │ AWS KMS               │
│ 시크릿 관리             │ Secret Manager                    │ Secrets Manager       │
│ WAF / DDoS              │ Cloud Armor                       │ WAF + Shield          │
│ CDN                     │ Cloud CDN + Cloud Load Balancing  │ CloudFront            │
│ 컨테이너 레지스트리     │ Artifact Registry                 │ ECR                   │
│ 감사 로그               │ BigQuery (WORM) + Cloud Audit Log │ CloudTrail            │
│ 모니터링                │ Cloud Monitoring + Cloud Logging  │ CloudWatch            │
│ CI/CD                   │ Cloud Build + Cloud Deploy        │ CodePipeline          │
│ IaC                     │ Terraform (GCP Provider)          │ Terraform (AWS)       │
└─────────────────────────┴───────────────────────────────────┴───────────────────────┘
```

---

### 6.8 GCP 비용 추정 (월간, 초기 운영 기준)

```
┌──────────────────────────┬──────────────────┬──────────────────────────────┐
│ 서비스                   │ 예상 월 비용     │ 비고                         │
├──────────────────────────┼──────────────────┼──────────────────────────────┤
│ BigQuery (쿼리 + 저장)   │ ₩150,000~300,000 │ 온디맨드, 월 10TB 쿼리 기준  │
│ Vertex AI Vector Search  │ ₩200,000~400,000 │ 법령 500만 조항, 1노드       │
│ Vertex AI Training       │ ₩300,000~600,000 │ KoELECTRA 월 1회 재학습      │
│ Gemini API (AQS)         │ ₩100,000~250,000 │ 월 50,000 답변 평가 기준     │
│ Cloud Run                │ ₩80,000~200,000  │ 2~10 인스턴스 기준           │
│ AlloyDB                  │ ₩400,000~600,000 │ 2vCPU / 16GB, 단일 리전      │
│ Cloud Pub/Sub + Dataflow │ ₩100,000~200,000 │ 스트리밍 처리량 기준         │
│ Firestore                │ ₩50,000~100,000  │ 읽기/쓰기 ops 기준           │
│ 기타 (KMS, Armor 등)     │ ₩100,000~150,000 │                              │
├──────────────────────────┼──────────────────┼──────────────────────────────┤
│ 합계                     │ ₩1.5M~2.8M/월    │ 사용량 기반 스케일 업 구조   │
└──────────────────────────┴──────────────────┴──────────────────────────────┘

비용 최적화 전략:
1. BigQuery Reservations (약정 슬롯): 쿼리 비용 최대 40% 절감
2. Vertex AI Committed Use Discounts: 1년 약정 시 최대 57% 할인
3. Cloud Run 최소 인스턴스 0 설정 (개발/스테이징 환경)
4. Gemini Flash 모델 우선 활용 (Pro 대비 10분의 1 비용)
5. BigQuery BI Engine: 대시보드 쿼리 캐싱으로 반복 쿼리 비용 제거
```

---

### 6.9 GCP 리전 전략

```
Primary Region:    asia-northeast3 (서울)   ← 개인정보보호법 데이터 국내 보관
DR Region:         asia-northeast1 (도쿄)   ← RTO 4h, RPO 1h
BigQuery:          asia-northeast3 (멀티리전 대신 단일 리전 — 비용 최적화)
Firebase Hosting:  Global CDN (자동)
Vertex AI:         asia-northeast1 (일부 서비스 서울 미지원 시)
```

#### 6.9.1 Risk & Mitigation

| 리스크 | 설명 | 대응책 |
|--------|------|--------|
| Vendor Lock-in | GCP 전체 의존 시 이탈 비용 증가 | Apache Beam 추상화 계층 유지, AlloyDB = PostgreSQL 호환으로 마이그레이션 용이 |
| 서울 리전 서비스 가용성 | Vertex AI 일부 기능 asia-northeast3 미지원 | 도쿄 리전 폴백 + VPC 피어링, 개인정보보호법 예외 조항 사전 검토 |
| Gemini 모델 변경 | Google의 모델 deprecation으로 AQS 로직 영향 | 추상화 인터페이스 구현 (LLM Provider 교체 가능 설계) |
| BigQuery 쿼리 폭증 비용 | 특정 이슈 급증 시 쿼리 비용 예측 불가 | BigQuery Custom Quotas 설정 + 예산 알림 (월 예산 120% 도달 시 자동 알림) |
| 감사 로그 WORM 우회 | BigQuery 테이블 삭제 권한을 가진 관리자 | IAM 최소 권한 원칙 + 조직 정책 `constraints/bigquery.disableTableDeletion` 적용 |

---

## Appendix A. 기술 스택 최종 요약 (GCP 기반 v1.1)

```
# ── INGESTION ──────────────────────────────────────────────
Streaming:       Cloud Pub/Sub (열린국회 API, 뉴스 RSS, 회의록)
ETL/ELT:         Cloud Dataflow (Apache Beam, 스트리밍 + 배치)

# ── STORAGE ────────────────────────────────────────────────
Data Warehouse:  BigQuery (의정 분석 DW, BQML 모델)
Operational DB:  AlloyDB for PostgreSQL (트랜잭션, TSR/SLA)
NoSQL:           Firestore (세션, 소환 큐, 마스킹 레지스트리)
Cache:           Memorystore for Redis
Object Storage:  Cloud Storage (원시 데이터, 모델 아티팩트)

# ── AI / ML ────────────────────────────────────────────────
LLM:             Gemini 1.5 Pro / Flash (AQS 평가, 위험도)
NLP Training:    Vertex AI Custom Training (KoELECTRA Fine-tune)
NLP Serving:     Vertex AI Model Endpoints
Vector Search:   Vertex AI Vector Search (법령 유사도)
Feature Store:   Vertex AI Feature Store (실시간 피처 서빙)
ML Pipeline:     Vertex AI Pipelines (Kubeflow 기반)
SQL ML:          BigQuery ML (통과율 예측 LogReg + XGBoost)
Experiments:     Vertex AI Experiments + Model Registry

# ── APPLICATION ────────────────────────────────────────────
API:             Cloud Run + FastAPI (Python 3.11)
API Management:  API Gateway + Cloud Endpoints (OAuth 2.0)
Frontend:        Firebase Hosting + Next.js 14 (App Router)
Mobile:          React Native (iOS/Android)
Async Tasks:     Cloud Tasks
Scheduler:       Cloud Scheduler (WDI 배치, SLA 점검)

# ── SECURITY ───────────────────────────────────────────────
Encryption:      Cloud KMS (CMEK, Delayed Attribution)
Secrets:         Secret Manager
WAF/DDoS:        Cloud Armor
Network:         VPC + VPC Service Controls
IAM:             Workload Identity Federation

# ── OBSERVABILITY ──────────────────────────────────────────
Monitoring:      Cloud Monitoring + Cloud Logging
Tracing:         Cloud Trace + OpenTelemetry
Alerting:        Cloud Alerting → Slack/PagerDuty

# ── GOVERNANCE ─────────────────────────────────────────────
Audit Log:       BigQuery (WORM Policy) + Cloud Audit Logs
Blockchain Anchor: Ethereum Mainnet (일 1회 Merkle Root)
IaC:             Terraform (google provider)
CI/CD:           Cloud Build + Cloud Deploy + Artifact Registry

# ── REGION ─────────────────────────────────────────────────
Primary:         asia-northeast3 (서울)
DR:              asia-northeast1 (도쿄)
```

## Appendix B. 개인정보 처리 방침 핵심 원칙

1. **최소 수집 원칙**: TSR 인증에 필요한 최소한의 정보만 수집
2. **영지식 증명(ZKP)**: 지역구 인증 시 주민등록번호 비수집, ZKP 기반 선거구 증명
3. **데이터 삭제권**: 회원 탈퇴 시 개인 연결 데이터 즉시 삭제 (집계 통계는 익명화 보존)
4. **아동 이용 차단**: 만 18세 이상 선거권자만 이용 가능 (생년월일 인증)
5. **데이터 국내 보관**: 개인정보 및 의정 데이터 전량 asia-northeast3 (서울) 리전 보관
6. **CMEK**: 모든 저장 데이터에 Cloud KMS 고객 관리 암호화 키 적용

---

*본 PRD는 살아있는 문서(Living Document)로서, 플랫폼 운영 데이터 및 외부 검증을 바탕으로 분기별 업데이트됩니다.*

**문서 버전 이력:**
| 버전 | 일자 | 변경 내용 |
|------|------|-----------|
| 1.0.0 | 2025 Q3 | 최초 작성 |
| 1.1.0 | 2025 Q3 | Section 6 추가: GCP 기반 전체 기술 스택 설계 (Vertex AI, BigQuery, Dataflow 등) |
