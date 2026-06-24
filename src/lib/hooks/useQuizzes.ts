import { useState, useEffect } from 'react';

import { createClient } from '@/utils/supabase/client';
import { BlindQuiz, BlindVoteType } from '../types';
import { useToast } from './useToast';
import { useSession } from './useSession';
import { getLocalStorageItem, setLocalStorageItem } from './useLocalStorage';
import { recallService } from '../services';

export const useQuizzes = () => {
  const [quizzes, setQuizzes] = useState<BlindQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { session } = useSession();

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      const data = await recallService.getQuizzes();
      setQuizzes(data);
      setLoading(false);
    };
    fetchQuizzes();
  }, []);

  const submitBlindVote = async (quizId: string, voteType: BlindVoteType) => {
    if (!session) {
      showToast('로그인이 필요합니다.', 'error');
      return false;
    }

    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return false;

    const updated = quizzes.map((q) => {
      if (q.id === quizId) {
        return {
          ...q,
          agreeCount: voteType === 'agree' ? q.agreeCount + 1 : q.agreeCount,
          disagreeCount: voteType === 'disagree' ? q.disagreeCount + 1 : q.disagreeCount,
          holdCount: voteType === 'hold' ? q.holdCount + 1 : q.holdCount,
        };
      }
      return q;
    });
    setQuizzes(updated);

    const success = await recallService.updateQuizVote(quizId, voteType, quiz[`${voteType}Count`] as number);
    if (!success) {
      showToast('블라인드 투표 처리 중 오류가 발생했습니다.', 'error');
      return false;
    }

    const userVotes = getLocalStorageItem<Record<string, BlindVoteType>>('user_blind_votes', {});
    userVotes[quizId] = voteType;
    setLocalStorageItem('user_blind_votes', userVotes);

    showToast('블라인드 투표가 완료되었습니다.', 'success');
    return true;
  };

  const getUserVote = (quizId: string): BlindVoteType | null => {
    const userVotes = getLocalStorageItem<Record<string, BlindVoteType>>('user_blind_votes', {});
    return userVotes[quizId] || null;
  };

  return { quizzes, loading, submitBlindVote, getUserVote };
};