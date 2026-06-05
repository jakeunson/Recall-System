import fs from 'fs';
import path from 'path';
import { MOCK_QUESTIONS } from '../src/lib/mock-data';

function generateSLAFeed() {
  const now = new Date();
  
  const overdueQuestions = MOCK_QUESTIONS.filter(q => {
    if (q.status !== 'open' || !q.deadline) return false;
    const deadline = new Date(q.deadline);
    return deadline.getTime() < now.getTime();
  });

  const feedData = overdueQuestions.map(q => {
    const deadline = new Date(q.deadline!);
    const diffMs = now.getTime() - deadline.getTime();
    const overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
      "@context": "https://schema.org",
      "@type": "GovernmentService",
      "name": `미응답 공개 질의: ${q.title}`,
      "description": q.content,
      "provider": {
        "@type": "GovernmentOrganization",
        "name": q.targetMember
      },
      "url": `https://political-os.org/questions/${q.id}`,
      "additionalType": "OverdueSLA",
      "overdueDays": overdueDays
    };
  });

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outPath = path.join(publicDir, 'questions_overdue.json');
  fs.writeFileSync(outPath, JSON.stringify(feedData, null, 2), 'utf-8');
  console.log(`✅ SLA Feed generated at ${outPath} with ${feedData.length} items.`);
}

generateSLAFeed();
