'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PublicQuestion, BillProposal, FactCheck, Member } from '@/lib/types';
import { MOCK_MEMBERS, MOCK_QUESTIONS } from '@/lib/mock-data';

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
      setLoading(false);

      // 2. 공개 질문 리스트 로딩 및 모의 데이터 병합
      const savedQuestions = localStorage.getItem('user_questions');
      let qList = [...MOCK_QUESTIONS];
      if (savedQuestions) {
        try {
          const parsed = JSON.parse(savedQuestions) as PublicQuestion[];
          qList = [...qList, ...parsed];
        } catch (e) {
          console.error(e);
        }
      }
      setQuestions(qList);

      // 3. 시민 입법 제안 리스트 로딩
      const savedProposals = localStorage.getItem('user_proposals');
      let pList: BillProposal[] = [];
      if (savedProposals) {
        try {
          pList = JSON.parse(savedProposals);
        } catch (e) {
          console.error(e);
        }
      } else {
        // 기본 모의 시민 제안 데이터셋
        pList = [
          {
            id: 'prop_mock_1',
            title: '대중교통 청년 요금 50% 의무 감면법',
            purpose: '청년 주거지 외곽 밀려남에 따른 교통 부담 극복 지원',
            background: '수도권 청년의 교통비가 가계 소득의 15% 이상을 차지하고 있음.',
            diffData: [
              { type: 'added', text: '제1조 청년 대중교통 요금 감면 의무화' },
              { type: 'added', text: '국가 및 지방자치단체는 19세 이상 34세 이하 청년에게 대중교통 이용 요금의 100분의 50을 의무적으로 감면해야 한다.' }
            ],
            status: 'community_review',
            authorName: '시민A',
            createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
            upvoteCount: 28,
            versions: [],
            legalOpinions: []
          },
          {
            id: 'prop_mock_2',
            title: '딥페이크 아동 성착취물 제작 강제 처벌 강화법안',
            purpose: 'AI 기술을 악용한 디지털 성범죄 처벌 수위 극대화',
            background: '기술 발전에 비해 법적 처벌 한도가 낮아 피해 예방 효과가 부족함.',
            diffData: [
              { type: 'added', text: '제3조 딥페이크 성착취물 유포죄 신설' }
            ],
            status: 'legal_review',
            authorName: '법안수호자',
            createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
            upvoteCount: 154,
            versions: [],
            legalOpinions: [
              { id: 'op_1', authorName: '헌법학_김변호사', rating: 'constitutional', comment: '위헌 소지가 없으며, 즉각적인 형량 보완책으로 우수함.', createdAt: new Date().toISOString() }
            ]
          }
        ];
        localStorage.setItem('user_proposals', JSON.stringify(pList));
      }
      setProposals(pList);

      // 4. 팩트체크 리스트 로딩
      const savedFactchecks = localStorage.getItem('user_factchecks');
      let fList: FactCheck[] = [];
      if (savedFactchecks) {
        try {
          fList = JSON.parse(savedFactchecks);
        } catch (e) {
          console.error(e);
        }
      } else {
        fList = [
          {
            id: 'fc_mock_1',
            claim: 'A의원이 발의한 교통 안전 법안이 오히려 어린이보호구역 안전예산을 삭감했다.',
            evidence: '2026년 국회 예산안 상 어린이보호구역 관련 예산은 전년 대비 12% 증액 편성이 완료되었으며, 삭감 주장은 명백한 허위 사실입니다.',
            verdict: 'false',
            sourceUrls: ['https://www.assembly.go.kr/budget/2026'],
            verifiedCount: 12,
            needsReviewCount: 1,
            authorName: '검증시민단',
            createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
          },
          {
            id: 'fc_mock_2',
            claim: 'B정당 대변인의 "청년 실업률 역대 최고" 발언은 통계와 일치한다.',
            evidence: '통계청 2026년 4월 고용동향 기준 청년 실업률은 5.8%로 전년 동기 대비 소폭 하락하였으나, 체감 실업률(확장실업률)은 18.2%로 고공 행진 중이므로 사실 관계가 절반 가량 혼재되어 있습니다.',
            verdict: 'half_true',
            sourceUrls: ['https://kostat.go.kr/employment'],
            verifiedCount: 8,
            needsReviewCount: 2,
            authorName: '팩트파인더',
            createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
          }
        ];
        localStorage.setItem('user_factchecks', JSON.stringify(fList));
      }
      setFactchecks(fList);

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
    
    // 로컬 스토리지 업데이트 (user_questions와 mock 데이터는 합쳐져 있으므로 분리 보관 처리해야 하나, 여기서는 편의상 통합 저장)
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
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-3)' }}>
        🛡️ 시스템 관리 권한 확인 중...
      </div>
    );
  }

  if (!userSession || userSession.trustLevel < 10) {
    return (
      <div style={{
        maxWidth: '550px',
        margin: '80px auto',
        padding: '36px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-2)',
        border: '1px solid var(--danger)30',
        textAlign: 'center',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
          fontSize: '32px', color: 'var(--danger)', border: '1px solid var(--danger)20'
        }}>
          🛡️
        </div>
        <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 900, color: 'var(--text-1)', margin: 0 }}>
          통합 통제 관리자 권한 상실
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.6, margin: 0 }}>
          이 공간은 신뢰 등급 <strong style={{ color: 'var(--danger)' }}>10 (서비스운영자_마스터)</strong> 이상의
          관리 세션 권한을 요구하는 하드 통제 영역입니다.<br />
          비인가 사용자의 불법 접근 시도는 로그에 영구 보존됩니다.
        </p>
        <Link href="/" className="btn-secondary" style={{ padding: '10px 24px', textDecoration: 'none', fontSize: '11px', fontWeight: 800 }}>
          메인 플랫폼으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* 관리자 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '20px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 950, color: 'var(--text-1)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🛠️ 국민소환제 통합 관리자 통제 데스크
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
            플랫폼 전체 행정 처리, 의정 SLA 경보, 팩트체크 결론 조율 및 자동 감정 필터링을 집권 통제하는 마스터 허브입니다.
          </span>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)' }}>🔒 마스터 세션 인증됨</span>
          <span style={{ fontSize: '10px', color: 'var(--text-4)' }}>운영자명: {userSession.displayName}</span>
        </div>
      </div>

      {/* 5대 코어 통제 탭 스위치 */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '1px solid var(--border-2)',
        marginBottom: '24px',
        backgroundColor: 'var(--bg-2)',
        padding: '4px',
        borderRadius: 'var(--radius-sm)'
      }}>
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
              style={{
                flex: 1,
                padding: '12px 8px',
                fontSize: '11.5px',
                fontWeight: isActive ? 800 : 500,
                color: isActive ? 'var(--accent)' : 'var(--text-2)',
                backgroundColor: isActive ? 'var(--accent-bg)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="fade-in">
          
          {/* 주요 통계 카드 그리드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { title: '총 공개 질의', value: `${questions.length}건`, sub: '소명 완료율 64%' },
              { title: '시민 입법안', value: `${proposals.length}건`, sub: '헌법 검토 2건 완료' },
              { title: '팩트체크 건수', value: `${factchecks.length}건`, sub: '직권 조정률 12%' },
              { title: '필터 키워드 사전', value: `${badWords.length}개`, sub: '자동 필터링 상시 가동' }
            ].map((stat, idx) => (
              <div key={idx} className="card-base" style={{ padding: '20px', backgroundColor: 'var(--bg-3)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{stat.title}</span>
                <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 950, color: 'var(--accent)', margin: '8px 0 4px 0', fontFamily: 'var(--font-mono)' }}>{stat.value}</h3>
                <span style={{ fontSize: '10px', color: 'var(--text-4)' }}>{stat.sub}</span>
              </div>
            ))}
          </div>

          {/* 답변 SLA 초과 의원 경보 목록 */}
          <div className="card-base" style={{ padding: '24px', border: '1px solid var(--danger)20' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px' }}>⚠️</span>
              <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: 'var(--danger)', margin: 0 }}>
                답변 의무 기한(SLA) 경과 의원 자동 통제
              </h3>
            </div>
            
            <p style={{ fontSize: '11.5px', color: 'var(--text-3)', lineHeight: 1.5, marginBottom: '20px' }}>
              시민 소명 요구 질의서가 접수된 후 14일의 답변 유예 기간(SLA)이 경과하였음에도 성명 조명 답변을 제출하지 않은 국회의원 목록입니다.
              마스터 관리자 직권으로 독촉 경보를 강제 발송하거나 플랫폼 공약 평점 감점을 내릴 수 있습니다.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {slaAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.04)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-1)' }}>
                      🚨 {alert.memberName} (답변 {alert.daysOver}일 초과 체납)
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                      질의건: &quot;{alert.questionTitle}&quot;
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleTriggerSlaReminder(alert.memberName, alert.questionTitle)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--danger)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
          <div className="card-base" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '8px', margin: 0 }}>
              🏛️ 소명 요구서 및 공개 질의 행정 직권 조율
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.5, margin: 0 }}>
              특정 악의적인 질의 혹은 사실과 다른 질의를 기각하거나, 의원실 소명 결과를 임의로 행정 강제 조율하는 탭입니다.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {questions.map((q) => (
              <div
                key={q.id}
                style={{
                  backgroundColor: 'var(--bg-3)',
                  border: '1px solid var(--border-2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
                    질의코드: {q.questionCode} | 의원: {q.targetMember} ({q.targetMemberId})
                  </span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-4)' }}>현재 상태:</span>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: q.status === 'answered' ? 'rgba(16, 185, 129, 0.08)' : q.status === 'closed' ? 'rgba(115, 115, 115, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                      color: q.status === 'answered' ? 'var(--success)' : q.status === 'closed' ? 'var(--text-3)' : 'var(--warning)',
                      border: '1px solid var(--border)'
                    }}>
                      {q.status === 'answered' ? '소명 완료' : q.status === 'closed' ? '기각/종결' : q.status === 'open' ? '대기 중' : '이의 신청'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--text-1)' }}>{q.title}</strong>
                  <p style={{ fontSize: '11px', color: 'var(--text-2)', margin: 0, lineHeight: 1.4 }}>
                    {q.content}
                  </p>
                </div>

                <hr style={{ border: 'none', borderTop: '1px dashed var(--border)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-4)' }}>작성자: {q.authorName} | 투표수: {q.voteCount}회</span>
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleUpdateQuestionStatus(q.id, 'answered')}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        color: 'var(--success)',
                        border: '1px solid var(--success)20',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      🟢 소명강제승인
                    </button>
                    <button
                      onClick={() => handleUpdateQuestionStatus(q.id, 'closed')}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--bg-2)',
                        color: 'var(--text-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ⚪ 반려/기각
                    </button>
                    <button
                      onClick={() => handleUpdateQuestionStatus(q.id, 'disputed')}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger)',
                        border: '1px solid var(--danger)20',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
          <div className="card-base" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '8px', margin: 0 }}>
              🏛️ 시민 입법 제안 단계 통제 및 권고
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.5, margin: 0 }}>
              시민 발의 입법 제안서의 의결 상태를 강제 조정하고, 헌법자문위원회를 대신하여 법률 검토 수정 권고 피드백을 직접 입력하여 반영할 수 있습니다.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  style={{
                    backgroundColor: 'var(--bg-3)',
                    border: '1px solid var(--border-2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--text-1)' }}>{p.title}</strong>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--accent-bg)',
                      color: 'var(--accent)',
                      border: '1px solid var(--accent-border)'
                    }}>
                      {statusMap[p.status] || p.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px', color: 'var(--text-2)' }}>
                    <div><strong>제안 취지:</strong> {p.purpose}</div>
                    <div><strong>배경 상황:</strong> {p.background}</div>
                    {p.amendmentFeedback && (
                      <div style={{
                        marginTop: '6px',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(245, 158, 11, 0.04)',
                        borderLeft: '3px solid var(--warning)',
                        fontSize: '11px',
                        color: 'var(--text-2)'
                      }}>
                        <strong>📝 관리자 수정 권고 내용:</strong> {p.amendmentFeedback}
                      </div>
                    )}
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

                  {/* 승급 및 반려 권고 액션 패널 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-3)', fontWeight: 800 }}>단계 강제 이관:</span>
                      <button
                        onClick={() => handleUpdateProposalStatus(p.id, 'community_review')}
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '9.5px' }}
                      >
                        시민토론이관
                      </button>
                      <button
                        onClick={() => handleUpdateProposalStatus(p.id, 'legal_review')}
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '9.5px' }}
                      >
                        헌법검토이관
                      </button>
                      <button
                        onClick={() => handleUpdateProposalStatus(p.id, 'finalized')}
                        className="btn-accent"
                        style={{ padding: '4px 10px', fontSize: '9.5px' }}
                      >
                        👑 국회 정식의결
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-3)', fontWeight: 800 }}>행정 수정권고 발송:</span>
                      <input
                        type="text"
                        placeholder="이 입법안을 수정보완 필요 단계로 보류하고 제안자에게 보낼 검토 권고안을 입력하세요."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddProposalFeedback(p.id, e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          fontSize: '10px',
                          backgroundColor: 'var(--bg)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-1)',
                          outline: 'none'
                        }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
          <div className="card-base" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '8px', margin: 0 }}>
              ⚖️ 시민 교차 팩트체크 오인 판정 결론 조정
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.5, margin: 0 }}>
              집단지성에 의해 왜곡된 다수결 판정을 검증된 팩트기록과 연계하여, 관리자 직권으로 팩트체크 공식 판결 결론을 변경하고 공시하는 조치 창구입니다.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {factchecks.map((fc) => {
              const verdictMap: Record<string, { label: string; color: string }> = {
                true: { label: '진실', color: 'var(--success)' },
                mostly_true: { label: '대체로 진실', color: 'var(--success)' },
                half_true: { label: '절반의 진실', color: 'var(--warning)' },
                mostly_false: { label: '대체로 거짓', color: 'var(--danger)' },
                false: { label: '거짓', color: 'var(--danger)' }
              };
              const currentInfo = verdictMap[fc.verdict] || { label: fc.verdict, color: 'var(--text-2)' };
              return (
                <div
                  key={fc.id}
                  style={{
                    backgroundColor: 'var(--bg-3)',
                    border: '1px solid var(--border-2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 700 }}>작성자: {fc.authorName}</span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-4)' }}>판정 결론:</span>
                      <strong style={{ fontSize: '11px', color: currentInfo.color }}>
                        {currentInfo.label}
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <h4 style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
                      🔍 대상 주장: &quot;{fc.claim}&quot;
                    </h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
                      <strong>교차 근거:</strong> {fc.evidence}
                    </p>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-4)' }}>평가단 신뢰 추천: {fc.verifiedCount}건 | 이의제기: {fc.needsReviewCount}건</span>
                    
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '9.5px', color: 'var(--text-3)', marginRight: '4px' }}>결론 조정:</span>
                      {(['true', 'mostly_true', 'half_true', 'mostly_false', 'false'] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => handleUpdateVerdict(fc.id, v)}
                          style={{
                            padding: '3px 8px',
                            fontSize: '9px',
                            fontWeight: fc.verdict === v ? 800 : 500,
                            backgroundColor: fc.verdict === v ? 'var(--accent-bg)' : 'var(--bg-2)',
                            color: fc.verdict === v ? 'var(--accent)' : 'var(--text-3)',
                            border: '1px solid var(--border)',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
          
          <div className="card-base" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '8px', margin: 0 }}>
              🚫 자동 악성 감정 표현 차단 키워드 관리 사전
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.5, marginBottom: '20px' }}>
              공개 질문서, 법안 토론 댓글, 시민 제안 내 부적절한 공격 행위, 비방, 편향 왜곡 표현을 사전에 자동 차단 및 마스킹하기 위한 규칙 사전입니다.
            </p>

            <form onSubmit={handleAddBadWord} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <input
                type="text"
                maxLength={20}
                placeholder="새로운 차단 키워드 추가 (예: 독재자, 적폐)"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  fontSize: '11.5px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-1)',
                  outline: 'none'
                }}
              />
              <button type="submit" className="btn-accent" style={{ padding: '10px 20px', fontSize: '11.5px', fontWeight: 800 }}>
                차단 단어 추가
              </button>
            </form>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {badWords.map((word) => (
                <div
                  key={word}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: 'var(--bg-3)',
                    border: '1px solid var(--border-2)',
                    borderRadius: '20px',
                    fontSize: '11px',
                    color: 'var(--text-2)'
                  }}
                >
                  <span>🚫 {word}</span>
                  <button
                    onClick={() => handleRemoveBadWord(word)}
                    style={{
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--danger)',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      padding: 0
                    }}
                    title="단어 제거"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 신고 접수 모니터링 모의 로그 */}
          <div className="card-base" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '16px', margin: 0 }}>
              📢 실시간 시민 유해 보고 로그 (신고 접수)
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              <div style={{ backgroundColor: 'var(--bg-3)', padding: '10px 14px', borderRadius: '4px', borderLeft: '3px solid var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-2)' }}>[🚨 신고] 법안 토론 #12 댓글 내 비하 단어 감지됨 (작성자: u_guest)</span>
                <span style={{ color: 'var(--text-4)' }}>1분 전</span>
              </div>
              <div style={{ backgroundColor: 'var(--bg-3)', padding: '10px 14px', borderRadius: '4px', borderLeft: '3px solid var(--warning)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-2)' }}>[⚠️ 경고] 질의서 #q4 AI 유해성 스코어 임계치(0.75) 근접 통과</span>
                <span style={{ color: 'var(--text-4)' }}>14분 전</span>
              </div>
              <div style={{ backgroundColor: 'var(--bg-3)', padding: '10px 14px', borderRadius: '4px', borderLeft: '3px solid var(--success)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-2)' }}>[🟢 정상] 퀴즈 필터링 키워드 사전 매칭 0건 - 정상 게시 완료</span>
                <span style={{ color: 'var(--text-4)' }}>38분 전</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
