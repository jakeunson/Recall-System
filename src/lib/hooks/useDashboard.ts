import { useState, useEffect } from 'react';

import { createClient } from '@/utils/supabase/client';
import { BlindQuiz, BillThread, PublicQuestion, BillProposal, PostSummary } from '../types';
import { delay } from '../utils/delay';

import { memberService, billService, recallService } from '../services';

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  
  interface PlatformStats {
    memberCount: number;
    verifiedBillCount: number;
    activeQuestionCount: number;
    factcheckCount: number;
  }

  const [stats, setStats] = useState<PlatformStats>({
    memberCount: 300,
    verifiedBillCount: 12482,
    activeQuestionCount: 158,
    factcheckCount: 847
  });

  const [recentPosts, setRecentPosts] = useState<PostSummary[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      const [members, bills, proposals, questions, quizzes] = await Promise.all([
        memberService.getMembers(),
        billService.getBills(),
        billService.getProposals(),
        recallService.getQuestions(),
        recallService.getQuizzes()
      ]);

      setStats({
        memberCount: members.length || 300,
        verifiedBillCount: 12400 + bills.length + proposals.length,
        activeQuestionCount: questions.filter(q => q.status === 'open').length,
        factcheckCount: 847, // Factcheck is deprecated
      });

      const posts: PostSummary[] = [];

      quizzes.slice(0, 2).forEach(q => {
        posts.push({
          id: q.id,
          boardType: 'blind',
          title: `블라인드 평가: "${q.maskedStatement.substring(0, 32)}..."`,
          meta: `${new Date(q.createdAt).toLocaleDateString()} · 참여 ${q.agreeCount + q.disagreeCount + q.holdCount}명`,
          badge: '진행중',
          badgeColor: 'var(--accent)',
          href: `/blind#${q.id}`,
        });
      });

      proposals.slice(0, 2).forEach(p => {
        posts.push({
          id: p.id,
          boardType: 'propose',
          title: p.title,
          meta: `${new Date(p.createdAt).toLocaleDateString()} · 지지 ${p.upvoteCount} · 전문가검토 ${p.legalOpinions && p.legalOpinions.length > 0 ? '완료' : '대기'}`,
          badge: p.status === 'community_review' ? '시민 검토중' : '수정 제안됨',
          badgeColor: 'var(--accent)',
          href: `/bills/propose`,
        });
      });

      questions.slice(0, 2).forEach(q => {
        posts.push({
          id: q.id,
          boardType: 'question',
          title: q.title,
          meta: `${new Date(q.createdAt).toLocaleDateString()} · ${q.voteCount}명 동의 · 대상: ${q.targetMember}`,
          badge: q.status === 'answered' ? '답변 완료' : '서명 진행중',
          badgeColor: q.status === 'answered' ? 'var(--success)' : 'var(--warning)',
          href: `/questions`,
        });
      });

      setRecentPosts(posts.slice(0, 5));
      setLoading(false);
    };

    loadData();
  }, []);

  return { stats, recentPosts, loading };
};