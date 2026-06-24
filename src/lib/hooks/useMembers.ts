import { useState, useEffect } from 'react';
import { Member, MemberEvaluation } from '../types';

import { useLocalStorageState } from './useLocalStorage';
import { useSession } from './useSession';
import { useToast } from './useToast';
import { delay } from '../utils/delay';

import { memberService, recallService, billService } from '../services';

export const useMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const data = await memberService.getMembers();
      setMembers(data);
      setLoading(false);
    };
    fetch();
  }, []);

  return { members, loading };
};

export const useMemberDetail = (memberId: string) => {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMember = async () => {
      setLoading(true);
      const found = await memberService.getMember(memberId);
      
      if (found) {
        const hydrated: Member = {
          ...found,
          electedHistory: found.electedHistory || ['제22대 국회의원'],
          sponsoredBills: found.sponsoredBills || [
            { billId: 'BT001', title: '대표 발의 법안 예시', role: 'representative' },
            { billId: 'BT002', title: '공동 발의 법안 예시', role: 'cosponsor' }
          ]
        };
        setMember(hydrated);
      } else {
        setMember(null);
      }
      setLoading(false);
    };

    loadMember();
  }, [memberId]);

  return { member, loading };
};

export const useMemberActivities = (memberId: string) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      
      const [foundMember, quizzes, bills, questions] = await Promise.all([
        memberService.getMember(memberId),
        recallService.getQuizzes(),
        billService.getBills(),
        recallService.getQuestions()
      ]);
      
      if (!foundMember) {
        setActivities([]);
        setLoading(false);
        return;
      }

      const memberName = foundMember.name;
      const combined: any[] = [];

      quizzes.forEach(q => {
        if (q.memberName === memberName) {
          combined.push({
            id: `ACT_Q_${q.id}`,
            type: 'quiz',
            title: `블라인드 평가 참여`,
            description: q.maskedStatement,
            date: q.createdAt,
            details: q,
            link: `/blind#${q.id}`
          });
        }
      });

      bills.forEach(b => {
        let isRelated = false;
        if (memberId === 'M01' && b.id === 'BT001') isRelated = true;
        if (memberId === 'M02' && b.id === 'BT002') isRelated = true;

        if (isRelated) {
          combined.push({
            id: `ACT_B_${b.id}`,
            type: 'bill',
            title: `법안 발의 참여`,
            description: b.billSummary,
            date: b.createdAt,
            details: b,
            link: `/bills`
          });
        }
      });

      questions.forEach(q => {
        if (q.targetMemberId === memberId) {
          combined.push({
            id: `ACT_QU_${q.id}`,
            type: 'question',
            title: `시민 질의 응답`,
            description: q.title,
            date: q.createdAt,
            details: q,
            link: `/questions`
          });
        }
      });

      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivities(combined);
      setLoading(false);
    };

    loadActivities();
  }, [memberId]);

  return { activities, loading };
};

export const useMemberEvaluations = (memberId: string) => {
  const [evaluations, setEvaluations, evalLoading] = useLocalStorageState<MemberEvaluation[]>(
    'political_os_evaluations',
    []
  );
  const [filteredEvaluations, setFilteredEvaluations] = useState<MemberEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useSession();
  const { showToast } = useToast();

  useEffect(() => {
    if (!evalLoading) {
      const filtered = evaluations.filter((e) => e.memberId === memberId);
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setFilteredEvaluations(filtered);
      setLoading(false);
    }
  }, [evaluations, memberId, evalLoading]);

  const submitMemberEvaluation = async (score: number, comment: string) => {
    if (!session) {
      showToast('로그인이 필요합니다.', 'error');
      return false;
    }
    await delay(500);
    const existingIndex = evaluations.findIndex(
      (e) => e.memberId === memberId && e.userId === session.id
    );
    let updated: MemberEvaluation[];
    if (existingIndex > -1) {
      const updatedList = [...evaluations];
      updatedList[existingIndex] = {
        ...updatedList[existingIndex],
        score,
        comment,
        createdAt: new Date().toISOString(),
      };
      updated = updatedList;
      showToast('평가가 업데이트되었습니다.', 'success');
    } else {
      const newEval: MemberEvaluation = {
        id: `E_${Date.now()}`,
        memberId,
        userId: session.id,
        userDisplayName: session.displayName,
        score,
        comment,
        createdAt: new Date().toISOString(),
      };
      updated = [newEval, ...evaluations];
      showToast('평가가 성공적으로 등록되었습니다.', 'success');
    }
    setEvaluations(updated);
    return true;
  };

  const getAverageScore = () => {
    if (filteredEvaluations.length === 0) return 0;
    const sum = filteredEvaluations.reduce((acc, curr) => acc + curr.score, 0);
    return Math.round(sum / filteredEvaluations.length);
  };

  const getUserEvaluation = () => {
    if (!session) return null;
    return filteredEvaluations.find((e) => e.userId === session.id) || null;
  };

  return {
    evaluations: filteredEvaluations,
    loading,
    submitMemberEvaluation,
    averageScore: getAverageScore(),
    userEvaluation: getUserEvaluation()
  };
};