-- =========================================================================
-- Supabase Schema for Political OS (국민소환제)
-- =========================================================================

-- 기존 테이블이 있다면 삭제 (초기화 목적 - 주의해서 사용)
DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS bill_threads CASCADE;
DROP TABLE IF EXISTS fact_checks CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- 1. members (국회의원 정보)
CREATE TABLE members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  party TEXT NOT NULL,
  region TEXT NOT NULL,
  "trustScore" INTEGER NOT NULL DEFAULT 0,
  indicators JSONB NOT NULL DEFAULT '[]',
  statements JSONB NOT NULL DEFAULT '[]',
  "electedHistory" JSONB DEFAULT '[]',
  "sponsoredBills" JSONB DEFAULT '[]',
  "photoUrl" TEXT,
  "hanjaName" TEXT,
  "englishName" TEXT,
  committee TEXT
);

-- 2. quizzes (블라인드 퀴즈)
CREATE TABLE quizzes (
  id TEXT PRIMARY KEY,
  "maskedStatement" TEXT NOT NULL,
  "originalStatement" TEXT NOT NULL,
  "memberName" TEXT NOT NULL,
  "memberParty" TEXT NOT NULL,
  "memberRegion" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "agreeCount" INTEGER DEFAULT 0,
  "disagreeCount" INTEGER DEFAULT 0,
  "holdCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "sourceType" TEXT,
  "originalMediaName" TEXT,
  "maskedMediaName" TEXT
);

-- 3. fact_checks (팩트체크)
CREATE TABLE fact_checks (
  id TEXT PRIMARY KEY,
  claim TEXT NOT NULL,
  evidence TEXT NOT NULL,
  verdict TEXT NOT NULL,
  "sourceUrls" JSONB DEFAULT '[]',
  "verifiedCount" INTEGER DEFAULT 0,
  "needsReviewCount" INTEGER DEFAULT 0,
  "authorName" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "aiToxicityScore" NUMERIC
);

-- 4. bill_threads (법안 토론)
CREATE TABLE bill_threads (
  id TEXT PRIMARY KEY,
  "billTitle" TEXT NOT NULL,
  "billCode" TEXT NOT NULL,
  "billSummary" TEXT NOT NULL,
  "diffData" JSONB DEFAULT '[]',
  "consensusScore" INTEGER DEFAULT 0,
  "replyCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL
);

-- 5. questions (공개 소환 질의)
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  "questionCode" TEXT NOT NULL,
  "targetMember" TEXT NOT NULL,
  "targetMemberId" TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  "sourceUrl" TEXT,
  status TEXT NOT NULL,
  "voteCount" INTEGER DEFAULT 0,
  "authorName" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL,
  deadline TIMESTAMPTZ,
  "disputeRequested" BOOLEAN DEFAULT FALSE,
  "disputeResolved" BOOLEAN DEFAULT FALSE,
  "aiToxicityScore" NUMERIC
);

-- 6. proposals (시민 입법 제안)
CREATE TABLE proposals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  purpose TEXT NOT NULL,
  background TEXT NOT NULL,
  "diffData" JSONB DEFAULT '[]',
  status TEXT NOT NULL,
  "authorName" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "upvoteCount" INTEGER DEFAULT 0,
  versions JSONB DEFAULT '[]',
  "legalOpinions" JSONB DEFAULT '[]',
  "aiToxicityScore" NUMERIC,
  "amendmentFeedback" TEXT
);

-- =========================================================================
-- Row Level Security (RLS) 설정
-- =========================================================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- 퍼블릭 읽기 권한(SELECT) 허용 정책 (누구나 화면에서 데이터를 볼 수 있도록)
CREATE POLICY "Public read access for members" ON members FOR SELECT USING (true);
CREATE POLICY "Public read access for quizzes" ON quizzes FOR SELECT USING (true);
CREATE POLICY "Public read access for fact_checks" ON fact_checks FOR SELECT USING (true);
CREATE POLICY "Public read access for bill_threads" ON bill_threads FOR SELECT USING (true);
CREATE POLICY "Public read access for questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Public read access for proposals" ON proposals FOR SELECT USING (true);

-- (참고) INSERT/UPDATE/DELETE 권한은 추후 백오피스 관리자 권한 정책으로 제어해야 합니다.
-- 현재 데이터 이관 스크립트는 Service Role Key(관리자 권한)를 사용하므로 RLS의 영향을 받지 않습니다.
