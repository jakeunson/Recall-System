'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { detectEmotionWords, isValidSourceUrl } from '@/lib/emotion-filter';
import { FactCheckVerdict, UserProfile } from '@/lib/types';
import { VERDICT_MAP } from '../page';

export default function NewFactCheckPage() {
  const router = useRouter();

  // 세션 상태
  const [userSession, setUserSession] = useState<UserProfile | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  // 폼 필드 상태
  const [claim, setClaim] = useState('');
  const [evidence, setEvidence] = useState('');
  const [verdict, setVerdict] = useState<FactCheckVerdict>('true');
  const [sources, setSources] = useState<string[]>(['']);
  const [authorName, setAuthorName] = useState('');

  // 에러 및 필터 팝업 모달 상태
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [emotionWarningWords, setEmotionWarningWords] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 세션 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as UserProfile;
          setUserSession(parsed);
          setAuthorName(parsed.displayName);
        } catch { /* ignore */ }
      }
      setSessionLoaded(true);
    }
  }, []);

  // 출처 추가/삭제
  const handleAddSource = () => {
    setSources([...sources, '']);
  };

  const handleRemoveSource = (index: number) => {
    const updated = [...sources];
    updated.splice(index, 1);
    setSources(updated);
  };

  const handleSourceChange = (index: number, val: string) => {
    const updated = [...sources];
    updated[index] = val;
    setSources(updated);
  };

  // 폼 검증 및 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    const errors: string[] = [];

    // 1. 기본 유효성 검사
    if (!claim.trim() || claim.trim().length < 8) {
      errors.push('검증할 주장(Claim)을 8자 이상 자세히 기록해 주세요.');
    }
    if (!evidence.trim() || evidence.trim().length < 15) {
      errors.push('주장을 판결할 실질적인 데이터 근거(Evidence)를 15자 이상 구체적으로 기록해 주세요.');
    }
    if (!authorName.trim()) {
      errors.push('제출자(시민 검증단명)를 입력해 주세요.');
    }

    // 2. 출처 검사 (최소 1개 이상의 유효한 URL 필수)
    const validUrls = sources.filter(url => url.trim() !== '' && isValidSourceUrl(url));
    if (validUrls.length === 0) {
      errors.push('근거를 입증할 신뢰할 수 있는 참고 출처 URL이 최소 1개 이상 등록되어야 합니다.');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    // 3. 감정 필터링 (주장과 근거 통합 조사)
    const combinedText = `${claim} ${evidence}`;
    const filterResult = detectEmotionWords(combinedText);

    if (filterResult.hasEmotionWords) {
      setEmotionWarningWords(filterResult.detectedWords);
      setIsModalOpen(true); // 편향 감정어 경고 팝업 활성화
      return;
    }

    // 4. 로컬 스토리지에 새 팩트체크 오브젝트 추가 저장
    const newCheck = {
      id: `FC-${Date.now().toString().substring(8)}`,
      claim: claim.trim(),
      evidence: evidence.trim(),
      verdict,
      sourceUrls: validUrls,
      verifiedCount: 1, // 본인 자동 가산
      needsReviewCount: 0,
      authorName: authorName.trim(),
      createdAt: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      const existing = localStorage.getItem('user_factchecks');
      const list = existing ? JSON.parse(existing) : [];
      list.push(newCheck);
      localStorage.setItem('user_factchecks', JSON.stringify(list));
      
      // 세션 갱신 이벤트 트리거
      window.dispatchEvent(new Event('user-session-changed'));
    }

    // 목록으로 이동
    router.push('/factcheck');
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* ── Breadcrumb ── */}
      <div style={{ marginBottom: '24px' }} className="fade-in">
        <Link href="/factcheck" className="btn-secondary" style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          팩트체크 목록으로
        </Link>
      </div>

      {/* ── Form Container ── */}
      <div className="card-base fade-in" style={{ padding: '36px', position: 'relative', overflow: 'hidden' }}>
        {sessionLoaded && !userSession && (
          <div style={{
            position: 'absolute', inset: 0,
            backdropFilter: 'blur(12px)',
            backgroundColor: 'rgba(0,0,0,0.35)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 20, gap: '20px', padding: '24px',
            border: '1px solid var(--border)'
          }}>
            <span style={{ fontSize: '40px' }}>🔒</span>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 'var(--font-base)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '8px' }}>
                시민 회원 로그인이 필요합니다
              </p>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-2)', lineHeight: 1.6 }}>
                시민 팩트체크 제옶 등록은 인증된 시민 회원만 이용 가능합니다.
              </p>
            </div>
            <Link href="/auth/login" className="btn-primary" style={{ padding: '10px 28px', fontSize: 'var(--font-sm)' }}>
              체험 로그인하기
            </Link>
            <Link href="/factcheck" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', textDecoration: 'underline' }}>
              목록으로 돌아가기
            </Link>
          </div>
        )}

        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '8px' }}>
          ⚖️ 신규 시민 팩트체크 등록
        </h2>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '28px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          사실에 입각한 토론을 위해 정치인의 주장, 입증할 수 있는 통계 및 공적 문서 근거, 명확한 출처를 기록해야 합니다. 
          자극적인 단어를 자제하고 **객관적인 데이터 중심**으로 기입해 주세요.
        </p>

        {/* Validation Errors Overlay Box */}
        {formErrors.length > 0 && (
          <div style={{ 
            backgroundColor: 'rgba(220, 38, 38, 0.04)', 
            border: '1px solid rgba(220, 38, 38, 0.15)', 
            borderRadius: 'var(--radius-sm)', 
            padding: '16px 20px', 
            marginBottom: '24px' 
          }}>
            <h4 style={{ color: 'var(--danger)', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '8px' }}>제출 형식이 올바르지 않습니다.</h4>
            <ul style={{ paddingLeft: '20px', margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-1)', lineHeight: 1.6 }}>
              {formErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* 1. Claim Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="claim" style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-1)' }}>
              검증할 주장 (Claim) <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input 
              id="claim"
              type="text" 
              placeholder="예: '22대 국회 소상공인 보호법 개정으로 연 120만원 매출 향상 효과가 발생했습니다.'" 
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text-1)',
                outline: 'none',
                fontSize: 'var(--font-sm)'
              }}
            />
          </div>

          {/* 2. Verdict Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-1)' }}>
              1차 팩트 판정 결과 (Verdict) <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
              gap: '8px' 
            }}>
              {Object.entries(VERDICT_MAP).map(([vKey, details]) => (
                <button
                  key={vKey}
                  type="button"
                  onClick={() => setVerdict(vKey as FactCheckVerdict)}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: verdict === vKey ? details.color : 'var(--border)',
                    backgroundColor: verdict === vKey ? details.bg : 'var(--bg-2)',
                    color: verdict === vKey ? details.color : 'var(--text-2)',
                    fontSize: 'var(--font-xs)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center'
                  }}
                >
                  {details.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Evidence Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="evidence" style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-1)' }}>
              팩트 검증 근거 및 논리 (Evidence) <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea 
              id="evidence"
              rows={6}
              placeholder="주장의 허위성 또는 타당성을 밝히는 정부 통계, 국회 의사록, 관련 보고서 데이터 등의 세부 근거 논리를 작성해 주세요. (15자 이상)"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text-1)',
                outline: 'none',
                fontSize: 'var(--font-sm)',
                lineHeight: 1.6,
                resize: 'vertical'
              }}
            />
          </div>

          {/* 4. Sources Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-1)' }}>
                참고 출처 웹사이트 주소 (Sources) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <button 
                type="button" 
                onClick={handleAddSource}
                style={{ 
                  fontSize: 'var(--font-xs)', 
                  color: 'var(--accent)', 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                + 출처 URL 추가
              </button>
            </div>

            {sources.map((src, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="예: https://open.assembly.go.kr/bills/..." 
                  value={src}
                  onChange={(e) => handleSourceChange(i, e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text-1)',
                    outline: 'none',
                    fontSize: 'var(--font-xs)'
                  }}
                />
                {sources.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveSource(i)}
                    style={{ 
                      color: 'var(--danger)', 
                      padding: '8px',
                      fontSize: 'var(--font-xs)' 
                    }}
                  >
                    삭제
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 5. Author Name Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="authorName" style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-1)' }}>
              제출 시민 검증단원 서명 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input 
              id="authorName"
              type="text" 
              placeholder="예: 데이터분석_김시민" 
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              style={{
                maxWidth: '280px',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text-1)',
                outline: 'none',
                fontSize: 'var(--font-xs)'
              }}
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '24px', marginTop: '12px' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, padding: '14px' }}>
              ⚖️ 검증 보고서 공식 등록 및 서명
            </button>
            <Link href="/factcheck" className="btn-secondary" style={{ padding: '14px 24px' }}>
              취소
            </Link>
          </div>

        </form>
      </div>

      {/* ── EMOTION WARNING DIALOG OVERLAY ── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.25s ease'
        }}>
          <div className="card-base" style={{
            backgroundColor: 'var(--bg-2)',
            maxWidth: '520px',
            width: '90%',
            padding: '30px',
            boxShadow: 'var(--shadow-lg)',
            border: '2px solid var(--danger)',
            animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, margin: 0 }}>
                감정 언어 및 편향적 어휘 감지
              </h3>
            </div>

            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-1)', lineHeight: 1.6, marginBottom: '16px' }}>
              본 플랫폼은 진영 논리를 지양하고 **순수한 팩트와 수치 데이터**를 근간으로 삼는 중립 지대입니다. 
              기입하신 내용에서 분노를 유발하거나 정치적 선동으로 보일 우려가 있는 단어가 검출되었습니다:
            </p>

            {/* Detected Words List Box */}
            <div style={{
              backgroundColor: 'rgba(220, 38, 38, 0.05)',
              border: '1px dashed rgba(220, 38, 38, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              color: 'var(--danger)',
              fontWeight: 700,
              fontSize: 'var(--font-xs)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.05em',
              marginBottom: '20px'
            }}>
              🚨 감지 단어: [ {emotionWarningWords.join(', ')} ]
            </div>

            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-2)', lineHeight: 1.5, marginBottom: '24px' }}>
              데이터를 정직하게 입증하기 위해, 감지된 수식어구 및 자극적 단어를 보다 건조하고 중립적인 공적 어조로 수정해 주세요.
            </p>

            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-primary"
              style={{
                width: '100%',
                backgroundColor: 'var(--danger)',
                color: '#fff',
                padding: '12px'
              }}
            >
              확인 및 언어 순화하기
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
