'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuestions, useSession } from '@/lib/hooks';
import { MOCK_MEMBERS } from '@/lib/data';
import { detectEmotionWords } from '@/lib/emotion-filter';

const GlassLock = () => (
  <div style={{
    position: 'absolute', inset: 0,
    backdropFilter: 'blur(12px)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 'var(--radius-md)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 20, gap: '20px',
    border: '1px solid var(--border)',
  }}>
    <div style={{ fontSize: '48px', lineHeight: 1 }}>🔒</div>
    <div style={{ textAlign: 'center', padding: '0 32px' }}>
      <p style={{ fontSize: 'var(--font-base)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '8px' }}>
        시민 회원 로그인이 필요합니다
      </p>
      <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-2)', lineHeight: 1.6 }}>
        소명 요구서 공개 발의는 인증된 시민 회원에게만 허용됩니다.<br />
        로그인 후 의정 소명 요구서를 정식 상정해 주세요.
      </p>
    </div>
    <Link href="/login" className="btn-primary" style={{ padding: '10px 28px', fontSize: 'var(--font-sm)' }}>
      체험 로그인하기
    </Link>
    <Link href="/questions" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', textDecoration: 'underline' }}>
      목록으로 돌아가기
    </Link>
  </div>
);

export default function NewQuestionPage() {
  const router = useRouter();
  const { session } = useSession();
  const { submitQuestion } = useQuestions();

  // Form states
  const [targetMemberId, setTargetMemberId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [authorName, setAuthorName] = useState('');

  // Error and Modal states
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [detectedWords, setDetectedWords] = useState<string[]>([]);
  const [isEmotionModalOpen, setIsEmotionModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Autofill name from session
  useEffect(() => {
    if (session) {
      setAuthorName(session.displayName);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    const errors: string[] = [];
    if (!targetMemberId) errors.push('소명 대상 의원을 선택해 주세요.');
    if (!title.trim() || title.length < 6) errors.push('소명 요구 제목을 6자 이상 구체적으로 적어주세요.');
    if (!content.trim() || content.length < 15) errors.push('소명 내용 요구사항을 15자 이상 구체적으로 요구해 주세요.');
    if (!authorName.trim()) errors.push('서명란에 본인의 시민 위원 서명을 입력해 주세요.');

    if (errors.length > 0) { 
      setFormErrors(errors); 
      return; 
    }

    const textToScan = `${title} ${content}`;
    const scanResult = detectEmotionWords(textToScan);
    if (scanResult.hasEmotionWords) {
      setDetectedWords(scanResult.detectedWords);
      setIsEmotionModalOpen(true);
      return;
    }

    setSubmitting(true);
    const success = await submitQuestion(
      targetMemberId,
      title.trim(),
      content.trim(),
      sourceUrl.trim() || undefined
    );
    setSubmitting(false);

    if (success) {
      router.push('/questions');
    }
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '760px', margin: '0 auto' }} className="fade-in">

      {/* Breadcrumb */}
      <div style={{ marginBottom: '28px' }}>
        <Link href="/questions" className="btn-secondary" style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          소환 질의 피드로 돌아가기
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span className="badge badge-accent">Public Accountability</span>
        </div>
        <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '8px' }}>
          🚨 의정 소명 공개 요구서 발의
        </h1>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.6 }}>
          헌정 발언 기록, 예산 부적정 집행 의심, 공약 저조 사항에 한해 의정 자료를 근거로 작성해 주세요.<br />
          모든 소명 요구서에는 <strong>7일의 SLA 답변 기한</strong>이 자동 부여됩니다.
        </p>
      </div>

      {/* Form Card */}
      <div className="card-base" style={{
        padding: '36px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--accent-border)',
        backgroundColor: 'rgba(13, 148, 136, 0.01)'
      }}>
        {!session && <GlassLock />}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {formErrors.length > 0 && (
            <div style={{
              backgroundColor: 'rgba(220, 38, 38, 0.04)', border: '1px solid rgba(220, 38, 38, 0.2)',
              borderRadius: 'var(--radius-sm)', padding: '14px 18px', fontSize: 'var(--font-xs)', color: 'var(--danger)'
            }}>
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                {formErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {/* Target Lawmaker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="targetMemberSelect" style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-2)' }}>
              소명 대상 국회의원 지정 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <select
              id="targetMemberSelect"
              value={targetMemberId}
              onChange={(e) => setTargetMemberId(e.target.value)}
              style={{
                padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-3)', color: 'var(--text-1)', fontSize: 'var(--font-sm)', outline: 'none'
              }}
            >
              <option value="">-- 대상 의원을 선택해 주세요 --</option>
              {MOCK_MEMBERS.map((m) => (
                <option key={m.id} value={m.id}>{m.name} 의원 ({m.region})</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="questionTitle" style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-2)' }}>
              소명 요구서 제목 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="questionTitle" type="text"
              placeholder="예: 22대 본회의 세부 예산 수정 동의안 불참 사유"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-3)', color: 'var(--text-1)', fontSize: 'var(--font-sm)', outline: 'none'
              }}
            />
          </div>

          {/* Detailed requirements */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="questionContent" style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-2)' }}>
              세부 요구 사항 및 소명 쟁점 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              id="questionContent" rows={5}
              placeholder="해명이 필요한 조치, 의결 내역, 일관성 없는 공약 미행에 대한 사실 질문을 핵심적으로 기재해 주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-3)', color: 'var(--text-1)', fontSize: 'var(--font-sm)',
                outline: 'none', resize: 'vertical', lineHeight: 1.6
              }}
            />
          </div>

          {/* Source + Signature */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1.5, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="sourceUrl" style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-2)' }}>
                참고 의정 통계/뉴스 출처 URL
              </label>
              <input
                id="sourceUrl" type="text"
                placeholder="예: https://open.assembly.go.kr/bills/..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                style={{
                  padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-3)', color: 'var(--text-1)', fontSize: 'var(--font-xs)', outline: 'none'
                }}
              />
            </div>

            <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="authorSignature" style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-2)' }}>
                시민 위원 연명 서명 <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                id="authorSignature" type="text"
                placeholder="예: 시민_이수혁"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                style={{
                  padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-3)', color: 'var(--text-1)', fontSize: 'var(--font-xs)', outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '14px', fontSize: 'var(--font-sm)', fontWeight: 800 }}>
            {submitting ? '상정 중...' : '🚨 의정 소명 공개 요구서 정식 상정'}
          </button>

        </form>
      </div>

      {/* Emotion Modal */}
      {isEmotionModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card-base" style={{
            backgroundColor: 'var(--bg-2)', maxWidth: '500px', width: '90%', padding: '32px',
            boxShadow: 'var(--shadow-lg)', border: '2px solid var(--danger)', animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', marginBottom: '16px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 800, margin: 0 }}>감정적 선동 표현 규제 작동</h3>
            </div>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-1)', lineHeight: 1.6, marginBottom: '16px' }}>
              소환 및 해명 요구서는 사실 근거와 비진영 중심의 정돈된 공적 논조로 구성되어야 합니다.
              기재하신 내용에 감정 폄하 표현이 포함되어 상정이 일시 차단되었습니다:
            </p>
            <div style={{
              backgroundColor: 'rgba(220, 38, 38, 0.05)', border: '1px dashed rgba(220, 38, 38, 0.3)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--danger)',
              fontWeight: 700, fontSize: 'var(--font-xs)', fontFamily: 'var(--font-mono)', marginBottom: '20px'
            }}>
              ⚠️ 감지된 키워드: [ {detectedWords.join(', ')} ]
            </div>
            <button type="button" onClick={() => setIsEmotionModalOpen(false)} className="btn-primary"
              style={{ width: '100%', backgroundColor: 'var(--danger)', color: '#fff', padding: '12px' }}>
              확인 및 소명서 다듬기
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
