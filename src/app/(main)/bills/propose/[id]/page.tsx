'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { MOCK_PROPOSALS } from '@/lib/data';
import { BillProposal, ProposalVersion, LegalOpinion, LegalRating, DiffLine } from '@/lib/types';
import { detectEmotionWords } from '@/lib/emotion-filter';

interface PageProps {
  params: Promise<{ id: string }>;
}

// React 19 컴포넌트 순수성(Purity) 규칙 준수를 위한 외부 ID 생성 유틸
function generateOpinionId(): string {
  return `LO-${Date.now().toString().substring(8)}`;
}

export default function CitizenProposalDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const proposalId = resolvedParams.id;

  const [proposal, setProposal] = useState<BillProposal | null>(null);
  
  // 버전 스위칭 상태
  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(1);
  const [currentDiff, setCurrentDiff] = useState<DiffLine[]>([]);
  const [currentVersionInfo, setCurrentVersionInfo] = useState<ProposalVersion | null>(null);

  // 새 버전 수정 제안 폼 상태
  const [newProposedText, setNewProposedText] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [revisedAuthor, setRevisedAuthor] = useState('');
  const [revisionErrors, setRevisionErrors] = useState<string[]>([]);

  // 법률자문단 검토 폼 상태
  const [expertRating, setExpertRating] = useState<LegalRating>('constitutional');
  const [expertComment, setExpertComment] = useState('');
  const [expertAuthor, setExpertAuthor] = useState('');
  const [expertErrors, setExpertErrors] = useState<string[]>([]);

  // 로컬 세션 역할군 (체험 로그인 정보)
  const [userRole, setUserRole] = useState('citizen');
  const [userSession, setUserSession] = useState<{ id: string; displayName: string; trustLevel: number } | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  // 1. 초기화 데이터 로드 (로컬 + Mock 통합)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('user_role') || 'citizen';
      const savedSession = localStorage.getItem('user_session');
      
      setTimeout(() => {
        setUserRole(savedRole);
        if (savedSession) {
          try { setUserSession(JSON.parse(savedSession)); } catch { /* ignore */ }
        }
        setSessionLoaded(true);
      }, 0);

      let found: BillProposal | undefined = MOCK_PROPOSALS.find((p) => p.id === proposalId);
      
      const savedProposals = localStorage.getItem('user_proposals');
      if (savedProposals) {
        try {
          const parsed = JSON.parse(savedProposals) as BillProposal[];
          const localFound = parsed.find((p) => p.id === proposalId);
          if (localFound) found = localFound;
        } catch {
          // ignore
        }
      }

      if (found) {
        const finalFound = found;
        setTimeout(() => {
          setProposal(finalFound);
          
          // 최신 버전 선택 기본화
          const latestVer = finalFound.versions[finalFound.versions.length - 1];
          setSelectedVersionNum(latestVer.version);
          setCurrentDiff(latestVer.diffData);
          setCurrentVersionInfo(latestVer);

          // 자구 기본 바인딩 (수정 폼에 최신 개정안 텍스트를 미리 넣어줌)
          const addedLines = latestVer.diffData.filter(l => l.type === 'added').map(l => l.text).join('\n');
          setNewProposedText(addedLines);
        }, 0);
      }
    }
  }, [proposalId]);

  // 버전 탭 클릭 핸들러
  const handleVersionSelect = (verNum: number) => {
    if (!proposal) return;
    const ver = proposal.versions.find((v) => v.version === verNum);
    if (ver) {
      setSelectedVersionNum(verNum);
      setCurrentDiff(ver.diffData);
      setCurrentVersionInfo(ver);
    }
  };

  // 2. 집단지성 새 버전 개정안 기고 제출
  const handleRevisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRevisionErrors([]);

    if (!proposal) return;

    const errors: string[] = [];
    if (!newProposedText.trim()) {
      errors.push('개정 보완할 조문 텍스트를 기입해 주세요.');
    }
    if (!changeSummary.trim() || changeSummary.length < 8) {
      errors.push('수정 보완 요약을 8자 이상 작성해 주세요.');
    }
    if (!revisedAuthor.trim()) {
      errors.push('기고 시민 위원 서명을 입력해 주세요.');
    }

    // 감정 단어 실시간 제어
    const scanResult = detectEmotionWords(changeSummary + ' ' + newProposedText);
    if (scanResult.hasEmotionWords) {
      errors.push(`선동적이고 감정적인 키워드가 발견되어 상정이 차단되었습니다: [ ${scanResult.detectedWords.join(', ')} ]`);
    }

    if (errors.length > 0) {
      setRevisionErrors(errors);
      return;
    }

    // V1 대비 변경점 Diff 생성
    const originalClause = proposal.diffData.find(l => l.type === 'removed')?.text || '';
    const newDiff: DiffLine[] = [
      { type: 'removed' as const, text: originalClause },
      { type: 'added' as const, text: newProposedText.trim() }
    ];

    const nextVerNum = proposal.versions.length + 1;
    const newVersionObj: ProposalVersion = {
      version: nextVerNum,
      createdAt: new Date().toISOString(),
      authorName: revisedAuthor.trim(),
      changeSummary: changeSummary.trim(),
      diffData: newDiff
    };

    // 상태 자동 업그레이드 (초안 draft ➔ 시민 검토 community_review)
    const updatedStatus = proposal.status === 'draft' ? 'community_review' : proposal.status;

    const updatedProposal: BillProposal = {
      ...proposal,
      status: updatedStatus,
      versions: [...proposal.versions, newVersionObj]
    };

    // 저장 및 반영
    saveProposalToLocalStorage(updatedProposal);
    setProposal(updatedProposal);
    setSelectedVersionNum(nextVerNum);
    setCurrentDiff(newDiff);
    setCurrentVersionInfo(newVersionObj);

    // 폼 클리어
    setChangeSummary('');
    setRevisedAuthor('');
    alert(`버전 ${nextVerNum}(으)로 성공적으로 위키 업데이트 보완이 접수되었습니다! 법률자문 검토가 가능한 단계로 성숙해집니다.`);
  };

  // 3. 법률자문단 공식 검토의견 상정
  const handleExpertOpinionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setExpertErrors([]);

    if (!proposal) return;

    const errors: string[] = [];
    if (!expertComment.trim() || expertComment.length < 15) {
      errors.push('자문위원 공식 검토의견을 15자 이상 구체적으로 적어주세요.');
    }
    if (!expertAuthor.trim()) {
      errors.push('자문위원 실명 혹은 소속 서명을 입력해 주세요.');
    }

    const scanResult = detectEmotionWords(expertComment);
    if (scanResult.hasEmotionWords) {
      errors.push(`검토서에 부적절한 감정 어휘가 감지되었습니다: [ ${scanResult.detectedWords.join(', ')} ]`);
    }

    if (errors.length > 0) {
      setExpertErrors(errors);
      return;
    }

    const newOpinion: LegalOpinion = {
      id: generateOpinionId(),
      authorName: expertAuthor.trim(),
      rating: expertRating,
      comment: expertComment.trim(),
      createdAt: new Date().toISOString()
    };

    // 상태 자동 업그레이드 (자문 검토 중으로 전이)
    const updatedStatus = proposal.status === 'finalized' ? 'finalized' : 'legal_review';

    const updatedProposal: BillProposal = {
      ...proposal,
      status: updatedStatus,
      legalOpinions: [...proposal.legalOpinions, newOpinion]
    };

    saveProposalToLocalStorage(updatedProposal);
    setProposal(updatedProposal);

    // 폼 클리어
    setExpertComment('');
    setExpertAuthor('');
    alert('헌법학/IT전문 법률자문 위원의 공식 검토 의견이 고정 보완되었습니다.');
  };

  // 법안 완료 확정 (입법 완성)
  const handleFinalizeProposal = () => {
    if (!proposal) return;
    if (proposal.legalOpinions.length === 0) {
      alert('법률자문단의 전문성 검토 의견이 최소 1건 이상 기입되어야 최종 완성 확정이 가능합니다.');
      return;
    }

    const updatedProposal: BillProposal = {
      ...proposal,
      status: 'finalized'
    };

    saveProposalToLocalStorage(updatedProposal);
    setProposal(updatedProposal);
    alert('축하합니다! 이 제안은 시민과 법률자문단이 힘을 모아 다듬어 낸 공식 완성 입법안으로 승격되었습니다.');
  };

  // 로컬스토리지 저장 유틸
  const saveProposalToLocalStorage = (updated: BillProposal) => {
    // 만일 MOCK 데이터 변경이면 로컬스토리지 user_proposals에 목록 병합 보관
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_proposals');
      const list: BillProposal[] = saved ? JSON.parse(saved) : [];
      
      const idx = list.findIndex(p => p.id === updated.id);
      if (idx !== -1) {
        list[idx] = updated;
      } else {
        // Mock 데이터의 동적 수정을 로컬에 보전하기 위해 목록에 끼워넣기
        list.push(updated);
      }
      localStorage.setItem('user_proposals', JSON.stringify(list));
    }
  };

  if (!proposal) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-1)', marginBottom: '16px' }}>시민 제안 법안을 찾을 수 없습니다.</h2>
        <Link href="/bills/propose" className="btn-secondary">제안 목록으로 돌아가기</Link>
      </div>
    );
  }

  // 4단계 타임라인 인덱스 계산
  const statusSteps = [
    { key: 'draft', label: '1. 시민 제안 초안' },
    { key: 'community_review', label: '2. 집단지성 보완' },
    { key: 'legal_review', label: '3. 법률자문 검토' },
    { key: 'finalized', label: '4. 최종 입법 완성' }
  ];
  
  const currentStepIdx = statusSteps.findIndex(s => s.key === proposal.status);

  return (
    <div style={{ padding: '32px 24px', maxWidth: '950px', margin: '0 auto' }}>
      
      {/* Breadcrumb */}
      <div style={{ marginBottom: '24px' }} className="fade-in">
        <Link href="/bills/propose" className="btn-secondary" style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          제안 목록으로 돌아가기
        </Link>
      </div>

      {/* ── 4단계 입법 성숙도 타임라인 (State Machine) ── */}
      <div className="card-base fade-in" style={{ padding: '24px 32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            입법 파이프라인 진행 상태 (Workflow Status)
          </h3>
          {proposal.status !== 'finalized' && (
            <button 
              onClick={handleFinalizeProposal}
              className="btn-primary" 
              style={{ padding: '5px 12px', fontSize: '10px', backgroundColor: 'var(--success)', border: 'none' }}
            >
              🚀 최종 입법 완성 확정
            </button>
          )}
        </div>
        
        {/* Horizontal Timeline Bar */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {statusSteps.map((step, idx) => {
            const isActive = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            
            let bg = 'var(--bg-3)';
            let color = 'var(--text-3)';
            let border = '1px solid var(--border)';
            
            if (isCurrent) {
              bg = 'var(--accent)';
              color = '#fff';
              border = '1px solid var(--accent)';
            } else if (isActive) {
              bg = 'var(--accent-bg)';
              color = 'var(--accent)';
              border = '1px solid var(--accent-border)';
            }

            return (
              <div 
                key={step.key}
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: bg,
                  color: color,
                  border: border,
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: isActive ? 800 : 500,
                  transition: 'all 0.3s ease'
                }}
              >
                {step.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 법안 Overview Card ── */}
      <div className="card-base fade-in" style={{ padding: '36px', marginBottom: '32px' }}>
        <span style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '10px', 
          fontWeight: 700, 
          color: 'var(--accent)',
          backgroundColor: 'var(--accent-bg)',
          padding: '2px 8px',
          borderRadius: '4px',
          border: '1px solid var(--accent-border)',
          display: 'inline-block',
          marginBottom: '12px'
        }}>
          국민 청원 제안 번호: {proposal.id}
        </span>

        <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '16px', lineHeight: 1.3 }}>
          {proposal.title}
        </h1>

        <div style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '16px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-1)', marginBottom: '6px' }}>핵심 입법 목적</h3>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
            {proposal.purpose}
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-1)', marginBottom: '6px' }}>상세 제안 배경 및 이유</h3>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {proposal.background}
          </p>
        </div>

        {/* ── Version Swapper & DiffViewer ── */}
        <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-2)', paddingTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
                📜 집단지성 위키 버전 이력 대조
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: '2px 0 0 0' }}>
                원안 대비 수정 보완된 각 텍스트 변화를 조문 증감표로 대입합니다.
              </p>
            </div>

            {/* Version Tabs */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {proposal.versions.map((v) => (
                <button
                  key={v.version}
                  onClick={() => handleVersionSelect(v.version)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: selectedVersionNum === v.version ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: selectedVersionNum === v.version ? 'var(--accent-bg)' : 'var(--bg-2)',
                    color: selectedVersionNum === v.version ? 'var(--accent)' : 'var(--text-2)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Version {v.version}
                </button>
              ))}
            </div>
          </div>

          {/* Current Version Log Summary */}
          {currentVersionInfo && (
            <div style={{ 
              backgroundColor: 'var(--bg-3)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '10px 14px', 
              marginBottom: '12px', 
              fontSize: '11px', 
              border: '1px solid var(--border-2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>기고 수정요약: <strong>&quot;{currentVersionInfo.changeSummary}&quot;</strong></span>
              <span style={{ color: 'var(--text-3)' }}>수정자: {currentVersionInfo.authorName} · {new Date(currentVersionInfo.createdAt).toLocaleString('ko-KR')}</span>
            </div>
          )}

          {/* DiffViewer Container */}
          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '12px', 
            backgroundColor: 'var(--bg-3)', 
            border: '1px solid var(--border)', 
            borderRadius: 'var(--radius-md)', 
            overflow: 'hidden'
          }}>
            {currentDiff.map((line, idx) => {
              const rowStyle: React.CSSProperties = { padding: '10px 16px', borderBottom: '1px solid var(--border-2)', display: 'flex', gap: '12px' };
              let indicator = ' ';
              let indicatorColor = 'var(--text-3)';

              if (line.type === 'added') {
                rowStyle.backgroundColor = 'rgba(22, 163, 74, 0.05)';
                rowStyle.color = 'var(--success)';
                rowStyle.borderLeft = '4px solid var(--success)';
                indicator = '+';
                indicatorColor = 'var(--success)';
              } else if (line.type === 'removed') {
                rowStyle.backgroundColor = 'rgba(220, 38, 38, 0.03)';
                rowStyle.color = 'var(--danger)';
                rowStyle.borderLeft = '4px solid var(--danger)';
                rowStyle.textDecoration = 'line-through';
                indicator = '-';
                indicatorColor = 'var(--danger)';
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

      {/* Grid bottom: 1. 기고/버전 갱신폼 & 2. 법률자문 의견 리스트 & 작성폼 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'flex-start' }} className="fade-in">
        
        {/* Left Col: 집단지성 조문 수정 기고 폼 */}
        <div className="card-base" style={{ padding: '28px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
          {sessionLoaded && !userSession && (
            <div style={{
              position: 'absolute', inset: 0,
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(0,0,0,0.32)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              zIndex: 20, gap: '14px', padding: '24px',
              border: '1px solid var(--border)'
            }}>
              <span style={{ fontSize: '28px' }}>🔒</span>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '6px' }}>
                  집단지성 기고는 로그인 후 참여 가능합니다
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-2)', lineHeight: 1.5 }}>
                  시민 입법 조문 보완 활동에 참여하려면<br />시민 회원으로 로그인해 주세요.
                </p>
              </div>
              <Link href="/login" className="btn-primary" style={{ padding: '8px 24px', fontSize: 'var(--font-xs)' }}>
                체험 로그인하기
              </Link>
            </div>
          )}

          <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-1)', marginBottom: '4px' }}>
            👥 집단지성 조안 보완 참여
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '16px' }}>
            법률적 실효성을 기하기 위해 조문의 자구를 개정 보완하여 Version을 상정해 주세요.
          </p>

          {revisionErrors.length > 0 && (
            <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.04)', border: '1px solid rgba(220, 38, 38, 0.15)', borderRadius: 'var(--radius-sm)', padding: '10px', marginBottom: '14px', fontSize: '11px', color: 'var(--danger)' }}>
              {revisionErrors.map((err, idx) => <div key={idx}>{err}</div>)}
            </div>
          )}

          <form onSubmit={handleRevisionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="newProposedText" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-2)' }}>보완된 개정 조안 <span style={{ color: 'var(--danger)' }}>*</span></label>
              <textarea 
                id="newProposedText"
                rows={4} 
                placeholder="이전 버전을 참고하여 더 정밀하고 법리적 충돌이 없는 조문을 기입해 주세요."
                value={newProposedText}
                onChange={(e) => setNewProposedText(e.target.value)}
                style={{ padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-1)', fontSize: '12px', outline: 'none', resize: 'vertical', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="changeSummary" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-2)' }}>수정 보완 요약 <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  id="changeSummary"
                  type="text" 
                  placeholder="예: 예방 기술 한계 고려 사전동의제로 보완"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  style={{ padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-1)', fontSize: '11px', outline: 'none' }}
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="revisedAuthor" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-2)' }}>시민 위원 서명 <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  id="revisedAuthor"
                  type="text" 
                  placeholder="예: 집단지성_홍길동"
                  value={revisedAuthor}
                  onChange={(e) => setRevisedAuthor(e.target.value)}
                  style={{ padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-1)', fontSize: '11px', outline: 'none' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '10px', fontSize: '11px', fontWeight: 800 }}>
              ⬆️ 새 버전(Revision)으로 조문 갱신 상정
            </button>
          </form>
        </div>

        {/* Right Col: 법률자문 검토의견 리스트 및 작성폼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 자문단 의견 리스트 */}
          <div className="card-base" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-1)', marginBottom: '14px' }}>
              ⚖️ 법률자문단 공식 검토서 ({proposal.legalOpinions.length}건)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {proposal.legalOpinions.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: '11px', backgroundColor: 'var(--bg-3)', borderRadius: 'var(--radius-sm)' }}>
                  등록된 전문 법리 검토의견이 없습니다. 자문 Presets 계정으로 검토 의견을 수렴해 주세요.
                </div>
              ) : (
                proposal.legalOpinions.map((op) => {
                  let badgeText = '합헌 판정';
                  let badgeColor = 'var(--success)';
                  let badgeBg = 'rgba(22, 163, 74, 0.05)';
                  
                  if (op.rating === 'needs_amendment') {
                    badgeText = '수정보완 필요';
                    badgeColor = 'var(--warning)';
                    badgeBg = 'rgba(251, 191, 36, 0.05)';
                  } else if (op.rating === 'unconstitutional') {
                    badgeText = '위헌 소지 있음';
                    badgeColor = 'var(--danger)';
                    badgeBg = 'rgba(220, 38, 38, 0.04)';
                  }

                  return (
                    <div 
                      key={op.id} 
                      style={{ 
                        border: '1px solid var(--border-2)', 
                        borderRadius: 'var(--radius-sm)', 
                        padding: '16px', 
                        backgroundColor: 'var(--bg-2)' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: badgeColor,
                          backgroundColor: badgeBg,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: `1px solid ${badgeColor}20`
                        }}>
                          {badgeText}
                        </span>
                        
                        <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                          {op.authorName} · {new Date(op.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      
                      <p style={{ fontSize: '11px', color: 'var(--text-2)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                        {op.comment}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 자문단 패널 작성 폼 (인증된 자문위원/expert 권한인 경우에만 편의상 폼을 열거나, 혹은 누구나 시뮬레이트하도록 렌더링하고 체험안내 배치) */}
          <div className="card-base" style={{ padding: '24px', border: '1px solid var(--warning)', backgroundColor: 'rgba(251, 191, 36, 0.01)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
                🎓 법률자문단 전용 검토 패널 (LegalReviewPanel)
              </h3>
              {userRole !== 'expert' && (
                <span style={{ fontSize: '9px', color: 'var(--danger)', fontWeight: 700, backgroundColor: 'rgba(220, 38, 38, 0.04)', padding: '2px 6px', borderRadius: '4px' }}>
                  체험 비활성
                </span>
              )}
            </div>

            {userRole !== 'expert' ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '11px', color: 'var(--text-2)', backgroundColor: 'var(--bg-3)', borderRadius: 'var(--radius-sm)' }}>
                의견 접수는 <strong>[자문위원]</strong>Preset 계정 상태에서만 승인 권한이 열립니다. 
                <div style={{ marginTop: '8px' }}>
                  <Link href="/login" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '10px', textDecoration: 'none', display: 'inline-block' }}>
                    자문위원 Preset 로그인하러 가기
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleExpertOpinionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {expertErrors.length > 0 && (
                  <div style={{ color: 'var(--danger)', fontSize: '10px', marginBottom: '6px' }}>
                    {expertErrors.join(', ')}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-2)' }}>법리 합헌성 종합 평정 <span style={{ color: 'var(--danger)' }}>*</span></span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setExpertRating('constitutional')}
                      style={{
                        flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid',
                        borderColor: expertRating === 'constitutional' ? 'var(--success)' : 'var(--border)',
                        backgroundColor: expertRating === 'constitutional' ? 'rgba(22, 163, 74, 0.05)' : 'var(--bg-2)',
                        color: expertRating === 'constitutional' ? 'var(--success)' : 'var(--text-2)',
                        fontSize: '10px', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      🟢 합헌 판정
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpertRating('needs_amendment')}
                      style={{
                        flex: 1.2, padding: '6px', borderRadius: '4px', border: '1px solid',
                        borderColor: expertRating === 'needs_amendment' ? 'var(--warning)' : 'var(--border)',
                        backgroundColor: expertRating === 'needs_amendment' ? 'rgba(251, 191, 36, 0.05)' : 'var(--bg-2)',
                        color: expertRating === 'needs_amendment' ? 'var(--warning)' : 'var(--text-2)',
                        fontSize: '10px', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      🟡 수정보완
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpertRating('unconstitutional')}
                      style={{
                        flex: 1.2, padding: '6px', borderRadius: '4px', border: '1px solid',
                        borderColor: expertRating === 'unconstitutional' ? 'var(--danger)' : 'var(--border)',
                        backgroundColor: expertRating === 'unconstitutional' ? 'rgba(220, 38, 38, 0.04)' : 'var(--bg-2)',
                        color: expertRating === 'unconstitutional' ? 'var(--danger)' : 'var(--text-2)',
                        fontSize: '10px', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      🔴 위헌 소지
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="expertComment" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-2)' }}>자문위원 정밀 검토 서설 (15자 이상) <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <textarea 
                    id="expertComment"
                    rows={3} 
                    placeholder="조항의 헌법적 충돌 여부 및 타 법안과의 중복 여부, 기술적 실효성을 기입해 주세요."
                    value={expertComment}
                    onChange={(e) => setExpertComment(e.target.value)}
                    style={{ padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-1)', fontSize: 'var(--font-xs)', outline: 'none', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="expertAuthor" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-2)' }}>자문위원 서명 및 소속 <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input 
                    id="expertAuthor"
                    type="text" 
                    placeholder="예: 헌법학_이준열 교수"
                    value={expertAuthor}
                    onChange={(e) => setExpertAuthor(e.target.value)}
                    style={{ padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-1)', fontSize: 'var(--font-xs)', outline: 'none' }}
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ padding: '8px', fontSize: '10px', fontWeight: 800, backgroundColor: 'var(--warning)', borderColor: 'var(--warning)', color: 'var(--bg)' }}>
                  ✍️ 공식 법률자문 검토 의견 공식 등재
                </button>

              </form>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
