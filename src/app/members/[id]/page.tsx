'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  useMemberDetail, 
  useMemberActivities, 
  useMemberEvaluations, 
  useSession 
} from '@/lib/hooks';
import RadarChart from '@/components/RadarChart';
import GaugeRing from '@/components/GaugeRing';
import { SkeletonCard, SkeletonText } from '@/components/custom/SkeletonUI';
import AuditLogPanel from '@/components/custom/AuditLogPanel';

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const { session } = useSession();

  // Load hooks data
  const { member, loading: memberLoading } = useMemberDetail(memberId);
  const { activities, loading: activitiesLoading } = useMemberActivities(memberId);
  const { 
    evaluations, 
    loading: evalsLoading, 
    submitMemberEvaluation, 
    averageScore, 
    userEvaluation 
  } = useMemberEvaluations(memberId);

  // Form states
  const [newScore, setNewScore] = useState(50);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Initialize form with existing evaluation if present
  useEffect(() => {
    if (userEvaluation) {
      setNewScore(userEvaluation.score);
      setNewComment(userEvaluation.comment);
    }
  }, [userEvaluation]);

  if (memberLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="fade-in">
        <SkeletonCard height="160px" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          <SkeletonCard height="400px" />
          <SkeletonCard height="400px" />
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="card-base fade-in" style={{ padding: '60px 40px', textAlign: 'center', backgroundColor: 'var(--bg-2)' }}>
        <p className="mono" style={{ fontSize: 'var(--font-sm)', color: 'var(--danger)', fontWeight: 700, marginBottom: '16px' }}>
          MEMBER_NOT_FOUND_EXCEPTION // 해당 국회의원 데이터를 시스템 레지스트리에서 호출할 수 없습니다.
        </p>
        <button onClick={() => router.push('/members')} className="btn-secondary">
          레지스트리 목록으로 돌아가기
        </button>
      </div>
    );
  }

  // Achromatic neutral grayscale party badge
  const getPartyColorBadge = (partyName: string) => {
    return { 
      bg: 'var(--bg-3)', 
      border: 'var(--border-2)', 
      text: 'var(--text-1)' 
    };
  };

  const partyStyle = getPartyColorBadge(member.party);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      alert('유권자 직접 평가는 시민 로그인 세션이 요구됩니다. 체험 로그인 후 이용해 주세요.');
      router.push('/auth/login');
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    const success = await submitMemberEvaluation(newScore, newComment.trim());
    setSubmitting(false);

    if (success) {
      // Clear comment only if it was a brand new evaluation, or keep it
    }
  };

  const billActivities = activities.filter(act => act.type === 'bill');
  const questionActivities = activities.filter(act => act.type === 'question');
  const quizActivities = activities.filter(act => act.type === 'quiz');

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* ─── Profile Header ─── */}
      <section className="card-base animate-slide-down" style={{
        backgroundColor: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '28px 32px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '24px',
        alignItems: 'center',
        position: 'relative'
      }}>
        {/* Profile Image / Fallback Avatar */}
        <div style={{
          width: '110px',
          height: '110px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-3)',
          border: '1px solid var(--border-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          fontWeight: 600,
          color: 'var(--text-1)',
          flexShrink: 0
        }}>
          {member.name.substring(0, 1)}
        </div>

        {/* Member Details */}
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>{member.name}</h1>
            {member.hanjaName && <span className="mono" style={{ fontSize: 'var(--font-sm)', color: 'var(--text-3)' }}>({member.hanjaName})</span>}
            <span style={{
              fontSize: 'var(--font-xs)',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '4px',
              backgroundColor: partyStyle.bg,
              border: `1px solid ${partyStyle.border}`,
              color: partyStyle.text,
              fontFamily: 'var(--font-mono)'
            }}>
              {member.party}
            </span>
          </div>

          <p className="mono" style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', marginBottom: '14px', lineHeight: '1.4' }}>
            소속 선거구: <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{member.region}</span> // 소속 위원회: <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{member.committee || '미배정'}</span>
          </p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {member.electedHistory?.map((hist, i) => (
              <span key={i} className="mono" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-2)', backgroundColor: 'var(--bg-3)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                [{hist}]
              </span>
            ))}
          </div>
        </div>

        {/* Trust Score circular gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '1px solid var(--border)', paddingLeft: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <GaugeRing value={member.trustScore} size={100} strokeWidth={9} label="지표 신뢰" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="mono" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)' }}>ACCUMULATED_TRUST_LEVEL</span>
              <strong style={{ fontSize: 'var(--font-lg)', color: 'var(--text-1)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{member.trustScore >= 80 ? 'HIGH QUALITY' : member.trustScore >= 60 ? 'STABLE' : 'AUDIT REQUIRED'}</strong>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-2)' }}>WDI 공식 표결 이탈 가중 평가</span>
            </div>
          </div>
          {/* AuditLogPanel — PRD Section 4.2 경량 구현 */}
          <AuditLogPanel memberId={member.id} memberName={member.name} />
        </div>
      </section>

      {/* ─── Main Content Layout ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.1fr 1.9fr',
        gap: '32px',
        alignItems: 'flex-start'
      }}>

        {/* ─── LEFT COLUMN: RADAR WDI & DIRECT USER EVALUATION ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Radar Chart Panel */}
          <section className="card-base" style={{ backgroundColor: 'var(--bg-2)', textAlign: 'center', padding: '28px 24px' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '24px', textAlign: 'left' }}>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-2)' }}>의정 지표 1 // 오각형 의정 역량 분석</span>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600 }}>의정 종합 5대 지표 분석</h3>
            </div>
            
            <RadarChart indicators={member.indicators} />
            
            <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'left' }}>
              {member.indicators.map((ind) => (
                <div key={ind.label} style={{ padding: '12px 14px', backgroundColor: 'var(--bg-3)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-2)', marginBottom: '4px' }}>{ind.label}</div>
                  <strong className="mono" style={{ fontSize: 'var(--font-base)', color: 'var(--text-1)' }}>{ind.value}%</strong>
                </div>
              ))}
            </div>
          </section>

          {/* User direct evaluation system (Upsert 1) */}
          <section className="card-base" style={{ backgroundColor: 'var(--bg-2)', padding: '28px 24px' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '24px' }}>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-2)' }}>의정 지표 2 // 시민 직접 평판 평가</span>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600 }}>유권자 직접 의정 평판</h3>
            </div>

            {/* Form */}
            <form onSubmit={handleEvaluate} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-1)' }}>
                    의정 수행 평점 : <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{newScore}점</span>
                  </label>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)' }}>0점~100점 척도</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={newScore} 
                  onChange={(e) => setNewScore(Number(e.target.value))} 
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-3)',
                    outline: 'none',
                    WebkitAppearance: 'none',
                    cursor: 'pointer'
                  }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-1)' }}>의정 코멘트 및 한줄평</label>
                <textarea
                  placeholder={session ? "해당 국회의원의 전반적인 법안 제안, 질의, 출석률 등의 의정 성과에 대한 구체적인 코멘트를 남겨 주세요." : "직접 평가는 시민 세션 로그인 후 작성 가능합니다."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={!session}
                  rows={4}
                  required
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-2)',
                    fontSize: 'var(--font-sm)',
                    backgroundColor: session ? 'var(--bg-2)' : 'var(--bg-3)',
                    color: 'var(--text-1)',
                    outline: 'none',
                    lineHeight: '1.6'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: 'var(--font-sm)', fontWeight: 700 }}
              >
                {submitting ? '제출 중...' : userEvaluation ? '🟢 내 평가 업데이트' : '✍️ 유권자 평가 제출'}
              </button>

              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', textAlign: 'center', margin: 0 }}>
                * 중복 제출은 불가능하며, 동일 유저가 다시 제출 시 가장 최근 1건만 영구 업데이트 보존됩니다.
              </p>
            </form>

            <hr style={{ border: 'none', borderTop: '1px dashed var(--border)', marginBottom: '20px' }} />

            {/* Evaluations Registry */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)' }}>시민 평가 기록 보관소</span>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-1)', fontWeight: 600 }}>시민 직접 평가 평균: {averageScore}점</span>
              </div>

              {evalsLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                    <SkeletonText width="30%" height="12px" />
                    <SkeletonText width="80%" height="12px" />
                  </div>
                ))
              ) : evaluations.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-3)' }}>아직 등록된 시민 평가 코멘트가 없습니다.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                  {evaluations.map((ev) => (
                    <div key={ev.id} style={{
                      padding: '14px',
                      backgroundColor: 'var(--bg-3)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      gap: '14px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '48px' }}>
                        <span className="mono" style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--text-1)' }}>{ev.score}</span>
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)' }}>점</span>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-1)', lineHeight: 1.5, margin: 0 }}>{ev.comment}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', color: 'var(--text-3)' }}>
                          <span style={{ fontWeight: 600 }}>{ev.userDisplayName}</span>
                          <span>{new Date(ev.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </section>

        </div>

        {/* ─── RIGHT COLUMN: DEDICATED SECTIONS FOR LAWMAKER ACTIVITIES ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Section 1: 대표 발의 법안 토론방 연동 기록 */}
          <section className="card-base" style={{ backgroundColor: 'var(--bg-2)', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>⚖️</span>
                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600 }}>대표 발의 법안 토론방 연동 기록</h3>
              </div>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
                해당 의원이 대표 발의하여 플랫폼 내의 법안 토론방에 연동된 법안 목록 및 시민 합의율 추이입니다.
              </p>
            </div>

            {activitiesLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <SkeletonText width="40%" height="16px" />
                <SkeletonText width="90%" height="14px" />
              </div>
            ) : billActivities.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-3)' }}>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)' }}>대표 발의 및 연동된 법안 토론 기록이 존재하지 않습니다.</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {billActivities.map((act) => (
                  <div key={act.id} style={{
                    padding: '16px 20px',
                    backgroundColor: 'var(--bg-3)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    height: '100%',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)' }}>
                          {new Date(act.date).toLocaleDateString()}
                        </span>
                        <span style={{
                          fontSize: 'var(--font-xs)',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '3px',
                          backgroundColor: 'var(--border-2)',
                          color: 'var(--text-1)'
                        }}>
                          대표 발의 법안
                        </span>
                      </div>
                      <strong style={{ fontSize: 'var(--font-base)', color: 'var(--text-1)' }}>{act.title}</strong>
                      <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>{act.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 2: 시민 소명 요구 및 답변 현황 */}
          <section className="card-base" style={{ backgroundColor: 'var(--bg-2)', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🚨</span>
                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600 }}>시민 소명 요구 및 답변 현황</h3>
              </div>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
                유권자들이 해당 국회의원을 지목하여 등록한 공식 소명 청원서와 해당 의원실의 실제 소명 답변 처리 기록입니다.
              </p>
            </div>

            {activitiesLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <SkeletonText width="40%" height="16px" />
                <SkeletonText width="90%" height="14px" />
              </div>
            ) : questionActivities.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-3)' }}>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)' }}>시민들로부터 인계된 활성 소명 요구서가 없습니다.</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {questionActivities.map((act) => (
                  <div key={act.id} style={{
                    padding: '16px 20px',
                    backgroundColor: 'var(--bg-3)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    height: '100%',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)' }}>
                          {new Date(act.date).toLocaleDateString()}
                        </span>
                        <span style={{
                          fontSize: 'var(--font-xs)',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '3px',
                          backgroundColor: 'var(--border-2)',
                          color: 'var(--text-1)'
                        }}>
                          공개 소명 요구
                        </span>
                      </div>
                      <strong style={{ fontSize: 'var(--font-base)', color: 'var(--text-1)' }}>{act.title}</strong>
                      <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>{act.description}</p>
                    </div>
                    
                    {act.details && (
                      <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', marginTop: '6px', fontSize: 'var(--font-sm)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-3)' }}>소명 답변 처리 상태:</span>
                          <span style={{
                            fontWeight: 700,
                            color: act.details.status === 'answered' ? 'var(--success)' : 'var(--warning)'
                          }}>
                            {act.details.status === 'answered' ? '● 소명 성실 답변 완료' : '○ 답변 대기 기한 추적 중'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-3)' }}>소명 촉구 시민 공감수:</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{act.details.voteCount}명</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 3: 관련 블라인드 평가 발언 내역 */}
          <section className="card-base" style={{ backgroundColor: 'var(--bg-2)', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🔒</span>
                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600 }}>관련 블라인드 평가 발언 내역</h3>
              </div>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
                해당 의원의 과거 공식 발언이 정당이나 인물명을 가린 채 순수 정책적 관점에서 유권자들에게 평가받았던 퀴즈 내역입니다.
              </p>
            </div>

            {activitiesLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <SkeletonText width="40%" height="16px" />
                <SkeletonText width="90%" height="14px" />
              </div>
            ) : quizActivities.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-3)' }}>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)' }}>블라인드 투표 대상에 등재된 발언 이력이 존재하지 않습니다.</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {quizActivities.map((act) => (
                  <div key={act.id} style={{
                    padding: '16px 20px',
                    backgroundColor: 'var(--bg-3)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    height: '100%',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)' }}>
                          {new Date(act.date).toLocaleDateString()}
                        </span>
                        <span style={{
                          fontSize: 'var(--font-xs)',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '3px',
                          backgroundColor: 'var(--border-2)',
                          color: 'var(--text-1)'
                        }}>
                          블라인드 퀴즈 발언
                        </span>
                      </div>
                      <strong style={{ fontSize: 'var(--font-base)', color: 'var(--text-1)' }}>{act.title}</strong>
                      <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>{act.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

      </div>

    </div>
  );
}
