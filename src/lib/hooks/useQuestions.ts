import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PublicQuestion } from '../types';
import { useSupabaseCollection } from './useSupabase';
import { useSession } from './useSession';
import { useToast } from './useToast';
import { getLocalStorageItem, setLocalStorageItem } from './useLocalStorage';
import { recallService, memberService } from '../services';

export const useQuestions = () => {
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useSession();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const data = await recallService.getQuestions();
      setQuestions(data);
      setLoading(false);
    };
    fetchQuestions();
  }, []);

  const submitQuestion = async (targetMemberId: string, title: string, content: string, sourceUrl?: string) => {
    if (!session) {
      showToast('로그인이 필요한 기능입니다.', 'error');
      return false;
    }

    const member = await memberService.getMember(targetMemberId);
    const targetMemberName = member ? member.name : '알 수 없음';

    const newQuestion: PublicQuestion = {
      id: `Q_${Date.now()}`,
      questionCode: `Q2026-${Math.floor(Math.random() * 10000)}`,
      targetMember: targetMemberName,
      targetMemberId,
      title,
      content,
      sourceUrl: sourceUrl || undefined,
      status: 'open',
      voteCount: 1,
      authorName: session.displayName,
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      disputeRequested: false,
      disputeResolved: false,
      aiToxicityScore: 1
    };

    const created = await recallService.createQuestion(newQuestion);
    if (!created) {
      showToast('질의 등록 중 오류가 발생했습니다.', 'error');
      return false;
    }

    setQuestions([created, ...questions]);
    showToast('소명 질의서가 성공적으로 발송되었습니다.', 'success');
    return true;
  };

  const upvoteQuestion = async (questionId: string) => {
    if (!session) {
      showToast('로그인이 필요한 기능입니다.', 'error');
      return false;
    }

    const target = questions.find(q => q.id === questionId);
    if (!target) return false;

    const updated = questions.map((q) => {
      if (q.id === questionId) {
        return { ...q, voteCount: q.voteCount + 1 };
      }
      return q;
    });
    setQuestions(updated);

    const supabase = createClient();
    await supabase.from('questions').update({ voteCount: target.voteCount + 1 }).eq('id', questionId);

    const userVotes = getLocalStorageItem<Record<string, boolean>>('user_question_votes', {});
    userVotes[questionId] = true;
    setLocalStorageItem('user_question_votes', userVotes);

    showToast('질의에 공감하였습니다.', 'success');
    return true;
  };

  const hasUpvoted = (questionId: string) => {
    const userVotes = getLocalStorageItem<Record<string, boolean>>('user_question_votes', {});
    return !!userVotes[questionId];
  };

  return { questions, loading, submitQuestion, upvoteQuestion, hasUpvoted };
};
