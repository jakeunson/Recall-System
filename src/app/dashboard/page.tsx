'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PublicQuestion, BillProposal } from '@/lib/types';
import { MOCK_QUESTIONS } from '@/lib/mock-data';
import { detectEmotionWords } from '@/lib/emotion-filter';

// ─── AI Toxicity 스코어 시뮬레이션 계산기 ────────────────────
function calcToxicityScore(text: string): number {
  if (!text) return 0;
  
  // 1. 초고위험 특정 편향/부패/선동 극단 키워드 리스트
  const SEVERE_WORDS = ['밀실', '비리', '야합', '공작', '돈봉투', '독식', '횡령', '조작', '탄핵'];
  const hasSevere = SEVERE_WORDS.some(word => text.includes(word));
  
  // 2. 기존 emotion-filter 단어 검증
  const emotionResult = detectEmotionWords(text);
  
  if (hasSevere) {
    return 75 + (text.length % 21); // 75 ~ 95점 사이 산출
  } else if (emotionResult.hasEmotionWords) {
    return 45 + (text.length % 21); // 45 ~ 65점 사이 산출
  } else {
    return 5 + (text.length % 21);  // 5 ~ 25점 사이 (안전)
  }
}

export default function DashboardPage() {
  const [userSession, setUserSession] = useState<{ id: string; displayName: string; trustLevel: number } | null>(null);

  // 대시보드 런타임 데이터 상태
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [proposals, setProposals] = useState<BillProposal[]>([]);
  const [factchecks, setFactchecks] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // 알림 토스트 상태
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 국회의원 소명 답변 입력용 폼 상태
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [officialExplanation, setOfficialExplanation] = useState('');

  // 전문 평가단 입법 자문 의견 입력용 상태
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null);
  const [advisoryReview, setAdvisoryReview] = useState('');

  // 서비스 운영자 신규 영상 등록 폼 상태
  const [videoMemberId, setVideoMemberId] = useState('M01');
  const [videoCategory, setVideoCategory] = useState('인터뷰');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('https://www.w3schools.com/html/mov_bbb.mp4');
  const [videoDesc, setVideoDesc] = useState('');

  // 초기 상태 로드 및 동기화
  const loadDashboardData = async () => {
    if (typeof window === 'undefined') return;

    // 세션 로드
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        setUserSession(JSON.parse(savedSession));
      } catch {
        setUserSession(null);
      }
    } else {
      setUserSession(null);
    }

    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    
    const [
      { data: qList },
      { data: pList },
      { data: fcList },
      { data: mList }
    ] = await Promise.all([
      supabase.from('questions').select('*').order('createdAt', { ascending: false }),
      supabase.from('proposals').select('*').order('createdAt', { ascending: false }),
      supabase.from('fact_checks').select('*').order('createdAt', { ascending: false }),
      supabase.from('members').select('*')
    ]);

    if (qList) setQuestions(qList as PublicQuestion[]);
    if (pList) setProposals(pList as BillProposal[]);
    if (fcList) setFactchecks(fcList);
    if (mList) setMembers(mList);

    // 4. 의원 비디오 로드
    let vList = [];
    const savedVideos = localStorage.getItem('member_videos');
    if (savedVideos) {
      try {
        vList = JSON.parse(savedVideos);
      } catch (e) {
        console.error(e);
      }
    }
    setVideos(vList);
  };

  useEffect(() => {
    loadDashboardData();

    // 외부 세션/스토리지 변경 이벤트 리스너 바인딩
    window.addEventListener('user-session-changed', loadDashboardData);
    window.addEventListener('storage', loadDashboardData);
    return () => {
      window.removeEventListener('user-session-changed', loadDashboardData);
      window.removeEventListener('storage', loadDashboardData);
    };
  }, []);

  // 토스트 도우미
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // 1. 국회의원 공식 소명 등록 처리
  const handleRegisterExplanation = async (qId: string) => {
    if (!officialExplanation.trim()) return;

    const updatedQ = questions.map((q) => {
      if (q.id === qId) {
        return {
          ...q,
          status: 'answered' as const,
          content: `${q.content}\n\n[📢 의원실 공식 소명 답변서]\n${officialExplanation.trim()}`,
        };
      }
      return q;
    });

    setQuestions(updatedQ);

    const target = updatedQ.find(q => q.id === qId);
    if (target) {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      await supabase.from('questions').update({
        status: target.status,
        content: target.content
      }).eq('id', qId);
    }

    setActiveQuestionId(null);
    setOfficialExplanation('');
    triggerToast('공식 답변 소명서 등록이 완료되었습니다. Gemini AI에 의한 AQS 품질 채점이 자동 트리거됩니다!');
  };

  // 1-2. 국회의원 AQS 채점 이의 신청 처리
  const handleRequestDispute = async (qId: string) => {
    const updatedQ = questions.map((q) => {
      if (q.id === qId) {
        return {
          ...q,
          status: 'disputed' as const,
          disputeRequested: true,
        };
      }
      return q;
    });

    setQuestions(updatedQ);

    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    await supabase.from('questions').update({
      status: 'disputed',
      disputeRequested: true
    }).eq('id', qId);

    triggerToast('AQS AI 채점에 대한 이의 신청이 정식 등록되었습니다. 전문 자문단의 재심사 대기열로 이송되었습니다.');
  };

  // 2. 전문 평가단 입법 자문 합헌 판정 처리
  const handleRegisterAdvisory = async (pId: string) => {
    if (!advisoryReview.trim()) return;

    const updatedP = proposals.map((pr) => {
      if (pr.id === pId) {
        return {
          ...pr,
          status: 'finalized' as const,
          background: `${pr.background}\n\n[⚖️ 전문자문단 합헌성 검토 의견]\n${advisoryReview.trim()}`,
        };
      }
      return pr;
    });

    setProposals(updatedP);

    const target = updatedP.find(p => p.id === pId);
    if (target) {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      await supabase.from('proposals').update({
        status: target.status,
        background: target.background
      }).eq('id', pId);
    }

    setActiveProposalId(null);
    setAdvisoryReview('');
    triggerToast('해당 시민 입법 제안에 대한 자문단 합헌 판정이 완료되었습니다.');
  };

  // 2-2. 전문 평가단 입법 자문 수정 권고 피드백 처리
  const handleRegisterAmendmentFeedback = async (pId: string) => {
    if (!advisoryReview.trim()) return;

    const updatedP = proposals.map((pr) => {
      if (pr.id === pId) {
        return {
          ...pr,
          status: 'needs_amendment' as const,
          background: `${pr.background}\n\n[⚖️ 전문자문단 수정 보완 권고 의견]\n${advisoryReview.trim()}`,
        };
      }
      return pr;
    });

    setProposals(updatedP);

    const target = updatedP.find(p => p.id === pId);
    if (target) {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      await supabase.from('proposals').update({
        status: target.status,
        background: target.background
      }).eq('id', pId);
    }

    setActiveProposalId(null);
    setAdvisoryReview('');
    triggerToast('해당 시민 입법 제안에 대해 수정 권고 피드백이 등록되었습니다.');
  };

  // 2-3. 전문 평가단 AI 채점 이의 신청 재심사 판정 처리
  const handleResolveDispute = async (qId: string, action: 'keep' | 'raise') => {
    const updatedQ = questions.map((q) => {
      if (q.id === qId) {
        const expertComment = action === 'keep'
          ? '\n\n[⚖️ 전문 자문단 최종 재심사 결과]\n의원실의 이의 신청을 전문 위원단 전원 합의 하에 정밀 검토하였으나, 답변의 상투적인 서술 비중이 높다고 판단하여 최초 AI AQS 품질 평가점수를 원안대로 최종 유지(승인) 결정합니다.'
          : '\n\n[⚖️ 전문 자문단 최종 재심사 결과]\n소명서의 추진 일정 및 세부 예산 정보의 구체성을 상세히 소명했음을 법률적으로 입증 확인하였습니다. 이에 따라 AI 채점 이의 신청을 전면 수용하여 최초 AQS 채점에 +10점 가산 조정을 공식 최종 승인합니다.';
        
        return {
          ...q,
          status: 'answered' as const,
          disputeRequested: false,
          disputeResolved: true,
          content: `${q.content}${expertComment}`,
        };
      }
      return q;
    });

    setQuestions(updatedQ);

    const target = updatedQ.find(q => q.id === qId);
    if (target) {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      await supabase.from('questions').update({
        status: target.status,
        disputeRequested: target.disputeRequested,
        disputeResolved: target.disputeResolved,
        content: target.content
      }).eq('id', qId);
    }

    triggerToast('AQS AI 채점 이의 신청건에 대한 사법 평가 위원단 재심 판정이 종결되었습니다.');
  };

  // 2-4. 전문 평가단 보류 팩트체크 교차 검증 판정 처리
  const handleResolveFactCheck = async (fcId: string, verdict: any) => {
    const target = factchecks.find(f => f.id === fcId);
    if (!target) return;

    const newEvidence = `${target.evidence}\n\n[⚖️ 전문 자문위원 최종 팩트 교차 검증]\n전문가 전원 검증을 통해 본 주장 및 근거를 사법적 기준 하에 [${verdict}] 결과로 최종 확정 판결합니다.`;

    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    await supabase.from('fact_checks').update({
      status: 'active',
      verdict: verdict,
      evidence: newEvidence
    }).eq('id', fcId);

    loadDashboardData();
    triggerToast('보류된 시민 팩트체크에 대한 전문가 최종 크로스-체크 진위 확정이 완료되었습니다.');
  };

  // 3. 서비스 운영자: 국회의원 의정 비디오 업로드
  const handleUploadVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) {
      alert('영상 제목을 입력해 주세요.');
      return;
    }

    const newVid = {
      id: `v_user_${Date.now()}`,
      memberId: videoMemberId,
      title: videoTitle.trim(),
      category: videoCategory,
      url: videoUrl,
      description: videoDesc.trim() || '운영자가 직수집하여 등록한 국회의원 의정 활동 기록 영상 자료입니다.',
    };

    const nextVids = [newVid, ...videos];
    localStorage.setItem('member_videos', JSON.stringify(nextVids));
    setVideos(nextVids);

    // 폼 초기화
    setVideoTitle('');
    setVideoDesc('');
    triggerToast(`해당 영상이 의정 리포트 갤러리에 성공적으로 퍼블리싱되었습니다!`);
  };

  // 4. 서비스 운영자: 시민 콘텐츠 상태 모더레이션(승인/보류/삭제)
  const handleUpdateContentStatus = async (type: 'question' | 'factcheck' | 'propose', id: string, newStatus: string) => {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();

    let table = '';
    if (type === 'question') table = 'questions';
    else if (type === 'factcheck') table = 'fact_checks';
    else if (type === 'propose') table = 'proposals';

    if (table) {
      await supabase.from(table).update({ status: newStatus }).eq('id', id);
    }

    loadDashboardData();
    triggerToast(`해당 콘텐츠 상태가 [${newStatus}] 등급으로 안전하게 모더레이션 완료되었습니다.`);
  };

  return (
    <div className="fade-in px-6 py-8 max-w-[1000px] mx-auto min-h-screen">
      
      {/* 토스트 배너 */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-accent text-white px-6 py-3 rounded-sm z-[9999] font-bold shadow-lg text-xs border border-white/20">
          ✨ {toastMessage}
        </div>
      )}

      {/* 헤더 섹션 */}
      <div className="mb-8 border-b border-border pb-5">
        <h1 className="text-xl font-black tracking-tight text-foreground mb-2">
          🏛️ 마이 워크스페이스 대시보드
        </h1>
        <p className="text-xs text-muted-foreground m-0">
          로그인된 역할군 권한에 맞춰 특화된 정합성 분석 데이터와 계측 패널을 통합 제공합니다.
        </p>
      </div>

      {/* ── CASE 1: 미로그인 게이트 ── */}
      {!userSession ? (
        <div className="card-base px-8 py-12 text-center bg-card">
          <div className="text-[40px] mb-4">🔑</div>
          <h2 className="text-lg font-extrabold text-foreground mb-2">
            로그인이 필요한 워크스페이스입니다
          </h2>
          <p className="text-xs text-muted-foreground mb-6 max-w-[460px] mx-auto leading-relaxed">
            국민소환제 플랫폼은 일반 시민, 공인 자문단, 피소환 대상 국회의원, 서비스 총괄 운영자 계정 프리셋을 체험 로그인 페이지에서 상시 제공합니다.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/auth/login" className="btn-primary">
              체험 로그인 바로가기
            </Link>
          </div>
        </div>
      ) : (
        <div>
          {/* ── CASE 2: 시민 대시보드 (trustLevel <= 3) ── */}
          {userSession.trustLevel <= 3 && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card-base p-5">
                  <div className="text-xs font-extrabold text-muted-foreground mb-2">나의 신뢰성 포인트</div>
                  <strong className="text-xl text-accent font-mono">{userSession.trustLevel * 120} RP</strong>
                </div>
                <div className="card-base p-5">
                  <div className="text-xs font-extrabold text-muted-foreground mb-2">해결한 블라인드 평가</div>
                  <strong className="text-xl text-foreground font-mono">4 건 / 8건</strong>
                </div>
                <div className="card-base p-5">
                  <div className="text-xs font-extrabold text-muted-foreground mb-2">입법 공감 및 질의 서명 수</div>
                  <strong className="text-xl text-foreground font-mono">2 회</strong>
                </div>
              </div>

              <div className="card-base p-8">
                <h3 className="text-sm font-extrabold text-foreground mb-4">💡 시민 활동 가이드</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  회원님은 신뢰성 기반의 시민 유권자 레벨을 부여받았습니다. 블라인드 평가 퀴즈에서 공정하고 사심 없이 일관된 응답을 많이 할수록 신뢰성 가중치 점수가 상승하며, 더 높은 등급의 정합성 가중치 서명권을 행사할 수 있게 됩니다.
                </p>
                <div className="flex gap-3">
                  <Link href="/blind" className="btn-secondary px-4 py-2 text-xs">블라인드 퀴즈 풀기 ↗</Link>
                  <Link href="/questions" className="btn-secondary px-4 py-2 text-xs">공개 소명 보러가기 ↗</Link>
                </div>
              </div>
            </div>
          )}

          {/* ── CASE 3: 전문 평가단 대시보드 (trustLevel === 4) ── */}
          {userSession.trustLevel === 4 && (
            <div className="flex flex-col gap-6">
              
              {/* 전문 자문위원 입법 심사 대기열 */}
              <div className="card-base p-8">
                <h3 className="text-sm font-extrabold text-foreground mb-4 flex items-center gap-2">
                  🚨 전문 자문위원 입법 심사 대기열 ({proposals.filter(p => p.status !== 'finalized' && p.status !== 'needs_amendment').length}건)
                </h3>
                <p className="text-sm text-muted-foreground leading-snug mb-5">
                  시민들이 제안한 입법 제안서 중 자문단 사법 검토 의견 배정이 요구되는 태스크입니다. 타당성을 분석하여 최종 합헌 승인을 내리거나 수정/보완을 권고할 수 있습니다.
                </p>

                {proposals.filter(p => p.status !== 'finalized' && p.status !== 'needs_amendment').length === 0 ? (
                  <div className="p-6 text-center bg-secondary border border-dashed border-border rounded-sm">
                    <p className="text-xs text-muted-foreground m-0">검토 대기 중인 시민 입법 제안이 없습니다.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {proposals.filter(p => p.status !== 'finalized' && p.status !== 'needs_amendment').map((pr) => (
                      <div key={pr.id} className="border border-border-2 rounded-sm p-4 bg-secondary">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-extrabold text-accent">시민 입법 코드: {pr.id}</span>
                          <span className="text-xs text-muted-foreground">제안자: {pr.authorName}</span>
                        </div>
                        <h4 className="text-base font-extrabold text-foreground mb-1.5">{pr.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">{pr.purpose}</p>

                        {activeProposalId === pr.id ? (
                          <div className="flex flex-col gap-2 mt-3 border-t border-border pt-3">
                            <textarea
                              placeholder="입법 청원에 대한 헌법 정합성 분석, 자문 검토 소견 또는 수정 보완 요구 사항을 명확히 작성해 주세요."
                              value={advisoryReview}
                              onChange={(e) => setAdvisoryReview(e.target.value)}
                              rows={4}
                              className="w-full p-2.5 rounded border border-border-2 bg-secondary text-foreground text-xs outline-none focus:border-accent"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => handleRegisterAdvisory(pr.id)} className="btn-primary px-5 py-3 text-sm bg-accent border-accent">🟢 합헌 판정 및 승인</button>
                              <button onClick={() => handleRegisterAmendmentFeedback(pr.id)} className="btn-primary px-5 py-3 text-sm bg-warning border-warning">🟡 입법 수정 권고</button>
                              <button onClick={() => { setActiveProposalId(null); setAdvisoryReview(''); }} className="btn-secondary px-5 py-3 text-sm">취소</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setActiveProposalId(pr.id)} className="btn-secondary px-5 py-3 text-sm border-accent text-accent">
                            ⚖️ 자문 검토서 작성하기
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 🤖 AI 채점 이의 신청 재심사 대기열 */}
              <div className="card-base p-8">
                <h3 className="text-sm font-extrabold text-foreground mb-4 flex items-center gap-2">
                  🤖 AI 채점 이의 신청 재심사 대기열 ({questions.filter(q => q.status === 'disputed').length}건)
                </h3>
                <p className="text-sm text-muted-foreground leading-snug mb-5">
                  국회의원이 AI AQS 채점 결과에 불복하여 이의를 신청한 안건입니다. 전문가 합의를 거쳐 최초 채점을 유지하거나 10점의 가산 상향 조정을 승인할 수 있습니다.
                </p>

                {questions.filter(q => q.status === 'disputed').length === 0 ? (
                  <div className="p-6 text-center bg-secondary border border-dashed border-border rounded-sm">
                    <p className="text-xs text-muted-foreground m-0">재심사 대기 중인 이의 신청 안건이 없습니다.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {questions.filter(q => q.status === 'disputed').map((q) => (
                      <div key={q.id} className="border border-border-2 rounded-sm p-4 bg-secondary">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-extrabold text-warning">이의제기 의원: {q.targetMember} ({q.targetMemberId})</span>
                          <span className="text-xs text-muted-foreground">코드: {q.questionCode}</span>
                        </div>
                        <h4 className="text-base font-extrabold text-foreground mb-1.5">{q.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">{q.content.substring(0, 160)}...</p>

                        <div className="flex gap-2">
                          <button onClick={() => handleResolveDispute(q.id, 'keep')} className="btn-secondary px-5 py-3 text-sm border-danger text-danger">
                            🔴 최초 AI 채점 유지 (기각)
                          </button>
                          <button onClick={() => handleResolveDispute(q.id, 'raise')} className="btn-primary px-5 py-3 text-sm bg-accent">
                            🟢 소명 구체성 인정 (+10 가산 승인)
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 📋 시민 팩트체크 교차 검증 대기열 */}
              <div className="card-base p-8">
                <h3 className="text-sm font-extrabold text-foreground mb-4 flex items-center gap-2">
                  📋 시민 팩트체크 교차 검증 대기열 ({factchecks.filter(fc => fc.status === 'held').length}건)
                </h3>
                <p className="text-sm text-muted-foreground leading-snug mb-5">
                  운영자가 사실 관계 검증 유보(보류) 처리를 내린 팩트체크 제보 자료입니다. 전문 사법적 기준 하에 근거를 조사해 최종 진위 판결을 확정합니다.
                </p>

                {factchecks.filter(fc => fc.status === 'held').length === 0 ? (
                  <div className="p-6 text-center bg-secondary border border-dashed border-border rounded-sm">
                    <p className="text-xs text-muted-foreground m-0">보류 처리된 크로스-체크 대기열이 깨끗합니다.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {factchecks.filter(fc => fc.status === 'held').map((fc) => (
                      <div key={fc.id} className="border border-border-2 rounded-sm p-4 bg-secondary">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-extrabold text-accent">제보 코드: {fc.id}</span>
                          <span className="text-xs text-muted-foreground">제보자: {fc.authorName}</span>
                        </div>
                        <h4 className="text-base font-extrabold text-foreground mb-1.5">{fc.title || fc.claim}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3"><strong>주장:</strong> {fc.claim}<br /><strong>근거:</strong> {fc.evidence}</p>

                        <div className="flex gap-2">
                          <button onClick={() => handleResolveFactCheck(fc.id, 'true')} className="text-xs font-bold text-success bg-secondary px-2.5 py-1 rounded-sm border border-success hover:bg-success/10">🟢 참(True) 확정</button>
                          <button onClick={() => handleResolveFactCheck(fc.id, 'half_true')} className="text-xs font-bold text-warning bg-secondary px-2.5 py-1 rounded-sm border border-warning hover:bg-warning/10">🟡 절반의 참 확정</button>
                          <button onClick={() => handleResolveFactCheck(fc.id, 'false')} className="text-xs font-bold text-danger bg-secondary px-2.5 py-1 rounded-sm border border-danger hover:bg-danger/10">🔴 거짓(False) 확정</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ── CASE 4: 국회의원 대시보드 (trustLevel === 5 - 김철수 의원) ── */}
          {userSession.trustLevel === 5 && (
            <div className="flex flex-col gap-6">
              
              {/* 국회의원 4대 의정 정합 지표판 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card-base p-5 border border-border">
                  <div className="text-xs font-extrabold text-muted-foreground mb-1.5">WDI (이탈지수)</div>
                  <strong className="text-xl text-accent font-mono">14% <span className="text-sm font-semibold text-success">(매우 우수)</span></strong>
                </div>
                <div className="card-base p-5">
                  <div className="text-xs font-extrabold text-muted-foreground mb-1.5">본회의 출석률</div>
                  <strong className="text-xl text-foreground font-mono">92.5%</strong>
                </div>
                <div className="card-base p-5">
                  <div className="text-xs font-extrabold text-muted-foreground mb-1.5">공개 질의 답변율</div>
                  <strong className="text-xl text-foreground font-mono">100%</strong>
                </div>
                <div className="card-base p-5">
                  <div className="text-xs font-extrabold text-muted-foreground mb-1.5">내로남불 방어율</div>
                  <strong className="text-xl text-foreground font-mono">85%</strong>
                </div>
              </div>

              {/* 미처리 소명 요구서 카드 목록 */}
              <div className="card-base p-8">
                <h3 className="text-sm font-extrabold text-foreground mb-4 flex items-center gap-2">
                  🚨 미처리 시민 공개 소명 요구서 ({questions.filter((q) => q.targetMemberId === 'M01' && q.status === 'open').length}건)
                </h3>
                <p className="text-sm text-muted-foreground leading-snug mb-5">
                  시민 서명이 확보되어 7일 이내 공식 답변 의무가 부여된 민원 문서입니다. 이곳에 공식 소명서를 등록하는 즉시 실시간 인지 편향 제거 마스킹 시스템을 통과해 시민 대시보드와 의원 리포트카드에 Gemini AI에 의한 AQS 품질 채점이 자동 연동됩니다.
                </p>

                {questions.filter((q) => q.targetMemberId === 'M01' && q.status === 'open').length === 0 ? (
                  <div className="p-6 text-center bg-secondary border border-dashed border-border rounded-sm">
                    <p className="text-xs text-muted-foreground m-0">답변을 기입해야 할 미결 소명 요구서가 없습니다. 깨끗한 의정 신뢰 지표를 달성하고 있습니다!</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {questions.filter((q) => q.targetMemberId === 'M01' && q.status === 'open').map((q) => (
                      <div key={q.id} className="border border-border-2 rounded-sm p-6 bg-secondary">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-extrabold text-danger bg-danger/10 px-2 py-0.5 rounded">🚨 긴급 소명 의무</span>
                          <span className="text-sm text-muted-foreground">동의 서명: {q.voteCount}명</span>
                        </div>
                        <h4 className="text-base font-extrabold text-foreground mb-1.5">{q.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3.5">{q.content}</p>

                        {activeQuestionId === q.id ? (
                          <div className="flex flex-col gap-2.5 border-t border-border pt-5 mt-5">
                            <span className="text-xs font-extrabold text-accent">📋 공식 소명문 기입란</span>
                            <textarea
                              placeholder="구체적인 추진 일자, 관련 법령 정보, 정합적 수치 및 실행 계획을 명확히 담아 소명서를 작성하십시오. 공문서 형태에 어긋나거나 상투적인 정치적 구호만 반복할 경우 AI AQS 평가에서 심각한 감점이 주어집니다."
                              value={officialExplanation}
                              onChange={(e) => setOfficialExplanation(e.target.value)}
                              rows={5}
                              className="w-full p-3 rounded border border-border-2 bg-secondary text-foreground text-xs outline-none leading-relaxed focus:border-accent"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => handleRegisterExplanation(q.id)} className="btn-primary px-5 py-3 text-sm">소명 답변 제출하기</button>
                              <button onClick={() => { setActiveQuestionId(null); setOfficialExplanation(''); }} className="btn-secondary px-5 py-3 text-sm">작성 취소</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setActiveQuestionId(q.id)} className="btn-primary px-4 py-2 text-xs">
                            ✍️ 즉시 소명 답변서 작성
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 완료된 소명 답변 AQS 분석 및 이의 신청 */}
              <div className="card-base p-8">
                <h3 className="text-sm font-extrabold text-foreground mb-4 flex items-center gap-2">
                  📊 완료된 시민 소명 답변 및 AQS 채점 분석 ({questions.filter((q) => q.targetMemberId === 'M01' && (q.status === 'answered' || q.status === 'disputed')).length}건)
                </h3>
                <p className="text-sm text-muted-foreground leading-snug mb-5">
                  공식 제출이 완료된 소명서에 대한 AI (AQS) 채점 품질 피드백입니다. AI 분석 점수에 납득하지 못할 경우 정식 이의를 신청하여 인간 법률 전문가(전문 평가단)의 재검토를 받을 수 있습니다.
                </p>

                {questions.filter((q) => q.targetMemberId === 'M01' && (q.status === 'answered' || q.status === 'disputed')).length === 0 ? (
                  <div className="p-6 text-center bg-secondary border border-dashed border-border rounded-sm">
                    <p className="text-xs text-muted-foreground m-0">등록된 소명 답변이 존재하지 않습니다.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {questions.filter((q) => q.targetMemberId === 'M01' && (q.status === 'answered' || q.status === 'disputed')).map((q) => {
                      const aqsScore = 75 + (q.content.length % 20); // 75 ~ 95점 사이 mock AQS 점수
                      const isDisputed = q.status === 'disputed' || q.disputeRequested;
                      return (
                        <div key={q.id} className="border border-border-2 rounded-sm p-6 bg-secondary">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-extrabold text-success">답변 코드: {q.questionCode}</span>
                            <span className="text-sm text-muted-foreground">작성일: {q.createdAt.substring(0, 10)}</span>
                          </div>
                          <h4 className="text-base font-extrabold text-foreground mb-1.5">{q.title}</h4>
                          
                          <div className="bg-card p-3 rounded-sm mb-3.5 border border-border">
                            <span className="text-xs font-extrabold text-muted-foreground block mb-1">🤖 AI AQS 채점 결과 피드백</span>
                            <div className="flex items-center gap-3">
                              <strong className={`text-xl font-mono ${isDisputed ? 'text-warning' : 'text-accent'}`}>
                                {isDisputed ? '재심사 중' : `${aqsScore}점`}
                              </strong>
                              <span className="text-sm text-muted-foreground">
                                {isDisputed ? '전문 자문위원단 합의 평가가 진행되고 있습니다.' : '구체적인 정책 수치 및 대안 제시 우수성 인정.'}
                              </span>
                            </div>
                          </div>

                          {!isDisputed ? (
                            <button
                              onClick={() => handleRequestDispute(q.id)}
                              className="btn-secondary px-3 py-3 text-sm border-warning text-warning"
                            >
                              ⚖️ AQS AI 채점 결과 이의 신청 (전문가 리뷰)
                            </button>
                          ) : (
                            <span className="text-sm font-bold text-warning flex items-center gap-1">
                              ⏳ 전문가 크로스체크 재심사 계류 중
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── CASE 5: 서비스 총괄 운영자 대시보드 (trustLevel === 10 - Admin) ── */}
          {userSession.trustLevel === 10 && (
            <div className="flex flex-col gap-8">
              
              {/* 영상 업로드 폼 */}
              <div className="card-base p-8">
                <h3 className="text-sm font-extrabold text-foreground mb-1 flex items-center gap-2">
                  🎥 국회의원 의정 활동 영상관 데이터 등록
                </h3>
                <p className="text-sm text-muted-foreground mb-5">
                  국회의원별 질의응답 및 단독 인터뷰 영상을 시스템에 배포 등록합니다. 등록된 영상은 의원 리포트카드에 자동 바인딩됩니다.
                </p>

                <form onSubmit={handleUploadVideo} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-extrabold text-muted-foreground">피등록 국회의원 선택</label>
                      <select
                        value={videoMemberId}
                        onChange={(e) => setVideoMemberId(e.target.value)}
                        className="p-2.5 rounded border border-border-2 bg-secondary text-foreground text-xs outline-none focus:border-accent"
                      >
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>{m.name} 의원 ({m.party} · {m.region})</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-extrabold text-muted-foreground">영상 카테고리</label>
                      <select
                        value={videoCategory}
                        onChange={(e) => setVideoCategory(e.target.value)}
                        className="p-2.5 rounded border border-border-2 bg-secondary text-foreground text-xs outline-none focus:border-accent"
                      >
                        <option value="인터뷰">인터뷰 (Interview)</option>
                        <option value="질의응답">질의응답 (Q&A)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-extrabold text-muted-foreground">영상 타이틀</label>
                    <input
                      type="text"
                      placeholder="의정 활동 영상의 공식 대표 제목을 입력해 주십시오."
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      className="p-2.5 rounded border border-border-2 bg-secondary text-foreground text-xs outline-none focus:border-accent"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-extrabold text-muted-foreground">스트리밍 영상 URL (.mp4 또는 YouTube Embed)</label>
                    <input
                      type="text"
                      placeholder="비디오 파일 경로 혹은 유튜브 스트리밍 소스 링크"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="p-2.5 rounded border border-border-2 bg-secondary text-foreground text-xs outline-none font-mono focus:border-accent"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-extrabold text-muted-foreground">영상 부가 세부 설명</label>
                    <textarea
                      placeholder="영상의 상세 의도 및 논평 설명을 적어 주십시오."
                      value={videoDesc}
                      onChange={(e) => setVideoDesc(e.target.value)}
                      rows={3}
                      className="p-2.5 rounded border border-border-2 bg-secondary text-foreground text-xs outline-none leading-relaxed focus:border-accent"
                    />
                  </div>

                  <button type="submit" className="btn-primary self-start px-6 py-3">
                    🎥 의정 영상 공식 배포 퍼블리싱
                  </button>
                </form>
              </div>

              {/* 시민 생성 글 모더레이션 통제반 */}
              <div className="card-base p-8">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-extrabold text-foreground m-0">
                    🚨 시민 등록 콘텐츠 실시간 모더레이션 통제반
                  </h3>
                  <button
                    onClick={() => {
                      // 1. 팩트체크 일괄 숨김
                      const savedFC = localStorage.getItem('user_factchecks');
                      if (savedFC) {
                        const parsed = JSON.parse(savedFC);
                        const updated = parsed.map((item: any) => {
                          const score = item.aiToxicityScore ?? calcToxicityScore(item.claim + ' ' + item.evidence);
                          if (score >= 70) return { ...item, status: 'hidden' };
                          return item;
                        });
                        localStorage.setItem('user_factchecks', JSON.stringify(updated));
                      }
                      // 2. 질문 일괄 숨김
                      const savedQ = localStorage.getItem('user_questions');
                      if (savedQ) {
                        const parsed = JSON.parse(savedQ) as PublicQuestion[];
                        const updated = parsed.map((item) => {
                          const score = item.aiToxicityScore ?? calcToxicityScore(item.title + ' ' + item.content);
                          if (score >= 70) return { ...item, status: 'hidden' };
                          return item;
                        });
                        localStorage.setItem('user_questions', JSON.stringify(updated));
                      }
                      // 3. 제안 일괄 숨김
                      const savedP = localStorage.getItem('user_proposals');
                      if (savedP) {
                        const parsed = JSON.parse(savedP) as BillProposal[];
                        const updated = parsed.map((item) => {
                          const score = item.aiToxicityScore ?? calcToxicityScore(item.title + ' ' + item.purpose);
                          if (score >= 70) return { ...item, status: 'rejected' };
                          return item;
                        });
                        localStorage.setItem('user_proposals', JSON.stringify(updated));
                      }
                      loadDashboardData();
                      window.dispatchEvent(new Event('storage'));
                      triggerToast('🚨 AI 위험도 70점 이상의 모든 콘텐츠를 일괄 차단(비공개) 처리했습니다.');
                    }}
                    className="btn-secondary px-3 py-3 text-sm border-danger text-danger flex items-center gap-1 cursor-pointer"
                  >
                    ⚡ AI 위험 콘텐츠 일괄 차단
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  시민들이 직접 제보/발의한 소명 요구서 및 팩트체크 리스트를 실시간 감독하여 불온/편향적인 콘텐츠를 보류하거나 비공개(숨김) 처리합니다.
                </p>

                <div className="flex flex-col gap-5">
                  
                  {/* 1. 팩트체크 제보건 관리 */}
                  <div>
                    <h4 className="text-xs font-extrabold text-muted-foreground border-b border-border pb-1.5 mb-2.5">
                      📋 시민 신규 팩트체크 제보건 ({factchecks.length}건)
                    </h4>
                    {factchecks.length === 0 ? (
                      <span className="text-sm text-muted-foreground">동적으로 등록된 시민 제보 팩트체크가 없습니다.</span>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {[...factchecks]
                          .sort((a, b) => {
                            const scoreA = a.aiToxicityScore ?? calcToxicityScore(a.claim + ' ' + a.evidence);
                            const scoreB = b.aiToxicityScore ?? calcToxicityScore(b.claim + ' ' + b.evidence);
                            return scoreB - scoreA;
                          })
                          .map((fc) => {
                            const score = fc.aiToxicityScore ?? calcToxicityScore(fc.claim + ' ' + fc.evidence);
                            const isHighRisk = score >= 70;
                            return (
                              <div key={fc.id} className={`flex justify-between items-center px-5 py-3 rounded-sm border ${isHighRisk ? 'bg-danger/5 border-danger' : 'bg-secondary border-border'}`}>
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <strong className="text-xs text-foreground">{fc.title || fc.claim}</strong>
                                    {score >= 70 ? (
                                      <span className="text-xs font-extrabold text-danger bg-danger/10 px-1.5 py-0.5 rounded-sm">🚨 AI 위험 ({score}점)</span>
                                    ) : score >= 40 ? (
                                      <span className="text-xs font-extrabold text-warning bg-warning/10 px-1.5 py-0.5 rounded-sm">🟡 AI 주의 ({score}점)</span>
                                    ) : (
                                      <span className="text-xs font-extrabold text-success bg-success/10 px-1.5 py-0.5 rounded-sm">🟢 AI 정상 ({score}점)</span>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">판정: {fc.verdict} · 상태: {fc.status || 'active'}</span>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleUpdateContentStatus('factcheck', fc.id, 'active')} className="text-xs font-bold text-success bg-card px-2 py-1 rounded-sm border border-border-2 hover:bg-success/10">🟢 승인</button>
                                  <button onClick={() => handleUpdateContentStatus('factcheck', fc.id, 'held')} className="text-xs font-bold text-warning bg-card px-2 py-1 rounded-sm border border-border-2 hover:bg-warning/10">🟡 보류</button>
                                  <button onClick={() => handleUpdateContentStatus('factcheck', fc.id, 'hidden')} className="text-xs font-bold text-danger bg-card px-2 py-1 rounded-sm border border-border-2 hover:bg-danger/10">🔴 삭제</button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* 2. 소명요구 질의 관리 */}
                  <div>
                    <h4 className="text-xs font-extrabold text-muted-foreground border-b border-border pb-1.5 mb-2.5">
                      💬 시민 공개 소명 요구 질의 ({questions.filter((q) => !MOCK_QUESTIONS.some((mock) => mock.id === q.id)).length}건)
                    </h4>
                    {questions.filter((q) => !MOCK_QUESTIONS.some((mock) => mock.id === q.id)).length === 0 ? (
                      <span className="text-sm text-muted-foreground">동적으로 등록된 시민 질의가 없습니다.</span>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {questions
                          .filter((q) => !MOCK_QUESTIONS.some((mock) => mock.id === q.id))
                          .sort((a, b) => {
                            const scoreA = a.aiToxicityScore ?? calcToxicityScore(a.title + ' ' + a.content);
                            const scoreB = b.aiToxicityScore ?? calcToxicityScore(b.title + ' ' + b.content);
                            return scoreB - scoreA;
                          })
                          .map((q) => {
                            const score = q.aiToxicityScore ?? calcToxicityScore(q.title + ' ' + q.content);
                            const isHighRisk = score >= 70;
                            return (
                              <div key={q.id} className={`flex justify-between items-center px-5 py-3 rounded-sm border ${isHighRisk ? 'bg-danger/5 border-danger' : 'bg-secondary border-border'}`}>
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <strong className="text-xs text-foreground">{q.title}</strong>
                                    {score >= 70 ? (
                                      <span className="text-xs font-extrabold text-danger bg-danger/10 px-1.5 py-0.5 rounded-sm">🚨 AI 위험 ({score}점)</span>
                                    ) : score >= 40 ? (
                                      <span className="text-xs font-extrabold text-warning bg-warning/10 px-1.5 py-0.5 rounded-sm">🟡 AI 주의 ({score}점)</span>
                                    ) : (
                                      <span className="text-xs font-extrabold text-success bg-success/10 px-1.5 py-0.5 rounded-sm">🟢 AI 정상 ({score}점)</span>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">대상의원: {q.targetMember} · 상태: {q.status}</span>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleUpdateContentStatus('question', q.id, 'open')} className="text-xs font-bold text-success bg-card px-2 py-1 rounded-sm border border-border-2 hover:bg-success/10">🟢 승인</button>
                                  <button onClick={() => handleUpdateContentStatus('question', q.id, 'hidden')} className="text-xs font-bold text-danger bg-card px-2 py-1 rounded-sm border border-border-2 hover:bg-danger/10">🔴 삭제</button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* 3. 시민입법 관리 */}
                  <div>
                    <h4 className="text-xs font-extrabold text-muted-foreground border-b border-border pb-1.5 mb-2.5">
                      🏛️ 시민 입법 발의 제안 ({proposals.length}건)
                    </h4>
                    {proposals.length === 0 ? (
                      <span className="text-sm text-muted-foreground">동적으로 등록된 시민 입법안이 없습니다.</span>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {[...proposals]
                          .sort((a, b) => {
                            const scoreA = a.aiToxicityScore ?? calcToxicityScore(a.title + ' ' + a.purpose);
                            const scoreB = b.aiToxicityScore ?? calcToxicityScore(b.title + ' ' + b.purpose);
                            return scoreB - scoreA;
                          })
                          .map((pr) => {
                            const score = pr.aiToxicityScore ?? calcToxicityScore(pr.title + ' ' + pr.purpose);
                            const isHighRisk = score >= 70;
                            return (
                              <div key={pr.id} className={`flex justify-between items-center px-5 py-3 rounded-sm border ${isHighRisk ? 'bg-danger/5 border-danger' : 'bg-secondary border-border'}`}>
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <strong className="text-xs text-foreground">{pr.title}</strong>
                                    {score >= 70 ? (
                                      <span className="text-xs font-extrabold text-danger bg-danger/10 px-1.5 py-0.5 rounded-sm">🚨 AI 위험 ({score}점)</span>
                                    ) : score >= 40 ? (
                                      <span className="text-xs font-extrabold text-warning bg-warning/10 px-1.5 py-0.5 rounded-sm">🟡 AI 주의 ({score}점)</span>
                                    ) : (
                                      <span className="text-xs font-extrabold text-success bg-success/10 px-1.5 py-0.5 rounded-sm">🟢 AI 정상 ({score}점)</span>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">제안자: {pr.authorName} · 상태: {pr.status}</span>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleUpdateContentStatus('propose', pr.id, 'community_review')} className="text-xs font-bold text-success bg-card px-2 py-1 rounded-sm border border-border-2 hover:bg-success/10">🟢 승인</button>
                                  <button onClick={() => handleUpdateContentStatus('propose', pr.id, 'rejected')} className="text-xs font-bold text-danger bg-card px-2 py-1 rounded-sm border border-border-2 hover:bg-danger/10">🔴 삭제</button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
