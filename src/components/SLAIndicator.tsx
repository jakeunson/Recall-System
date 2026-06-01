'use client';

import React, { useState, useEffect } from 'react';

interface SLAIndicatorProps {
  createdAt: string; // 질의 등록일 (ISO string)
  deadline: string;  // 답변 마감일 (ISO string)
  status: 'open' | 'answered' | 'closed' | 'disputed';
  questionId: string;
}

export default function SLAIndicator({ createdAt, deadline, status, questionId }: SLAIndicatorProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(deadline).getTime();
      const start = new Date(createdAt).getTime();
      
      const totalDuration = end - start;
      const remaining = end - now;

      if (remaining <= 0 || status === 'closed') {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        setProgress(0);
        return;
      }

      // 프로그레스 바 백분율 계산
      const currentProgress = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
      setProgress(currentProgress);

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [createdAt, deadline, status]);

  // 소환 청원 공식 상정 이벤트 핸들러
  const handleInitiateRecall = () => {
    alert(`[공식 경고] 질의 ID ${questionId}의 답변 기한이 초과되었습니다. 시민 3,000명의 동의를 모아 이 국회의원에 대한 '공식 국민소환 서명 운동' 청원을 선거관리위원회에 전달하기 위한 프로세스가 가동되었습니다!`);
  };

  const isExpired = timeLeft.expired && status !== 'answered' && status !== 'disputed';

  return (
    <div className="card-base" style={{ padding: '24px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <h4 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>
          ⏳ 국회의원 답변 데드라인 (7일 SLA)
        </h4>

        {/* 상태 배지 */}
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: '4px',
          backgroundColor: (status === 'answered' || status === 'disputed') ? 'rgba(22, 163, 74, 0.05)' : isExpired ? 'rgba(220, 38, 38, 0.04)' : 'rgba(251, 191, 36, 0.05)',
          color: (status === 'answered' || status === 'disputed') ? 'var(--success)' : isExpired ? 'var(--danger)' : 'var(--warning)',
          border: `1px solid ${(status === 'answered' || status === 'disputed') ? 'var(--success)' : isExpired ? 'var(--danger)' : 'var(--warning)'}20`
        }}>
          {status === 'answered' ? '✔️ 공식 답변 완료' : status === 'disputed' ? '⚖️ 이의 신청 재심사 중' : isExpired ? '❌ 미응답 만료됨' : '🕒 답변 대기 상태'}
        </span>
      </div>

      {(status === 'answered' || status === 'disputed') ? (
        <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(22, 163, 74, 0.03)', border: '1px dashed rgba(22, 163, 74, 0.2)', fontSize: '12px', color: 'var(--text-1)', lineHeight: 1.5 }}>
          {status === 'disputed'
            ? '⚖️ 의원실에서 AI AQS 채점 결과에 대한 정식 이의 신청을 제기하여 전문 자문위원단의 정밀 재심사가 진행 중입니다.'
            : '🎉 지정된 국회의원실에서 공식 소명 답변서를 등재 완료했습니다. 답변 내역은 법리 및 사실관계를 바탕으로 팩트체크가 진행 중입니다.'}
        </div>
      ) : isExpired ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--danger)', lineHeight: 1.6, fontWeight: 700 }}>
            ⚠️ 경고: 지정된 답변 데드라인이 종료되었으나 해당 의원은 공식 소명을 회피했습니다. 이에 의해 신뢰 평판 점수 감점 조치 및 소환장 가동 요건이 활성화되었습니다.
          </div>

          <button
            onClick={handleInitiateRecall}
            className="btn-primary"
            style={{
              padding: '12px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: 'var(--danger)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            🚨 미응답 규탄: 해당 의원 국민소환 청원 상정 발의
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 타이머 카운트다운 */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
              {String(timeLeft.days).padStart(2, '0')}
              <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 500, marginLeft: '2px', marginRight: '6px' }}>일</span>
              {String(timeLeft.hours).padStart(2, '0')}
              <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 500, marginLeft: '2px', marginRight: '6px' }}>시</span>
              {String(timeLeft.minutes).padStart(2, '0')}
              <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 500, marginLeft: '2px', marginRight: '6px' }}>분</span>
              {String(timeLeft.seconds).padStart(2, '0')}
              <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 500, marginLeft: '2px' }}>초</span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>(마감: {new Date(deadline).toLocaleString('ko-KR')})</span>
          </div>

          {/* 슬라이딩 프로그레스 바 */}
          <div style={{ height: '6px', backgroundColor: 'var(--bg-3)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: progress <= 25 ? 'var(--danger)' : progress <= 50 ? 'var(--warning)' : 'var(--success)',
                transition: 'width 1s linear',
                borderRadius: '3px'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
