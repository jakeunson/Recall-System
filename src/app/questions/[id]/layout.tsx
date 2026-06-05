import { Metadata } from 'next';
import { MOCK_QUESTIONS } from '@/lib/mock-data';
import React from 'react';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const question = MOCK_QUESTIONS.find((q) => q.id === resolvedParams.id);

  if (!question) return { title: 'Not Found' };

  const isAnswered = question.status === 'answered';

  return {
    title: `${question.title} - 국민소환제 공개 질의`,
    description: question.content.substring(0, 160),
    robots: {
      index: !isAnswered, // 미응답 질문만 검색 엔진 허용
      follow: true,
    },
  };
}

export default async function Layout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const question = MOCK_QUESTIONS.find((q) => q.id === resolvedParams.id);
  
  let jsonLd = null;
  if (question && question.status !== 'answered') {
    const isExpired = question.deadline ? new Date(question.deadline).getTime() < new Date().getTime() : false;
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "GovernmentService",
      "name": `미응답 공개 질의: ${question.title}`,
      "description": question.content,
      "provider": {
        "@type": "GovernmentOrganization",
        "name": question.targetMember
      },
      "url": `https://political-os.org/questions/${question.id}`,
      "additionalType": isExpired ? "OverdueSLA" : "PendingSLA"
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
