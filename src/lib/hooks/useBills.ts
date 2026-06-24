import { useState, useEffect } from 'react';
import { BillThread, BillProposal, BillReply, ReplyType, ReactionType } from '../types';

import { useLocalStorageState } from './useLocalStorage';
import { useSession } from './useSession';
import { useToast } from './useToast';
import { delay } from '../utils/delay';

import { billService } from '../services';

export const useBills = () => {
  const [bills, setBills] = useState<BillThread[]>([]);
  const [proposals, setProposals] = useState<BillProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useSession();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [fetchedBills, fetchedProposals] = await Promise.all([
        billService.getBills(),
        billService.getProposals()
      ]);
      setBills(fetchedBills);
      setProposals(fetchedProposals);
      setLoading(false);
    };
    fetchData();
  }, []);

  const submitProposal = async (title: string, purpose: string, background: string, clauses: string[]) => {
    if (!session) {
      showToast('로그인이 필요합니다.', 'error');
      return false;
    }

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
          changeSummary: '최초 초안 등록',
          diffData: diffLines
        }
      ],
      legalOpinions: [],
      aiToxicityScore: Math.floor(Math.random() * 10),
    };

    const created = await billService.createProposal(newProposal);
    if (!created) {
      showToast('법안 등록 중 오류가 발생했습니다.', 'error');
      return false;
    }

    setProposals([created, ...proposals]);
    showToast('법안 제안이 성공적으로 등록되었습니다.', 'success');
    return true;
  };

  return { bills, proposals, loading, submitProposal };
};

export const useBillDetail = (billId: string) => {
  const [bill, setBill] = useState<BillThread | null>(null);
  const [replies, setReplies] = useLocalStorageState<BillReply[]>('political_os_replies', []);
  const [filteredReplies, setFilteredReplies] = useState<BillReply[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useSession();
  const { showToast } = useToast();

  useEffect(() => {
    const loadBill = async () => {
      setLoading(true);
      const data = await billService.getBill(billId);
      setBill(data);
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
      showToast('로그인이 필요합니다.', 'error');
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
    showToast('토론 의견이 등록되었습니다.', 'success');
    return true;
  };

  const voteReply = async (replyId: string, reaction: ReactionType) => {
    if (!session) {
      showToast('로그인이 필요합니다.', 'error');
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
    showToast('평가가 반영되었습니다.', 'success');
    return true;
  };

  return { bill, replies: filteredReplies, loading, submitDebateReply, voteReply };
};
