import { MetadataRoute } from 'next';
import { MOCK_QUESTIONS } from '@/lib/mock-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://political-os.org';
  
  // 기본 정적 페이지
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/questions`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blind`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/bills`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // 질문 동적 페이지
  const questionRoutes: MetadataRoute.Sitemap = MOCK_QUESTIONS.map((q) => {
    const isAnswered = q.status === 'answered';
    return {
      url: `${baseUrl}/questions/${q.id}`,
      lastModified: new Date(q.createdAt),
      changeFrequency: isAnswered ? 'never' : 'daily',
      // 미응답(SLA 대기/초과) 질문은 SEO 노출 우선순위 높임 (0.9), 응답 완료는 낮춤 (0.5)
      priority: isAnswered ? 0.5 : 0.9,
    };
  });

  return [...routes, ...questionRoutes];
}
