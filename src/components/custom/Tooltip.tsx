'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface TooltipProps {
  /** 팝오버에 표시할 내용 (줄바꿈은 \n 사용) */
  content: string;
  children: ReactNode;
  /** 팝오버 너비 (기본값: 280px) */
  width?: number;
  /** 팝오버 방향 (기본값: top) */
  placement?: 'top' | 'bottom';
}

/**
 * 호버 시 알고리즘 설명 팝오버를 표시하는 Tooltip 컴포넌트.
 * PRD 수식·가중치 등의 근거를 UI에 노출하기 위해 사용한다.
 */
export default function Tooltip({
  content,
  children,
  width = 280,
  placement = 'top',
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const show = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(true);
  };

  const hide = () => {
    timerRef.current = setTimeout(() => setVisible(false), 100);
  };

  const popoverStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    width,
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-md)',
    fontSize: 'var(--font-xs)',
    lineHeight: 1.65,
    whiteSpace: 'pre-wrap',
    color: 'var(--text-2)',
    zIndex: 200,
    pointerEvents: 'none',
    // 등장 애니메이션
    animation: 'tooltipFadeIn 0.15s ease',
    ...(placement === 'top'
      ? { bottom: 'calc(100% + 10px)' }
      : { top: 'calc(100% + 10px)' }),
  };

  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%) rotate(45deg)',
    width: 8,
    height: 8,
    background: 'var(--bg)',
    ...(placement === 'top'
      ? {
          bottom: -5,
          borderRight: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }
      : {
          top: -5,
          borderLeft: '1px solid var(--border)',
          borderTop: '1px solid var(--border)',
        }),
  };

  return (
    <>
      {/* 전역 애니메이션 — 한 번만 주입 */}
      <style>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <span
        style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
        {visible && (
          <span style={popoverStyle}>
            {content}
            <span style={arrowStyle} />
          </span>
        )}
      </span>
    </>
  );
}
