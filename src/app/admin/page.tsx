'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PublicQuestion, BillProposal, FactCheck, Member } from '@/lib/types';

export default function AdminDeskPage() {
  const [userSession, setUserSession] = useState<{ id: string; displayName: string; trustLevel: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'questions' | 'proposals' | 'factchecks' | 'sentiment'>('dashboard');

  // 데이터 상태
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [proposals, setProposals] = useState<BillProposal[]>([]);
  const [factchecks, setFactchecks] = useState<FactCheck[]>([]);
  
  // 감정 필터링 관련 상태
  const [badWords, setBadWords] = useState<string[]>(['바보', '쓰레기', '매국노', '적폐', '독재자']);
  const [newWord, setNewWord] = useState('');

  // 경보 알림
  const [slaAlerts, setSlaAlerts] = useState<Array<{ memberName: string; questionTitle: string; daysOver: number; questionId: string }>>([
    { memberName: 'M02 김의원', questionTitle: '청년 주거 복지 임대 대책 이행 촉구의 건', daysOver: 14, questionId: 'q2' },
    { memberName: 'M03 박의원', questionTitle: '상임위 출석률 및 소명 요구 질의서', daysOver: 7, questionId: 'q3' }
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. 세션 체크
      const savedSession = localStorage.getItem('user_session');
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          setUserSession(parsed);
        } catch (e) {
          console.error(e);
        }
      }

      const loadAdminData = async () => {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        
        const [
          { data: qList },
          { data: pList },
          { data: fList }
        ] = await Promise.all([
          supabase.from('questions').select('*').order('createdAt', { ascending: false }),
          supabase.from('proposals').select('*').order('createdAt', { ascending: false }),
          supabase.from('fact_checks').select('*').order('createdAt', { ascending: false })
        ]);

        if (qList) setQuestions(qList as PublicQuestion[]);
        if (pList) setProposals(pList as BillProposal[]);
        if (fList) setFactchecks(fList as FactCheck[]);

        setLoading(false);
      };

      loadAdminData();

      // 5. 키워드 사전 로딩
      const savedBadWords = localStorage.getItem('admin_bad_words');
      if (savedBadWords) {
        try {
          setBadWords(JSON.parse(savedBadWords));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // SLA 강제 독촉 핸들러
  const handleTriggerSlaReminder = (memberName: string, title: string) => {
    alert(`[행정 명령 발송] ${memberName}실 측에 "${title}" 소명서 제출 강제 독촉 명령서가 등기 및 핫라인으로 공식 전달되었습니다.`);
  };

  // 소명 질문 상태 업데이트 핸들러
  const handleUpdateQuestionStatus = (questionId: string, nextStatus: PublicQuestion['status']) => {
    const updated = questions.map((q) => {
      if (q.id === questionId) {
        return { ...q, status: nextStatus };
      }
      return q;
    });
    setQuestions(updated);
    
    localStorage.setItem('user_questions', JSON.stringify(updated.filter(q => q.id.startsWith('user_') || q.id.startsWith('q_'))));
    alert(`[직권 조율 완료] 소명서 ID: ${questionId}의 상태가 "${nextStatus}" 상태로 강제 변경되었습니다.`);
  };

  // 시민 제안 상태 강제 조율
  const handleUpdateProposalStatus = (proposalId: string, nextStatus: BillProposal['status']) => {
    const updated = proposals.map((p) => {
      if (p.id === proposalId) {
        return { ...p, status: nextStatus };
      }
      return p;
    });
    setProposals(updated);
    localStorage.setItem('user_proposals', JSON.stringify(updated));
    alert(`[입법 단계 승격] 제안서 ID: ${proposalId}의 심사 단계가 "${nextStatus}" 단계로 갱신되었습니다.`);
  };

  // 시민 제안 전문가 피드백 추가
  const handleAddProposalFeedback = (proposalId: string, feedback: string) => {
    if (!feedback.trim()) return;
    const updated = proposals.map((p) => {
      if (p.id === proposalId) {
        return { ...p, amendmentFeedback: feedback, status: 'needs_amendment' as const };
      }
      return p;
    });
    setProposals(updated);
    localStorage.setItem('user_proposals', JSON.stringify(updated));
    alert(`[행정 수정 권고] 제안자 측에 전문가 권고 피드백을 전달하여 "수정보완 필요" 상태로 이관했습니다.`);
  };

  // 팩트체크 판정 직권 조정
  const handleUpdateVerdict = (factcheckId: string, verdict: FactCheck['verdict']) => {
    const updated = factchecks.map((fc) => {
      if (fc.id === factcheckId) {
        return { ...fc, verdict: verdict };
      }
      return fc;
    });
    setFactchecks(updated);
    localStorage.setItem('user_factchecks', JSON.stringify(updated));
    alert(`[결론 조정 완료] 해당 팩트체크의 직권 판정 결론이 "${verdict}" 상태로 조정되었습니다.`);
  };

  // 키워드 필터링 사전 조작
  const handleAddBadWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;
    if (badWords.includes(newWord.trim())) {
      alert('이미 등록된 차단 키워드입니다.');
      return;
    }
    const updated = [...badWords, newWord.trim()];
    setBadWords(updated);
    localStorage.setItem('admin_bad_words', JSON.stringify(updated));
    setNewWord('');
    alert(`[키워드 사전에 신규 등록] "${newWord.trim()}" 단어가 유해 표현 감지 사전에 영구 등록되었습니다.`);
  };

  const handleRemoveBadWord = (word: string) => {
    const updated = badWords.filter((w) => w !== word);
    setBadWords(updated);
    localStorage.setItem('admin_bad_words', JSON.stringify(updated));
  };

  // 접근 제한 스크린 렌더링
  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        🛡️ 시스템 관리 권한 확인 중...
      </div>
    );
  }

  if (!userSession || userSession.trustLevel < 10) {
    return (
      <div className="max-w-[550px] my-20 mx-auto p-9 rounded-lg bg-secondary border border-danger/30 text-center shadow-lg flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center text-3xl text-danger border border-danger/20">
          🛡️
        </div>
        <h2 className="text-lg font-extrabold text-foreground m-0">
          통합 통제 관리자 권한 상실
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed m-0">
          이 공간은 신뢰 등급 <strong className="text-danger">10 (서비스운영자_마스터)</strong> 이상의
          관리 세션 권한을 요구하는 하드 통제 영역입니다.<br />
          비인가 사용자의 불법 접근 시도는 로그에 영구 보존됩니다.
        </p>
        <Link href="/" className="btn-secondary px-6 py-3 text-sm font-extrabold">
          메인 플랫폼으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-[1100px] mx-auto">
      
      {/* 관리자 헤더 */}
      <div className="flex justify-between items-start border-b border-border pb-5 mb-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-extrabold text-foreground m-0 flex items-center gap-2">
            🛠️ 국민소환제 통합 관리자 통제 데스크
          </h2>
          <span className="text-sm text-muted-foreground">
            플랫폼 전체 행정 처리, 의정 SLA 경보, 팩트체크 결론 조율 및 자동 감정 필터링을 집권 통제하는 마스터 허브입니다.
          </span>
        </div>
        <div className="text-right flex flex-col gap-1">
          <span className="text-sm font-extrabold text-accent">🔒 마스터 세션 인증됨</span>
          <span className="text-xs text-muted-foreground">운영자명: {userSession.displayName}</span>
        </div>
      </div>

      {/* 5대 코어 통제 탭 스위치 */}
      <div className="flex gap-1 border-b border-border-2 mb-6 bg-secondary p-1 rounded-sm">
        {[
          { id: 'dashboard', label: '📊 종합 SLA 통제' },
          { id: 'questions', label: '🚨 소명 요구 강제조율' },
          { id: 'proposals', label: '🏛️ 입법안 진급통제' },
          { id: 'factchecks', label: '⚖️ 팩트체크 오인조정' },
          { id: 'sentiment', label: '🚫 감정/유해어 사전' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-2 text-[11.5px] rounded-sm cursor-pointer transition-all duration-150 flex items-center justify-center gap-2 ${
                isActive 
                  ? 'font-extrabold text-accent bg-accent/10 border-none' 
                  : 'font-medium text-muted-foreground bg-transparent border-none'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* Tab A. 대시보드 (종합 SLA 통제) */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <div className="flex flex-col gap-6 fade-in">
          
          {/* 주요 통계 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { title: '총 공개 질의', value: `${questions.length}건`, sub: '소명 완료율 64%' },
              { title: '시민 입법안', value: `${proposals.length}건`, sub: '헌법 검토 2건 완료' },
              { title: '팩트체크 건수', value: `${factchecks.length}건`, sub: '직권 조정률 12%' },
              { title: '필터 키워드 사전', value: `${badWords.length}개`, sub: '자동 필터링 상시 가동' }
            ].map((stat, idx) => (
              <div key={idx} className="card-base p-5 bg-card">
                <span className="text-sm text-muted-foreground">{stat.title}</span>
                <h3 className="text-xl font-extrabold text-accent my-2 font-mono">{stat.value}</h3>
                <span className="text-xs text-muted-foreground">{stat.sub}</span>
              </div>
            ))}
          </div>

          {/* 답변 SLA 초과 의원 경보 목록 */}
          <div className="card-base p-6 border border-danger/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm">⚠️</span>
              <h3 className="text-sm font-extrabold text-danger m-0">
                답변 의무 기한(SLA) 경과 의원 자동 통제
              </h3>
            </div>
            
            <p className="text-[11.5px] text-muted-foreground leading-relaxed mb-5">
              시민 소명 요구 질의서가 접수된 후 14일의 답변 유예 기간(SLA)이 경과하였음에도 성명 조명 답변을 제출하지 않은 국회의원 목록입니다.
              마스터 관리자 직권으로 독촉 경보를 강제 발송하거나 플랫폼 공약 평점 감점을 내릴 수 있습니다.
            </p>

            <div className="flex flex-col gap-3">
              {slaAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="bg-danger/5 border border-danger/15 rounded-sm p-4 flex justify-between items-center"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-extrabold text-foreground">
                      🚨 {alert.memberName} (답변 {alert.daysOver}일 초과 체납)
                    </span>
                    <span className="text-sm text-muted-foreground">
                      질의건: &quot;{alert.questionTitle}&quot;
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTriggerSlaReminder(alert.memberName, alert.questionTitle)}
                      className="px-3 py-3 bg-danger text-secondary border-none rounded-sm text-xs font-extrabold cursor-pointer transition-colors hover:bg-danger/80"
                    >
                      ⚡ 직권 독촉장 발송
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* Tab B. 소명 요구 강제 조율 */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'questions' && (
        <div className="flex flex-col gap-5 fade-in">
          <div className="card-base p-5">
            <h3 className="text-sm font-extrabold text-foreground mb-2 m-0">
              🏛️ 소명 요구서 및 공개 질의 행정 직권 조율
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed m-0">
              특정 악의적인 질의 혹은 사실과 다른 질의를 기각하거나, 의원실 소명 결과를 임의로 행정 강제 조율하는 탭입니다.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {questions.map((q) => (
              <div
                key={q.id}
                className="bg-card border border-border-2 rounded-sm p-5 flex flex-col gap-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-muted-foreground">
                    질의코드: {q.questionCode} | 의원: {q.targetMember} ({q.targetMemberId})
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">현재 상태:</span>
                    <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded border ${
                      q.status === 'answered' 
                        ? 'bg-success/10 text-success border-success/20' 
                        : q.status === 'closed' 
                          ? 'bg-foreground/5 text-muted-foreground border-border' 
                          : 'bg-warning/10 text-warning border-warning/20'
                    }`}>
                      {q.status === 'answered' ? '소명 완료' : q.status === 'closed' ? '기각/종결' : q.status === 'open' ? '대기 중' : '이의 신청'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <strong className="text-base text-foreground">{q.title}</strong>
                  <p className="text-sm text-muted-foreground m-0 leading-snug">
                    {q.content}
                  </p>
                </div>

                <hr className="border-none border-t border-dashed border-border my-1" />

                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">작성자: {q.authorName} | 투표수: {q.voteCount}회</span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateQuestionStatus(q.id, 'answered')}
                      className="px-3 py-3 bg-success/10 text-success border border-success/20 rounded-sm text-xs font-extrabold cursor-pointer hover:bg-success/20 transition-colors"
                    >
                      🟢 소명강제승인
                    </button>
                    <button
                      onClick={() => handleUpdateQuestionStatus(q.id, 'closed')}
                      className="px-3 py-3 bg-secondary text-muted-foreground border border-border rounded-sm text-xs font-bold cursor-pointer hover:bg-card transition-colors"
                    >
                      ⚪ 반려/기각
                    </button>
                    <button
                      onClick={() => handleUpdateQuestionStatus(q.id, 'disputed')}
                      className="px-3 py-3 bg-danger/10 text-danger border border-danger/20 rounded-sm text-xs font-extrabold cursor-pointer hover:bg-danger/20 transition-colors"
                    >
                      🔴 이의지정
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* Tab C. 입법안 진급 통제 */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'proposals' && (
        <div className="flex flex-col gap-5 fade-in">
          <div className="card-base p-5">
            <h3 className="text-sm font-extrabold text-foreground mb-2 m-0">
              🏛️ 시민 입법 제안 단계 통제 및 권고
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed m-0">
              시민 발의 입법 제안서의 의결 상태를 강제 조정하고, 헌법자문위원회를 대신하여 법률 검토 수정 권고 피드백을 직접 입력하여 반영할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {proposals.map((p) => {
              const statusMap: Record<string, string> = {
                draft: '초안',
                community_review: '시민 토론 중',
                legal_review: '헌법 검토 중',
                finalized: '국회 정식 발의 완료',
                needs_amendment: '수정보완 권고'
              };
              return (
                <div
                  key={p.id}
                  className="bg-card border border-border-2 rounded-sm p-6 flex flex-col gap-5"
                >
                  <div className="flex justify-between items-center">
                    <strong className="text-sm text-foreground">{p.title}</strong>
                    <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                      {statusMap[p.status] || p.status}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 text-[11.5px] text-muted-foreground">
                    <div><strong className="text-foreground">제안 취지:</strong> {p.purpose}</div>
                    <div><strong className="text-foreground">배경 상황:</strong> {p.background}</div>
                    {p.amendmentFeedback && (
                      <div className="mt-1.5 px-3 py-2 bg-warning/5 border-l-[3px] border-warning text-sm text-muted-foreground">
                        <strong className="text-foreground">📝 관리자 수정 권고 내용:</strong> {p.amendmentFeedback}
                      </div>
                    )}
                  </div>

                  <hr className="border-none border-t border-border my-1" />

                  {/* 승급 및 반려 권고 액션 패널 */}
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2 items-center">
                      <span className="text-[10.5px] text-muted-foreground font-extrabold">단계 강제 이관:</span>
                      <button
                        onClick={() => handleUpdateProposalStatus(p.id, 'community_review')}
                        className="btn-secondary px-2.5 py-1 text-[9.5px]"
                      >
                        시민토론이관
                      </button>
                      <button
                        onClick={() => handleUpdateProposalStatus(p.id, 'legal_review')}
                        className="btn-secondary px-2.5 py-1 text-[9.5px]"
                      >
                        헌법검토이관
                      </button>
                      <button
                        onClick={() => handleUpdateProposalStatus(p.id, 'finalized')}
                        className="btn-accent px-2.5 py-1 text-[9.5px]"
                      >
                        👑 국회 정식의결
                      </button>
                    </div>

                    <div className="flex gap-2 items-center">
                      <span className="text-[10.5px] text-muted-foreground font-extrabold shrink-0">행정 수정권고 발송:</span>
                      <input
                        type="text"
                        placeholder="이 입법안을 수정보완 필요 단계로 보류하고 제안자에게 보낼 검토 권고안을 입력하세요."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddProposalFeedback(p.id, e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                        className="flex-1 px-2.5 py-3 text-xs bg-background border border-border rounded-sm text-foreground outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* Tab D. 팩트체크 조정 */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'factchecks' && (
        <div className="flex flex-col gap-5 fade-in">
          <div className="card-base p-5">
            <h3 className="text-sm font-extrabold text-foreground mb-2 m-0">
              ⚖️ 시민 교차 팩트체크 오인 판정 결론 조정
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed m-0">
              집단지성에 의해 왜곡된 다수결 판정을 검증된 팩트기록과 연계하여, 관리자 직권으로 팩트체크 공식 판결 결론을 변경하고 공시하는 조치 창구입니다.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {factchecks.map((fc) => {
              const verdictMap: Record<string, { label: string; color: string }> = {
                true: { label: '진실', color: 'text-success' },
                mostly_true: { label: '대체로 진실', color: 'text-success' },
                half_true: { label: '절반의 진실', color: 'text-warning' },
                mostly_false: { label: '대체로 거짓', color: 'text-danger' },
                false: { label: '거짓', color: 'text-danger' }
              };
              const currentInfo = verdictMap[fc.verdict] || { label: fc.verdict, color: 'text-muted-foreground' };
              return (
                <div
                  key={fc.id}
                  className="bg-card border border-border-2 rounded-sm p-5 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-bold">작성자: {fc.authorName}</span>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-muted-foreground">판정 결론:</span>
                      <strong className={`text-sm ${currentInfo.color}`}>
                        {currentInfo.label}
                      </strong>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <h4 className="text-[12.5px] font-extrabold text-foreground m-0">
                      🔍 대상 주장: &quot;{fc.claim}&quot;
                    </h4>
                    <p className="text-sm text-muted-foreground m-0 leading-relaxed">
                      <strong className="text-foreground">교차 근거:</strong> {fc.evidence}
                    </p>
                  </div>

                  <hr className="border-none border-t border-border my-1" />

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">평가단 신뢰 추천: {fc.verifiedCount}건 | 이의제기: {fc.needsReviewCount}건</span>
                    
                    <div className="flex gap-1 items-center">
                      <span className="text-[9.5px] text-muted-foreground mr-1">결론 조정:</span>
                      {(['true', 'mostly_true', 'half_true', 'mostly_false', 'false'] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => handleUpdateVerdict(fc.id, v)}
                          className={`px-2 py-1 text-xs rounded-sm cursor-pointer border transition-colors ${
                            fc.verdict === v 
                              ? 'font-extrabold bg-accent/10 text-accent border-accent/20' 
                              : 'font-medium bg-secondary text-muted-foreground border-border hover:bg-card'
                          }`}
                        >
                          {verdictMap[v].label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* Tab E. 감정 필터링 & 유해어 사전 */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'sentiment' && (
        <div className="flex flex-col gap-5 fade-in">
          
          <div className="card-base p-6">
            <h3 className="text-sm font-extrabold text-foreground mb-2 m-0">
              🚫 자동 악성 감정 표현 차단 키워드 관리 사전
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              공개 질문서, 법안 토론 댓글, 시민 제안 내 부적절한 공격 행위, 비방, 편향 왜곡 표현을 사전에 자동 차단 및 마스킹하기 위한 규칙 사전입니다.
            </p>

            <form onSubmit={handleAddBadWord} className="flex gap-2.5 mb-6">
              <input
                type="text"
                maxLength={20}
                placeholder="새로운 차단 키워드 추가 (예: 독재자, 적폐)"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                className="flex-1 px-5 py-3 text-[11.5px] bg-background border border-border rounded-sm text-foreground outline-none focus:border-accent"
              />
              <button type="submit" className="btn-accent px-5 py-3 text-[11.5px] font-extrabold">
                차단 단어 추가
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {badWords.map((word) => (
                <div
                  key={word}
                  className="flex items-center gap-2 px-3 py-3 bg-card border border-border-2 rounded-full text-sm text-muted-foreground"
                >
                  <span>🚫 {word}</span>
                  <button
                    onClick={() => handleRemoveBadWord(word)}
                    className="border-none bg-transparent text-danger text-sm cursor-pointer font-bold p-0 hover:text-danger/80"
                    title="단어 제거"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 신고 접수 모니터링 모의 로그 */}
          <div className="card-base p-6">
            <h3 className="text-sm font-extrabold text-foreground mb-4 m-0">
              📢 실시간 시민 유해 보고 로그 (신고 접수)
            </h3>
            
            <div className="flex flex-col gap-2 text-sm font-mono">
              <div className="bg-card px-5 py-3 rounded-sm border-l-[3px] border-danger flex justify-between">
                <span className="text-muted-foreground">[🚨 신고] 법안 토론 #12 댓글 내 비하 단어 감지됨 (작성자: u_guest)</span>
                <span className="text-muted-foreground/50">1분 전</span>
              </div>
              <div className="bg-card px-5 py-3 rounded-sm border-l-[3px] border-warning flex justify-between">
                <span className="text-muted-foreground">[⚠️ 경고] 질의서 #q4 AI 유해성 스코어 임계치(0.75) 근접 통과</span>
                <span className="text-muted-foreground/50">14분 전</span>
              </div>
              <div className="bg-card px-5 py-3 rounded-sm border-l-[3px] border-success flex justify-between">
                <span className="text-muted-foreground">[🟢 정상] 퀴즈 필터링 키워드 사전 매칭 0건 - 정상 게시 완료</span>
                <span className="text-muted-foreground/50">38분 전</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
