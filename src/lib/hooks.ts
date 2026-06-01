'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type {
  Member,
  BlindQuiz,
  FactCheck,
  BillThread,
  BillReply,
  PublicQuestion,
  PostSummary,
  BillProposal,
  MemberEvaluation,
  BlindVoteType,
  ReplyType,
  FactCheckVerdict,
  ReactionType
} from './types';
import {
  MOCK_MEMBERS,
  MOCK_QUIZZES,
  MOCK_FACTCHECKS,
  MOCK_BILL_THREADS,
  MOCK_BILL_REPLIES,
  MOCK_QUESTIONS,
  MOCK_RECENT_POSTS,
  MOCK_PLATFORM_STATS,
  MOCK_PROPOSALS
} from './mock-data';

// ─── DELAY UTILITY ───────────────────────────────────
export const delay = (ms?: number) => {
  const targetMs = ms !== undefined ? ms : Math.random() * 400 + 400; // 400ms~800ms
  return new Promise((resolve) => setTimeout(resolve, targetMs));
};

// ─── TOAST SYSTEM ────────────────────────────────────
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// ─── INITIALIZE LOCALSTORAGE STATE ───────────────────
const isClient = typeof window !== 'undefined';

const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  if (!isClient) return defaultValue;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved) as T;
    } catch {
      return defaultValue;
    }
  }
  localStorage.setItem(key, JSON.stringify(defaultValue));
  return defaultValue;
};

const setLocalStorageItem = <T>(key: string, value: T) => {
  if (!isClient) return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(`local-storage-${key}-changed`));
};

// Mock Member Evaluations initial data
const MOCK_INITIAL_EVALUATIONS: MemberEvaluation[] = [
  {
    id: 'E001',
    memberId: 'M01',
    userId: 'U002',
    userDisplayName: '성실한정치참여자',
    score: 85,
    comment: '법안 발의 내용이 서민 경제에 실질적인 도움이 되고 있습니다.',
    createdAt: '2026-05-18T10:00:00+09:00'
  },
  {
    id: 'E002',
    memberId: 'M01',
    userId: 'U003',
    userDisplayName: '지나가는데이터어널리스트',
    score: 60,
    comment: 'WDI 지표 중 사회안전 지수는 우수하나 경제부문 입법이 다소 아쉽네요.',
    createdAt: '2026-05-19T14:30:00+09:00'
  },
  {
    id: 'E003',
    memberId: 'M02',
    userId: 'U002',
    userDisplayName: '성실한정치참여자',
    score: 45,
    comment: '회의 출석률 지표(64%)를 소명하는 과정이 더 명확해야 신뢰가 갈 것 같습니다.',
    createdAt: '2026-05-20T11:00:00+09:00'
  }
];

// Custom Hook to sync localStorage across components/tabs
const useLocalStorageState = <T>(key: string, initialValue: T): [T, (val: T) => void, boolean] => {
  const [state, setState] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = getLocalStorageItem(key, initialValue);
    setState(data);
    setLoading(false);

    const handleStorageChange = () => {
      setState(getLocalStorageItem(key, initialValue));
    };

    window.addEventListener(`local-storage-${key}-changed`, handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(`local-storage-${key}-changed`, handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  const updateValue = (newValue: T) => {
    setState(newValue);
    setLocalStorageItem(key, newValue);
  };

  return [state, updateValue, loading];
};

// ─── 1. SESSION MANAGEMENT HOOK ──────────────────────
export const useSession = () => {
  const [session, setSession] = useState<{ id: string; displayName: string; trustLevel: number } | null>(null);

  const fetchSession = useCallback(() => {
    if (!isClient) return;
    const saved = localStorage.getItem('user_session');
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch {
        setSession(null);
      }
    } else {
      setSession(null);
    }
  }, []);

  useEffect(() => {
    fetchSession();

    const handleSessionChange = () => {
      fetchSession();
    };

    window.addEventListener('user-session-changed', handleSessionChange);
    window.addEventListener('storage', handleSessionChange);

    return () => {
      window.removeEventListener('user-session-changed', handleSessionChange);
      window.removeEventListener('storage', handleSessionChange);
    };
  }, [fetchSession]);

  const login = (displayName: string, trustLevel: number = 5) => {
    const newSession = { id: `U_${Date.now()}`, displayName, trustLevel };
    localStorage.setItem('user_session', JSON.stringify(newSession));
    window.dispatchEvent(new Event('user-session-changed'));
    return newSession;
  };

  const logout = () => {
    localStorage.removeItem('user_session');
    window.dispatchEvent(new Event('user-session-changed'));
  };

  return { session, login, logout, isAuthenticated: !!session };
};

// ─── 2. DASHBOARD DATA HOOK ─────────────────────────
export const useDashboardData = () => {
  const [quizzes] = useLocalStorageState<BlindQuiz[]>('political_os_quizzes', MOCK_QUIZZES);
  const [factchecks] = useLocalStorageState<FactCheck[]>('political_os_factchecks', MOCK_FACTCHECKS);
  const [bills] = useLocalStorageState<BillThread[]>('political_os_bills', MOCK_BILL_THREADS);
  const [questions] = useLocalStorageState<PublicQuestion[]>('political_os_questions', MOCK_QUESTIONS);
  const [proposals] = useLocalStorageState<BillProposal[]>('political_os_proposals', MOCK_PROPOSALS);

  const [loading, setLoading] = useState(true);
  interface PlatformStats {
    memberCount: number;
    verifiedBillCount: number;
    activeQuestionCount: number;
    factcheckCount: number;
  }

  const [stats, setStats] = useState<PlatformStats>({
    memberCount: MOCK_PLATFORM_STATS.memberCount,
    verifiedBillCount: MOCK_PLATFORM_STATS.verifiedBillCount,
    activeQuestionCount: MOCK_PLATFORM_STATS.activeQuestionCount,
    factcheckCount: MOCK_PLATFORM_STATS.factcheckCount
  });
  const [recentPosts, setRecentPosts] = useState<PostSummary[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await delay();

      // Aggregate counts from current localStorage state
      setStats({
        memberCount: MOCK_MEMBERS.length,
        verifiedBillCount: 12400 + bills.length + proposals.length,
        activeQuestionCount: questions.filter(q => q.status === 'open').length,
        factcheckCount: 840 + factchecks.length,
      });

      // Combine and formulate recent activity list sorted by date
      const posts: PostSummary[] = [];

      // Add recent blind quizzes
      quizzes.slice(0, 2).forEach(q => {
        posts.push({
          id: q.id,
          boardType: 'blind',
          title: `이 발언의 주인공은 누구일까요? — ${q.maskedStatement.substring(0, 32)}...`,
          meta: `${new Date(q.createdAt).toLocaleDateString()} · 참여 ${q.agreeCount + q.disagreeCount + q.holdCount}명`,
          badge: '퀴즈',
          badgeColor: 'var(--accent)',
          href: `/blind#${q.id}`,
        });
      });

      // Add recent proposals
      proposals.slice(0, 2).forEach(p => {
        posts.push({
          id: p.id,
          boardType: 'propose',
          title: p.title,
          meta: `${new Date(p.createdAt).toLocaleDateString()} · 공감 ${p.upvoteCount} · 자문단 ${p.legalOpinions.length > 0 ? '검토완료' : '검토중'}`,
          badge: p.status === 'community_review' ? '시민 검토 중' : '자문단 검토 중',
          badgeColor: 'var(--accent)',
          href: `/bills/propose`,
        });
      });

      // Add recent questions
      questions.slice(0, 2).forEach(q => {
        posts.push({
          id: q.id,
          boardType: 'question',
          title: q.title,
          meta: `${new Date(q.createdAt).toLocaleDateString()} · 공감 ${q.voteCount}명 · 대상: ${q.targetMember}`,
          badge: q.status === 'answered' ? '소명 완료' : '소명 요구 중',
          badgeColor: q.status === 'answered' ? 'var(--success)' : 'var(--warning)',
          href: `/questions`,
        });
      });

      // Add recent factchecks
      factchecks.slice(0, 2).forEach(fc => {
        let verdictLabel = '대기';
        let verdictColor = 'var(--text-3)';
        if (fc.verdict === 'mostly_false' || fc.verdict === 'false') {
          verdictLabel = '대체로 거짓';
          verdictColor = 'var(--danger)';
        } else if (fc.verdict === 'mostly_true' || fc.verdict === 'true') {
          verdictLabel = '대체로 사실';
          verdictColor = 'var(--success)';
        } else if (fc.verdict === 'half_true') {
          verdictLabel = '절반의 사실';
          verdictColor = 'var(--warning)';
        }

        posts.push({
          id: fc.id,
          boardType: 'factcheck',
          title: fc.claim,
          meta: `${new Date(fc.createdAt).toLocaleDateString()} · 검증 참여 ${fc.verifiedCount}명`,
          badge: verdictLabel,
          badgeColor: verdictColor,
          href: `/factcheck`,
        });
      });

      setRecentPosts(posts.slice(0, 5));
      setLoading(false);
    };

    loadData();
  }, [quizzes, factchecks, bills, questions, proposals]);

  return { stats, recentPosts, loading };
};

// ─── 3. BLIND QUIZ HOOKS ──────────────────────────────
export const useQuizzes = () => {
  const [quizzes, setQuizzes, quizLoading] = useLocalStorageState<BlindQuiz[]>('political_os_quizzes', MOCK_QUIZZES);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { session } = useSession();

  useEffect(() => {
    if (!quizLoading) {
      setLoading(false);
    }
  }, [quizLoading]);

  const submitBlindVote = async (quizId: string, voteType: BlindVoteType) => {
    if (!session) {
      showToast('로그인이 필요한 기능입니다.', 'error');
      return false;
    }

    // Network Delay
    await delay(300);

    // Optimistic Update
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

    // Record user vote to local history
    const userVotes = getLocalStorageItem<Record<string, BlindVoteType>>('user_blind_votes', {});
    userVotes[quizId] = voteType;
    setLocalStorageItem('user_blind_votes', userVotes);

    showToast('블라인드 투표가 성공적으로 처리되었습니다.', 'success');
    return true;
  };

  const getUserVote = (quizId: string): BlindVoteType | null => {
    const userVotes = getLocalStorageItem<Record<string, BlindVoteType>>('user_blind_votes', {});
    return userVotes[quizId] || null;
  };

  return { quizzes, loading, submitBlindVote, getUserVote };
};

// ─── 4. LAWMAKER DETAILED HOOKS ───────────────────────
export const useMemberDetail = (memberId: string) => {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMember = async () => {
      setLoading(true);
      await delay(400);

      const found = MOCK_MEMBERS.find((m) => m.id === memberId);
      if (found) {
        // Hydrate details like history and sponsored bills if absent
        const hydrated: Member = {
          ...found,
          electedHistory: found.electedHistory || ['제22대 국회의원'],
          sponsoredBills: found.sponsoredBills || [
            { billId: 'BT001', title: '소상공인 보호 및 지원에 관한 법률 개정안', role: 'representative' },
            { billId: 'BT002', title: '청년 주거 안정 특별법 제정안', role: 'cosponsor' }
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

  const [quizzes] = useLocalStorageState<BlindQuiz[]>('political_os_quizzes', MOCK_QUIZZES);
  const [factchecks] = useLocalStorageState<FactCheck[]>('political_os_factchecks', MOCK_FACTCHECKS);
  const [bills] = useLocalStorageState<BillThread[]>('political_os_bills', MOCK_BILL_THREADS);
  const [questions] = useLocalStorageState<PublicQuestion[]>('political_os_questions', MOCK_QUESTIONS);

  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      await delay(500);

      const foundMember = MOCK_MEMBERS.find((m) => m.id === memberId);
      if (!foundMember) {
        setActivities([]);
        setLoading(false);
        return;
      }

      const memberName = foundMember.name;
      const combined: any[] = [];

      // 1. Quizzes regarding this member
      quizzes.forEach(q => {
        if (q.memberName === memberName) {
          combined.push({
            id: `ACT_Q_${q.id}`,
            type: 'quiz',
            title: `블라인드 퀴즈 발언 등록`,
            description: q.maskedStatement,
            date: q.createdAt,
            details: q,
            link: `/blind#${q.id}`
          });
        }
      });

      // 2. Factchecks regarding this member (we map claims that contain memberName or look up claims)
      // Since it's mock, we map: FC001 -> 김철수 (M01), FC002 -> 이영희 (M02), FC003 -> 박준영 (M03)
      factchecks.forEach(fc => {
        let isRelated = false;
        if (memberId === 'M01' && fc.id === 'FC001') isRelated = true;
        if (memberId === 'M02' && fc.id === 'FC002') isRelated = true;
        if (memberId === 'M03' && fc.id === 'FC003') isRelated = true;

        if (isRelated) {
          combined.push({
            id: `ACT_FC_${fc.id}`,
            type: 'factcheck',
            title: `인물 발언 팩트체크 대상`,
            description: fc.claim,
            date: fc.createdAt,
            details: fc,
            link: `/factcheck`
          });
        }
      });

      // 3. Bills proposed by this member
      // For mock, BT001 is proposed by 김철수 (M01), BT002 is proposed by 이영희 (M02)
      bills.forEach(b => {
        let isRelated = false;
        if (memberId === 'M01' && b.id === 'BT001') isRelated = true;
        if (memberId === 'M02' && b.id === 'BT002') isRelated = true;

        if (isRelated) {
          combined.push({
            id: `ACT_B_${b.id}`,
            type: 'bill',
            title: `대표 발의 법안 토론 상정`,
            description: b.billSummary,
            date: b.createdAt,
            details: b,
            link: `/bills`
          });
        }
      });

      // 4. Questions targeted to this member
      questions.forEach(q => {
        if (q.targetMemberId === memberId) {
          combined.push({
            id: `ACT_QU_${q.id}`,
            type: 'question',
            title: `시민 공개 소명 질의 수신`,
            description: q.title,
            date: q.createdAt,
            details: q,
            link: `/questions`
          });
        }
      });

      // Sort by Date descending
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivities(combined);
      setLoading(false);
    };

    loadActivities();
  }, [memberId, quizzes, factchecks, bills, questions]);

  return { activities, loading };
};

export const useMemberEvaluations = (memberId: string) => {
  const [evaluations, setEvaluations, evalLoading] = useLocalStorageState<MemberEvaluation[]>(
    'political_os_evaluations',
    MOCK_INITIAL_EVALUATIONS
  );
  const [filteredEvaluations, setFilteredEvaluations] = useState<MemberEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useSession();
  const { showToast } = useToast();

  useEffect(() => {
    if (!evalLoading) {
      const filtered = evaluations.filter((e) => e.memberId === memberId);
      // Sort newest first
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setFilteredEvaluations(filtered);
      setLoading(false);
    }
  }, [evaluations, memberId, evalLoading]);

  const submitMemberEvaluation = async (score: number, comment: string) => {
    if (!session) {
      showToast('로그인이 필요한 기능입니다.', 'error');
      return false;
    }

    await delay(500);

    const existingIndex = evaluations.findIndex(
      (e) => e.memberId === memberId && e.userId === session.id
    );

    let updated: MemberEvaluation[];
    if (existingIndex > -1) {
      // Upsert: Overwrite with latest evaluation
      const updatedList = [...evaluations];
      updatedList[existingIndex] = {
        ...updatedList[existingIndex],
        score,
        comment,
        createdAt: new Date().toISOString(),
      };
      updated = updatedList;
      showToast('이전 평가를 업데이트하였습니다.', 'success');
    } else {
      // New evaluation
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
      showToast('평가가 성공적으로 제출되었습니다.', 'success');
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

// ─── 5. BILL DISCUSSION & PROPOSAL HOOKS ──────────────
export const useBills = () => {
  const [bills, setBills, billLoading] = useLocalStorageState<BillThread[]>('political_os_bills', MOCK_BILL_THREADS);
  const [proposals, setProposals, propLoading] = useLocalStorageState<BillProposal[]>('political_os_proposals', MOCK_PROPOSALS);
  const [loading, setLoading] = useState(true);
  const { session } = useSession();
  const { showToast } = useToast();

  useEffect(() => {
    if (!billLoading && !propLoading) {
      setLoading(false);
    }
  }, [billLoading, propLoading]);

  const submitProposal = async (title: string, purpose: string, background: string, clauses: string[]) => {
    if (!session) {
      showToast('로그인이 필요한 기능입니다.', 'error');
      return false;
    }

    await delay(800);

    const diffLines = clauses.map(c => ({ type: 'added' as const, text: c }));
    const newProposal: BillProposal = {
      id: `PR_${Date.now()}`,
      title,
      purpose,
      background,
      status: 'community_review',
      authorName: session.displayName,
      createdAt: new Date().toISOString(),
      upvoteCount: 1,
      diffData: diffLines,
      versions: [
        {
          version: 1,
          createdAt: new Date().toISOString(),
          authorName: session.displayName,
          changeSummary: '시민 제안 법안 초안 발의',
          diffData: diffLines
        }
      ],
      legalOpinions: [],
      aiToxicityScore: Math.floor(Math.random() * 10), // Low toxicity simulated
    };

    setProposals([newProposal, ...proposals]);
    showToast('시민 입법안이 상정되었습니다. 동의 투표 진행 가능.', 'success');
    return true;
  };

  return { bills, proposals, loading, submitProposal };
};

export const useBillDetail = (billId: string) => {
  const [bill, setBill] = useState<BillThread | null>(null);
  const [replies, setReplies] = useLocalStorageState<BillReply[]>('political_os_replies', MOCK_BILL_REPLIES);
  const [filteredReplies, setFilteredReplies] = useState<BillReply[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useSession();
  const { showToast } = useToast();

  useEffect(() => {
    const loadBill = async () => {
      setLoading(true);
      await delay(300);

      const found = MOCK_BILL_THREADS.find((b) => b.id === billId);
      if (found) {
        setBill(found);
      } else {
        setBill(null);
      }
      setLoading(false);
    };

    loadBill();
  }, [billId]);

  useEffect(() => {
    const filtered = replies.filter((r) => r.threadId === billId);
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setFilteredReplies(filtered);
  }, [replies, billId]);

  const submitDebateReply = async (replyType: ReplyType, content: string, sourceUrl?: string) => {
    if (!session) {
      showToast('로그인이 필요한 기능입니다.', 'error');
      return false;
    }

    await delay(400);

    const newReply: BillReply = {
      id: `BR_${Date.now()}`,
      threadId: billId,
      replyType,
      content,
      sourceUrl: sourceUrl || undefined,
      authorName: session.displayName,
      verifiedCount: 0,
      needsReviewCount: 0,
      createdAt: new Date().toISOString()
    };

    setReplies([newReply, ...replies]);
    showToast('토론 댓글이 작성되었습니다.', 'success');
    return true;
  };

  const voteReply = async (replyId: string, reaction: ReactionType) => {
    if (!session) {
      showToast('로그인이 필요한 기능입니다.', 'error');
      return false;
    }

    const updated = replies.map((r) => {
      if (r.id === replyId) {
        return {
          ...r,
          verifiedCount: reaction === 'verified' ? r.verifiedCount + 1 : r.verifiedCount,
          needsReviewCount: reaction === 'needs_review' ? r.needsReviewCount + 1 : r.needsReviewCount
        };
      }
      return r;
    });

    setReplies(updated);
    showToast('검토 투표가 반영되었습니다.', 'success');
    return true;
  };

  return { bill, replies: filteredReplies, loading, submitDebateReply, voteReply };
};

// ─── 6. FACTCHECK HOOKS ──────────────────────────────
export const useFactChecks = () => {
  const [factchecks, setFactchecks, fcLoading] = useLocalStorageState<FactCheck[]>('political_os_factchecks', MOCK_FACTCHECKS);
  const [loading, setLoading] = useState(true);
  const { session } = useSession();
  const { showToast } = useToast();

  useEffect(() => {
    if (!fcLoading) {
      setLoading(false);
    }
  }, [fcLoading]);

  const voteFactCheck = async (factId: string, reaction: ReactionType) => {
    if (!session) {
      showToast('로그인이 필요한 기능입니다.', 'error');
      return false;
    }

    await delay(300);

    const updated = factchecks.map((fc) => {
      if (fc.id === factId) {
        return {
          ...fc,
          verifiedCount: reaction === 'verified' ? fc.verifiedCount + 1 : fc.verifiedCount,
          needsReviewCount: reaction === 'needs_review' ? fc.needsReviewCount + 1 : fc.needsReviewCount
        };
      }
      return fc;
    });

    setFactchecks(updated);
    showToast('주장에 대한 팩트 검토 결과가 반영되었습니다.', 'success');
    return true;
  };

  const createFactCheck = async (claim: string, evidence: string, verdict: FactCheckVerdict, sourceUrls: string[]) => {
    if (!session) {
      showToast('로그인이 필요한 기능입니다.', 'error');
      return false;
    }

    await delay(600);

    const newFc: FactCheck = {
      id: `FC_${Date.now()}`,
      claim,
      evidence,
      verdict,
      sourceUrls,
      verifiedCount: 1,
      needsReviewCount: 0,
      authorName: session.displayName,
      createdAt: new Date().toISOString()
    };

    setFactchecks([newFc, ...factchecks]);
    showToast('새로운 팩트체크 리포트가 성공적으로 상정되었습니다.', 'success');
    return true;
  };

  return { factchecks, loading, voteFactCheck, createFactCheck };
};

// ─── 7. PUBLIC QUESTIONS HOOKS ────────────────────────
export const useQuestions = () => {
  const [questions, setQuestions, qLoading] = useLocalStorageState<PublicQuestion[]>('political_os_questions', MOCK_QUESTIONS);
  const [loading, setLoading] = useState(true);
  const { session } = useSession();
  const { showToast } = useToast();

  useEffect(() => {
    if (!qLoading) {
      setLoading(false);
    }
  }, [qLoading]);

  const submitQuestion = async (targetMemberId: string, title: string, content: string, sourceUrl?: string) => {
    if (!session) {
      showToast('로그인이 필요한 기능입니다.', 'error');
      return false;
    }

    const foundMember = MOCK_MEMBERS.find(m => m.id === targetMemberId);
    if (!foundMember) {
      showToast('해당하는 의원을 찾을 수 없습니다.', 'error');
      return false;
    }

    await delay(500);

    const newQ: PublicQuestion = {
      id: `QU_${Date.now()}`,
      questionCode: `QU-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      targetMember: `${foundMember.name} 의원`,
      targetMemberId: foundMember.id,
      title,
      content,
      sourceUrl: sourceUrl || undefined,
      status: 'open',
      voteCount: 1,
      authorName: session.displayName,
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days later
    };

    setQuestions([newQ, ...questions]);
    showToast('공개 질의가 등록되었습니다. 시민 지지 서명이 진행됩니다.', 'success');
    return true;
  };

  const upvoteQuestion = async (questionId: string) => {
    if (!session) {
      showToast('로그인이 필요한 기능입니다.', 'error');
      return false;
    }

    const upvotedQuestions = getLocalStorageItem<string[]>('user_question_upvotes', []);
    if (upvotedQuestions.includes(questionId)) {
      showToast('이미 공감 서명을 완료한 질의입니다.', 'warning');
      return false;
    }

    await delay(300);

    const updated = questions.map((q) => {
      if (q.id === questionId) {
        return {
          ...q,
          voteCount: q.voteCount + 1
        };
      }
      return q;
    });

    setQuestions(updated);
    setLocalStorageItem('user_question_upvotes', [...upvotedQuestions, questionId]);
    showToast('질의 서명에 공감 투표가 성공적으로 가산되었습니다.', 'success');
    return true;
  };

  const hasUpvoted = (questionId: string) => {
    const upvotedQuestions = getLocalStorageItem<string[]>('user_question_upvotes', []);
    return upvotedQuestions.includes(questionId);
  };

  return { questions, loading, submitQuestion, upvoteQuestion, hasUpvoted };
};
