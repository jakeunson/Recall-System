'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBills, useSession } from '@/lib/hooks';
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
        시민 입법안 공식 상정은 실명 회원에게만 부여됩니다.<br />
        로그인 후 입법 취지와 신구 조안 대비표를 정식 기재해 주세요.
      </p>
    </div>
    <Link href="/login" className="btn-primary" style={{ padding: '10px 28px', fontSize: 'var(--font-sm)' }}>
      체험 로그인하기
    </Link>
    <Link href="/bills/propose" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', textDecoration: 'underline' }}>
      목록으로 돌아가기
    </Link>
  </div>
);

export default function NewBillProposalPage() {
  const router = useRouter();
  const { session } = useSession();
  const { submitProposal } = useBills();

  // Form states
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [background, setBackground] = useState('');
  const [originalClause, setOriginalClause] = useState('');
  const [proposedClause, setProposedClause] = useState('');
  const [authorName, setAuthorName] = useState('');

  // Error and Modal states
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [detectedWords, setDetectedWords] = useState<string[]>([]);
  const [isEmotionModalOpen, setIsEmotionModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Autofill author name from session
  useEffect(() => {
    if (session) {
      setAuthorName(session.displayName);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    const errors: string[] = [];
    if (!title.trim() || title.length < 5) errors.push('법안 제목을 5자 이상 작성해 주세요.');
    if (!purpose.trim() || purpose.length < 15) errors.push('입법 핵심 취지를 15자 이상 구체적으로 적어주세요.');
    if (!background.trim() || background.length < 20) errors.push('제안 배경 및 이유를 20자 이상 기술해 주세요.');
    if (!originalClause.trim()) errors.push('현행 조문(수정 전)을 작성해 주세요. (없는 신설 조문이면 "신설" 기입)');
    if (!proposedClause.trim()) errors.push('개정 조안(수정 후)을 기입해 주세요.');
    if (!authorName.trim()) errors.push('작성자 서명을 기입해 주세요.');

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    const scanText = `${title} ${purpose} ${background}`;
    const scanResult = detectEmotionWords(scanText);
    if (scanResult.hasEmotionWords) {
      setDetectedWords(scanResult.detectedWords);
      setIsEmotionModalOpen(true);
      return;
    }

    setSubmitting(true);
    // Clauses array: first is original (removed), second is proposed (added)
    const success = await submitProposal(
      title.trim(),
      purpose.trim(),
      background.trim(),
      [originalClause.trim(), proposedClause.trim()]
    );
    setSubmitting(false);

    if (success) {
      router.push('/bills/propose');
    }
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '800px', margin: '0 auto' }} className="fade-in">

      {/* Breadcrumb */}
      <div style={{ marginBottom: '28px' }}>
        <Link href="/bills/propose" className="btn-secondary" style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          시민 입법 피드로 돌아가기
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span className="badge badge-accent">Collaborative Legislation</span>
        </div>
        <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '8px' }}>
          💡 새로운 시민 입법 제안서 발의
        </h1>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.6 }}>
          이성적 통계와 명확한 입법 의도로 조문을 작성해 주세요.<br />
          상정 완료 시, 시민 공동의 수정 위키 참여 및 전문 자문단의 적법성(합헌성) 검토 단계로 연동됩니다.
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
              backgroundColor: 'rgba(220, 38, 38, 0.04)', border: '1px solid rgba(220, 38, 38, 0.15)',
              borderRadius: 'var(--radius-sm)', padding: '14px 18px', fontSize: 'var(--font-xs)', color: 'var(--danger)'
            }}>
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                {formErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="billTitle" style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-2)' }}>
              법안명 (제안 제목) <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="billTitle" type="text"
              placeholder="예: 온라인 플랫폼 소비자 기만 방지법"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-3)', color: 'var(--text-1)', fontSize: 'var(--font-sm)', outline: 'none'
              }}
            />
          </div>

          {/* Purpose */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="billPurpose" style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-2)' }}>
              핵심 입법 취지 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              id="billPurpose" rows={3}
              placeholder="이 입법 제안을 통해 실질적으로 달성하고자 하는 국민 권익 목적을 명확히 요약해 주세요."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              style={{
                padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-3)', color: 'var(--text-1)', fontSize: 'var(--font-sm)', outline: 'none', resize: 'vertical'
              }}
            />
          </div>

          {/* Background */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="billBackground" style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-2)' }}>
              제안 배경 및 사회적 필요성 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              id="billBackground" rows={4}
              placeholder="해당 법률 개정안이 필요한 사회적 폐해, 통계, 배경을 설득력 있게 설명해 주세요."
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              style={{
                padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-3)', color: 'var(--text-1)', fontSize: 'var(--font-sm)', outline: 'none', resize: 'vertical'
              }}
            />
          </div>

          {/* Clause Comparison */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="originalClause" style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-2)' }}>
                현행 조문 <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                id="originalClause" rows={4}
                placeholder="현행법에 존재하는 조문을 기재해 주세요. (신설안인 경우 '신설' 기재)"
                value={originalClause}
                onChange={(e) => setOriginalClause(e.target.value)}
                style={{
                  padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-3)', color: 'var(--text-1)', fontSize: '12px', outline: 'none',
                  resize: 'vertical', fontFamily: 'var(--font-mono)'
                }}
              />
            </div>

            <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="proposedClause" style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-2)' }}>
                개정 조안 <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                id="proposedClause" rows={4}
                placeholder="수정 변경하고자 하는 정밀 개정 조문 텍스트를 기재해 주세요."
                value={proposedClause}
                onChange={(e) => setProposedClause(e.target.value)}
                style={{
                  padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-3)', color: 'var(--text-1)', fontSize: '12px', outline: 'none',
                  resize: 'vertical', fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          </div>

          {/* Author Signature */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="billAuthor" style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-2)' }}>
              제안 시민 위원 서명 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="billAuthor" type="text"
              placeholder="예: 시민_홍길동"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              style={{
                padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-3)', color: 'var(--text-1)', fontSize: 'var(--font-xs)', outline: 'none'
              }}
            />
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '14px', fontSize: 'var(--font-sm)', fontWeight: 800 }}>
            {submitting ? '상정 중...' : '📜 시민 입법 제안 공식 발의 상정'}
          </button>

        </form>
      </div>

      {/* Emotion Scanner Modal */}
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
              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 800, margin: 0 }}>감정적 표현 자제 유도 장치 작동</h3>
            </div>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-1)', lineHeight: 1.6, marginBottom: '16px' }}>
              법안 기획 및 입법 발의 제안서는 헌법적 가치와 차분한 공적 언어로 기재되어야 합니다.
              설명 중 감정 자극 어휘나 정치적 비사용 선동 어구가 감지되었습니다:
            </p>
            <div style={{
              backgroundColor: 'rgba(220, 38, 38, 0.05)', border: '1px dashed rgba(220, 38, 38, 0.3)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--danger)',
              fontWeight: 700, fontSize: 'var(--font-xs)', fontFamily: 'var(--font-mono)', marginBottom: '20px'
            }}>
              ⚠️ 감지어: [ {detectedWords.join(', ')} ]
            </div>
            <button type="button" onClick={() => setIsEmotionModalOpen(false)} className="btn-primary"
              style={{ width: '100%', backgroundColor: 'var(--danger)', color: '#fff', padding: '12px' }}>
              확인 및 입법 제안서 가다듬기
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
