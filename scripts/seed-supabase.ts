import { createClient } from '@supabase/supabase-js';
import path from 'path';


// mock-data 가져오기 (절대 경로 주의: 프로젝트 구조에 따라 수정될 수 있음)
import { 
  MOCK_MEMBERS, 
  MOCK_QUIZZES, 
  MOCK_QUESTIONS, 
  MOCK_FACTCHECKS, 
  MOCK_BILL_THREADS, 
  MOCK_PROPOSALS 
} from '../src/lib/mock-data';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// 데이터 강제 삽입(RLS 무시)을 위해 service_role 키를 사용해야 합니다.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ 에러: NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 .env.local에 설정되지 않았습니다.");
  process.exit(1);
}

// service_role 키로 클라이언트 생성 (모든 권한 통과)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedData() {
  console.log("🌱 Supabase 초기 데이터 마이그레이션을 시작합니다...");

  try {
    // 1. Members
    console.log(`- members 테이블 데이터 삽입 중 (${MOCK_MEMBERS.length}건)...`);
    const { error: memberErr } = await supabase.from('members').upsert(MOCK_MEMBERS);
    if (memberErr) throw memberErr;

    // 2. Quizzes
    console.log(`- quizzes 테이블 데이터 삽입 중 (${MOCK_QUIZZES.length}건)...`);
    const { error: quizErr } = await supabase.from('quizzes').upsert(MOCK_QUIZZES);
    if (quizErr) throw quizErr;

    // 3. FactChecks
    console.log(`- fact_checks 테이블 데이터 삽입 중 (${MOCK_FACTCHECKS.length}건)...`);
    const { error: factErr } = await supabase.from('fact_checks').upsert(MOCK_FACTCHECKS);
    if (factErr) throw factErr;

    // 4. BillThreads
    console.log(`- bill_threads 테이블 데이터 삽입 중 (${MOCK_BILL_THREADS.length}건)...`);
    const { error: billErr } = await supabase.from('bill_threads').upsert(MOCK_BILL_THREADS);
    if (billErr) throw billErr;

    // 5. Questions
    console.log(`- questions 테이블 데이터 삽입 중 (${MOCK_QUESTIONS.length}건)...`);
    const { error: qErr } = await supabase.from('questions').upsert(MOCK_QUESTIONS);
    if (qErr) throw qErr;

    // 6. Proposals
    console.log(`- proposals 테이블 데이터 삽입 중 (${MOCK_PROPOSALS.length}건)...`);
    const { error: propErr } = await supabase.from('proposals').upsert(MOCK_PROPOSALS);
    if (propErr) throw propErr;

    console.log("✅ 모든 데이터 마이그레이션이 성공적으로 완료되었습니다!");

  } catch (error) {
    console.error("❌ 데이터 마이그레이션 중 에러 발생:", error);
  }
}

seedData();
