'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useBillDetail, useSession } from '@/lib/hooks';
import { ReplyType } from '@/lib/types';
import { detectEmotionWords, isValidSourceUrl } from '@/lib/emotion-filter';
import { SkeletonCard } from '@/components/custom/SkeletonUI';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BillDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const threadId = resolvedParams.id;

  const { session } = useSession();
  const { bill, replies, loading, submitDebateReply, voteReply } = useBillDetail(threadId);

  // Form states
  const [replyType, setReplyType] = useState<ReplyType>('evidence');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [authorName, setAuthorName] = useState('');

  // Validation / Modal states
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [detectedEmotionWords, setDetectedEmotionWords] = useState<string[]>([]);
  const [isEmotionModalOpen, setIsEmotionModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Autofill name from session
  useEffect(() => {
    if (session) {
      setAuthorName(session.displayName);
    }
  }, [session]);

  if (loading) {
    return (
      <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <SkeletonCard height="160px" />
        <SkeletonCard height="300px" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-1)', marginBottom: '16px' }}>법안 토론 스레드를 찾을 수 없습니다.</h2>
        <Link href="/bills" className="btn-primary">목록으로 돌아가기</Link>
      </div>
    );
  }

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      alert('합의 변론 등록은 시민 회원 로그인 후 이용하실 수 있습니다.');
      return;
    }

    setFormErrors([]);

    const errors: string[] = [];
    if (!content.trim() || content.trim().length < 10) {
      errors.push('변론 내용을 10자 이상 성실히 입력해 주세요.');
    }
    if (!sourceUrl.trim() || !isValidSourceUrl(sourceUrl)) {
      errors.push('주장을 뒷받침할 신뢰할 수 있는 참고 출처 URL을 올바르게 기입해 주세요.');
    }
    if (!authorName.trim()) {
      errors.push('작성자(시민 위원 서명)를 기입해 주세요.');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    // Scan for emotional vocabulary
    const scanResult = detectEmotionWords(content);
    if (scanResult.hasEmotionWords) {
      setDetectedEmotionWords(scanResult.detectedWords);
      setIsEmotionModalOpen(true);
      return;
    }

    setSubmitting(true);
    const success = await submitDebateReply(replyType, content.trim(), sourceUrl.trim());
    setSubmitting(false);

    if (success) {
      setContent('');
      setSourceUrl('');
    }
  };

  const handleVoteReaction = async (replyId: string, reaction: 'verified' | 'needs_review') => {
    if (!session) {
      alert('검증 투표는 시민 회원 로그인 후 이용 가능합니다.');
      return;
    }
    await voteReply(replyId, reaction);
  };

  // Consensus Score Color Setup
  let consensusColor = 'var(--warning)';
  if (bill.consensusScore >= 80) consensusColor = 'var(--success)';
  else if (bill.consensusScore < 50) consensusColor = 'var(--danger)';

  // SVG Gauge calculations
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * bill.consensusScore) / 100;

  return (
    <div style={{ padding: '32px 24px', maxWidth: '950px', margin: '0 auto' }} className="fade-in">
      
      {/* ── Breadcrumb ── */}
      <div style={{ marginBottom: '24px' }}>
        <Link href="/bills" className="btn-secondary" style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          법안 토론 목록으로
        </Link>
      </div>

      {/* ── Bill Overview Card ── */}
      <div className="card-base" style={{ padding: '36px', marginBottom: '32px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px', marginBottom: '24px' }}>
          <div style={{ flex: 1 }}>
            <span style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: 'var(--font-xs)', 
              fontWeight: 700, 
              color: 'var(--accent)',
              backgroundColor: 'var(--accent-bg)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid var(--accent-border)',
              display: 'inline-block',
              marginBottom: '12px'
            }}>
              {bill.billCode}
            </span>

            <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '12px', lineHeight: 1.3 }}>
              {bill.billTitle}
            </h1>
            
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.6 }}>
              {bill.billSummary}
            </p>
          </div>

          {/* ── SVG GaugeRing ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', width: '110px', height: '110px' }}>
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r={radius} fill="none" stroke="var(--border)" strokeWidth="8" />
                <circle 
                  cx="55" 
                  cy="55" 
                  r={radius} 
                  fill="none" 
                  stroke={consensusColor} 
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 55 55)"
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
                  {bill.consensusScore}%
                </span>
                <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-3)' }}>
                  합의 수준
                </span>
              </div>
            </div>
            <span style={{ fontSize: '11px', color: consensusColor, fontWeight: 700 }}>
              시민 합의 단계
            </span>
          </div>

        </div>

        {/* ── DiffViewer ── */}
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '12px' }}>
            📑 개정 조문 대비표 (New & Old Comparison)
          </h3>
          
          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '12px', 
            backgroundColor: 'var(--bg-3)', 
            border: '1px solid var(--border)', 
            borderRadius: 'var(--radius-md)', 
            overflow: 'hidden'
          }}>
            {bill.diffData.map((line, idx) => {
              const rowStyle: React.CSSProperties = { padding: '8px 16px', borderBottom: '1px solid var(--border-2)', display: 'flex', gap: '12px' };
              let indicator = ' ';
              let indicatorColor = 'var(--text-3)';

              if (line.type === 'added') {
                rowStyle.backgroundColor = 'rgba(22, 163, 74, 0.06)';
                rowStyle.color = 'var(--success)';
                rowStyle.borderLeft = '4px solid var(--success)';
                rowStyle.fontWeight = 500;
                indicator = '+';
                indicatorColor = 'var(--success)';
              } else if (line.type === 'removed') {
                rowStyle.backgroundColor = 'rgba(220, 38, 38, 0.04)';
                rowStyle.color = 'var(--danger)';
                rowStyle.borderLeft = '4px solid var(--danger)';
                rowStyle.textDecoration = 'line-through';
                indicator = '-';
                indicatorColor = 'var(--danger)';
              } else {
                rowStyle.color = 'var(--text-2)';
              }

              return (
                <div key={idx} style={rowStyle}>
                  <span style={{ color: indicatorColor, fontWeight: 800, width: '12px', userSelect: 'none' }}>
                    {indicator}
                  </span>
                  <span style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {line.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── ThreadReply Section ── */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '20px' }}>
          🗣️ 시민 구조적 논제 변론 ({replies.length}건)
        </h2>

        {/* Reply Write Form */}
        <div className="card-base" style={{ padding: '28px', marginBottom: '32px', border: '1px solid var(--accent-border)', backgroundColor: 'rgba(13, 148, 136, 0.01)', position: 'relative', overflow: 'hidden' }}>
          {!session && (
            <div style={{
              position: 'absolute', inset: 0,
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255,255,255,0.7)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              zIndex: 20, gap: '16px', padding: '24px',
              border: '1px solid var(--border)'
            }}>
              <span style={{ fontSize: '32px' }}>🔒</span>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '6px' }}>
                  합의 변론 등록은 로그인 후 이용 가능합니다
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-2)' }}>
                  이성적인 법안 토론 참여를 위해 시민 회원으로 로그인해 주세요.
                </p>
              </div>
              <Link href="/auth/login" className="btn-primary" style={{ padding: '8px 24px', fontSize: 'var(--font-xs)' }}>
                체험 로그인하기
              </Link>
            </div>
          )}

          <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '14px' }}>
            ⚖️ 신규 변론 추가 (근거/반론/출처 의무 기입)
          </h3>

          {formErrors.length > 0 && (
            <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.04)', border: '1px solid rgba(220, 38, 38, 0.15)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: '18px', fontSize: 'var(--font-xs)', color: 'var(--danger)' }}>
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                {formErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          <form onSubmit={handleReplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-2)' }}>변론 기조 종류 <span style={{ color: 'var(--danger)' }}>*</span></span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setReplyType('evidence')}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: replyType === 'evidence' ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: replyType === 'evidence' ? 'var(--accent-bg)' : 'var(--bg-2)',
                    color: replyType === 'evidence' ? 'var(--accent)' : 'var(--text-2)',
                    fontSize: 'var(--font-xs)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📑 근거 추가 (Evidence)
                </button>
                
                <button
                  type="button"
                  onClick={() => setReplyType('counter')}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: replyType === 'counter' ? 'var(--danger)' : 'var(--border)',
                    backgroundColor: replyType === 'counter' ? 'rgba(220, 38, 38, 0.04)' : 'var(--bg-2)',
                    color: replyType === 'counter' ? 'var(--danger)' : 'var(--text-2)',
                    fontSize: 'var(--font-xs)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ⚖️ 반론 제시 (Counter)
                </button>

                <button
                  type="button"
                  onClick={() => setReplyType('source')}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: replyType === 'source' ? 'var(--success)' : 'var(--border)',
                    backgroundColor: replyType === 'source' ? 'rgba(22, 163, 74, 0.04)' : 'var(--bg-2)',
                    color: replyType === 'source' ? 'var(--success)' : 'var(--text-2)',
                    fontSize: 'var(--font-xs)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🔍 출처 보완 (Source)
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="replyContent" style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-2)' }}>변론 논설 기술 (10자 이상) <span style={{ color: 'var(--danger)' }}>*</span></label>
              <textarea 
                id="replyContent"
                rows={4}
                placeholder="감정적인 조롱이나 분노 유발 표현을 금합니다. 객관적 입법 논리와 통계 수치를 활용해 합의를 유도하는 변설을 펼쳐 주세요."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-3)',
                  color: 'var(--text-1)',
                  fontSize: 'var(--font-sm)',
                  outline: 'none',
                  resize: 'vertical',
                  lineHeight: 1.5
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="replySource" style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-2)' }}>근거 공적 출처 URL <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  id="replySource"
                  type="text" 
                  placeholder="https://open.assembly.go.kr/..." 
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-3)',
                    color: 'var(--text-1)',
                    fontSize: 'var(--font-xs)',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ width: '180px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="replyAuthor" style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-2)' }}>시민 위원 서명 <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  id="replyAuthor"
                  type="text" 
                  placeholder="예: 법학_홍길동" 
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-3)',
                    color: 'var(--text-1)',
                    fontSize: 'var(--font-xs)',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '12px', width: '100%', fontSize: 'var(--font-sm)' }}>
              {submitting ? '제출 중...' : '📝 합의 변론 공식 등록'}
            </button>

          </form>
        </div>

        {/* Comment thread list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {replies.length === 0 ? (
            <div className="card-base" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)' }}>
              등록된 변론 댓글이 아직 없습니다. 이성적인 첫 변론을 개진해 주세요.
            </div>
          ) : (
            replies.map((rep) => {
              let badgeText = '📑 근거 추가';
              let badgeColor = 'var(--accent)';
              let badgeBg = 'var(--accent-bg)';
              let badgeBorder = '1px solid var(--accent-border)';

              if (rep.replyType === 'counter') {
                badgeText = '⚖️ 반론 제시';
                badgeColor = 'var(--danger)';
                badgeBg = 'rgba(220, 38, 38, 0.04)';
                badgeBorder = '1px solid rgba(220, 38, 38, 0.15)';
              } else if (rep.replyType === 'source') {
                badgeText = '🔍 출처 보완';
                badgeColor = 'var(--success)';
                badgeBg = 'rgba(22, 163, 74, 0.04)';
                badgeBorder = '1px solid rgba(22, 163, 74, 0.15)';
              }

              let domainName = rep.sourceUrl || '';
              if (rep.sourceUrl) {
                try {
                  const parsed = new URL(rep.sourceUrl.startsWith('http') ? rep.sourceUrl : `https://${rep.sourceUrl}`);
                  domainName = parsed.hostname;
                } catch {
                  // ignore
                }
              }

              return (
                <div key={rep.id} className="card-base" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge" style={{ backgroundColor: badgeBg, color: badgeColor, border: badgeBorder, fontWeight: 700 }}>
                        {badgeText}
                      </span>
                      <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-1)' }}>
                        {rep.authorName}
                      </span>
                    </div>

                    <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                      {new Date(rep.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </div>

                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {rep.content}
                  </p>

                  <div style={{ 
                    borderTop: '1px solid var(--border-2)', 
                    paddingTop: '14px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '12px' 
                  }}>
                    {rep.sourceUrl ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <a 
                          href={rep.sourceUrl.startsWith('http') ? rep.sourceUrl : `https://${rep.sourceUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ 
                            fontSize: 'var(--font-xs)', 
                            color: 'var(--accent)', 
                            textDecoration: 'underline',
                            fontWeight: 600,
                            maxWidth: '220px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {domainName}
                        </a>
                      </div>
                    ) : (
                      <span style={{ fontSize: '10px', color: 'var(--text-3)', fontStyle: 'italic' }}>
                        출처 주소 없음
                      </span>
                    )}

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleVoteReaction(rep.id, 'verified')}
                        style={{
                          fontSize: '11px',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-2)',
                          backgroundColor: 'var(--bg-2)',
                          color: 'var(--success)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>✓ 유익함</span>
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>{rep.verifiedCount}</strong>
                      </button>

                      <button
                        onClick={() => handleVoteReaction(rep.id, 'needs_review')}
                        style={{
                          fontSize: '11px',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-2)',
                          backgroundColor: 'var(--bg-2)',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>✗ 부실함</span>
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>{rep.needsReviewCount}</strong>
                      </button>
                    </div>

                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ── EMOTION WARNING DIALOG OVERLAY ── */}
      {isEmotionModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card-base" style={{
            backgroundColor: 'var(--bg-2)', maxWidth: '500px', width: '90%', padding: '30px',
            boxShadow: 'var(--shadow-lg)', border: '2px solid var(--danger)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', marginBottom: '16px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 800, margin: 0 }}>
                감정 자극 언어 제어 장치 작동
              </h3>
            </div>

            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-1)', lineHeight: 1.6, marginBottom: '16px' }}>
              법률 개정안의 차분한 이성적 조율을 위해 감정 자극이나 분노, 비하 목적의 선동적 어휘 기입을 차단합니다. 
              기재하신 댓글에 다음 금지 키워드가 검출되었습니다:
            </p>

            <div style={{
              backgroundColor: 'rgba(220, 38, 38, 0.05)', border: '1px dashed rgba(220, 38, 38, 0.3)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--danger)',
              fontWeight: 700, fontSize: 'var(--font-xs)', fontFamily: 'var(--font-mono)', marginBottom: '20px'
            }}>
              ⚠️ 감지어: [ {detectedEmotionWords.join(', ')} ]
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-2)', lineHeight: 1.5, marginBottom: '24px' }}>
              해당 단어를 지우고, 개정안 조문의 실효성 및 공공 혜택 관점에서 냉정하고 설득력 있는 단어로 가다듬어 주시기 바랍니다.
            </p>

            <button 
              type="button" 
              onClick={() => setIsEmotionModalOpen(false)}
              className="btn-primary"
              style={{ width: '100%', backgroundColor: 'var(--danger)', color: '#fff', padding: '12px' }}
            >
              확인 및 변론 수정하기
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
