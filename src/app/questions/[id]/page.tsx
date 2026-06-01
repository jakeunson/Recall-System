'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { MOCK_QUESTIONS } from '@/lib/mock-data';
import { PublicQuestion } from '@/lib/types';
import SLAIndicator from '@/components/SLAIndicator';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PublicQuestionDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const questionId = resolvedParams.id;

  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  
  // 국회의원 답변 입력 폼 상태 (체험용)
  const [answerText, setAnswerText] = useState('');
  const [userRole, setUserRole] = useState('citizen');
  const [userSession, setUserSession] = useState<{ id: string; displayName: string; trustLevel: number } | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  // 연명 서명자 목록 (기본 시뮬레이션용 데이터)
  const [signatures, setSignatures] = useState<string[]>(['시민_이강인', '시민_정우영', '시민_황희찬']);
  const [newSignature, setNewSignature] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('user_role') || 'citizen';
      setTimeout(() => {
        setUserRole(savedRole);
      }, 0);

      const savedSession = localStorage.getItem('user_session');
      if (savedSession) {
        try {
          setUserSession(JSON.parse(savedSession));
        } catch {
          // ignore
        }
      }
      setSessionLoaded(true);

      let found: PublicQuestion | undefined = MOCK_QUESTIONS.find((q) => q.id === questionId);
      
      const savedQuestions = localStorage.getItem('user_questions');
      if (savedQuestions) {
        try {
          const parsed = JSON.parse(savedQuestions) as PublicQuestion[];
          const localFound = parsed.find((q) => q.id === questionId);
          if (localFound) found = localFound;
        } catch {
          // ignore
        }
      }

      if (found) {
        const f = found;
        setTimeout(() => {
          setQuestion(f);
        }, 0);
      }
    }
  }, [questionId]);

  // 서명 동의 추가
  const handleAddSignature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSignature.trim()) return;

    if (signatures.includes(newSignature.trim())) {
      alert('이미 공동 서명에 참여하셨습니다.');
      return;
    }

    setSignatures([...signatures, newSignature.trim()]);
    setNewSignature('');
    
    // 질의 요구 투표수 가산
    if (question) {
      const updated = { ...question, voteCount: question.voteCount + 1 };
      setQuestion(updated);
      saveQuestionToLocalStorage(updated);
    }
  };

  // 국회의원 답변 공식 등재
  const handleLawmakerSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;

    if (!answerText.trim() || answerText.length < 15) {
      alert('공식 답변 소명서는 최소 15자 이상 신중하고 성실하게 작성해 주셔야 접수됩니다.');
      return;
    }

    const updated: PublicQuestion = {
      ...question,
      status: 'answered',
      content: `${question.content}\n\n[📢 의원실 공식 소명 답변서]\n${answerText.trim()}`
    };

    setQuestion(updated);
    saveQuestionToLocalStorage(updated);
    setAnswerText('');
    alert('소명 답변서가 공식 등재되었습니다. 마감 기한 타이머가 안전하게 해제되었습니다.');
  };

  // 로컬스토리지 저장 유틸
  const saveQuestionToLocalStorage = (updated: PublicQuestion) => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_questions');
      const list: PublicQuestion[] = saved ? JSON.parse(saved) : [];
      
      const idx = list.findIndex(q => q.id === updated.id);
      if (idx !== -1) {
        list[idx] = updated;
      } else {
        list.push(updated);
      }
      localStorage.setItem('user_questions', JSON.stringify(list));
    }
  };

  if (!question) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-1)', marginBottom: '16px' }}>질의서를 찾을 수 없습니다.</h2>
        <Link href="/questions" className="btn-secondary">소환 질의 목록으로 돌아가기</Link>
      </div>
    );
  }

  // 출처 도메인 단축 파싱
  const getDomainHost = (url?: string) => {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace('www.', '');
    } catch {
      return '참고 정보원';
    }
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '950px', margin: '0 auto' }}>
      
      {/* Breadcrumb */}
      <div style={{ marginBottom: '24px' }} className="fade-in">
        <Link href="/questions" className="btn-secondary" style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          소환 질의 피드로 돌아가기
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'flex-start' }} className="fade-in">
        
        {/* Left Col: 질의 상세 내용 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card-base" style={{ padding: '36px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--accent)',
                backgroundColor: 'var(--accent-bg)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--accent-border)'
              }}>
                요구서 번호: {question.questionCode}
              </span>
              
              <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                상정일: {new Date(question.createdAt).toLocaleDateString('ko-KR')}
              </span>
            </div>

            <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '20px', lineHeight: 1.3 }}>
              {question.title}
            </h1>

            <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-2)', paddingBottom: '16px', marginBottom: '24px', fontSize: 'var(--font-sm)', color: 'var(--text-2)' }}>
              <div>
                소명 대상: <strong style={{ color: 'var(--accent)' }}>{question.targetMember}</strong>
              </div>
              <div style={{ color: 'var(--border)' }}>|</div>
              <div>
                발의 시민: <strong>{question.authorName}</strong>
              </div>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-1)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: '24px' }}>
              {question.content}
            </div>

            {question.sourceUrl && (
              <div style={{ borderTop: '1px solid var(--border-2)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-3)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  🔗 시민 첨부 참고 기록원
                </h4>
                <a
                  href={question.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="badge"
                  style={{
                    backgroundColor: 'var(--bg-3)', color: 'var(--accent)', border: '1px solid var(--border)',
                    padding: '6px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px',
                    fontSize: '11px', fontWeight: 700
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                  {getDomainHost(question.sourceUrl)}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: SLA 타이머 & 공동 연명 서명 폼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* SLA countdown indicator */}
          <SLAIndicator
            createdAt={question.createdAt}
            deadline={question.deadline || ''}
            status={question.status}
            questionId={question.id}
          />

          {/* 국회의원 롤 시뮬레이션용 소명서 입력창 */}
          {userRole === 'lawmaker' && question.status !== 'answered' && (
            <div className="card-base" style={{ padding: '24px', border: '2px solid var(--accent)', backgroundColor: 'var(--accent-bg)' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', marginBottom: '6px' }}>
                📢 국회의원 소명 전용 답변 채널 (Simulate)
              </h3>
              <p style={{ fontSize: '10px', color: 'var(--text-2)', marginBottom: '14px', lineHeight: 1.4 }}>
                현재 <strong>[국회의원] Preset</strong> 상태로 접속 중입니다. 이 의안에 대한 공식 소명 답변서를 기입해 기한 카운트다운을 해제할 수 있습니다.
              </p>

              <form onSubmit={handleLawmakerSubmitAnswer} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <textarea
                  rows={4}
                  placeholder="의정 사실에 부합하는 정중하고 차분한 소명 답변을 작성해 주세요. (15자 이상)"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  style={{
                    padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-border)',
                    backgroundColor: 'var(--bg)', color: 'var(--text-1)', fontSize: '11px', outline: 'none',
                    lineHeight: 1.5, resize: 'vertical'
                  }}
                />
                
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px', fontSize: '10px', fontWeight: 800 }}
                >
                  🚀 공식 의원실 답변 등록 및 보증
                </button>
              </form>
            </div>
          )}

          {/* 공동 연명 동의 서명란 */}
          <div className="card-base" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            {sessionLoaded && !userSession && (
              <div style={{
                position: 'absolute', inset: 0,
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(0,0,0,0.3)',
                zIndex: 10,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '12px', padding: '16px', border: '1px solid var(--border)'
              }}>
                <span style={{ fontSize: '24px' }}>🔒</span>
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: 800, color: 'var(--text-1)', textAlign: 'center' }}>
                  연명 서명은 시민 회원 로그인 후 참여 가능합니다.
                </span>
                <Link href="/auth/login" className="btn-primary" style={{ padding: '6px 16px', fontSize: '10px' }}>
                  체험 로그인
                </Link>
              </div>
            )}

            <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-1)', marginBottom: '4px' }}>
              👥 소명 요구 시민 연명 서명 ({question.voteCount}명)
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '16px' }}>
              이 요구서에 공감하며, 국회의원의 공적인 답변 의무를 정당하게 연대 요구합니다.
            </p>

            {/* 연명 참여 폼 */}
            <form onSubmit={handleAddSignature} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="예: 시민_홍길동"
                value={newSignature}
                onChange={(e) => setNewSignature(e.target.value)}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-2)', color: 'var(--text-1)', fontSize: '11px', outline: 'none'
                }}
              />
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '8px 14px', fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap' }}
              >
                ▲ 서명 동의
              </button>
            </form>

            {/* 서명자 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {signatures.map((sig, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', backgroundColor: 'var(--bg-3)', borderRadius: 'var(--radius-sm)',
                    fontSize: '11px', color: 'var(--text-2)', border: '1px solid var(--border-2)'
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{sig}</span>
                  <span style={{ fontSize: '9px', color: 'var(--success)', fontWeight: 800 }}>✓ 정당한 서명권자</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
