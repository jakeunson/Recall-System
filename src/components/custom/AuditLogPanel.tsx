'use client';

import { useState } from 'react';

interface AuditEntry {
  timestamp: string;
  entityId: string;
  field: string;
  valueBefore: string;
  valueAfter: string;
  hash: string;
  operator: string;
}

interface AuditLogPanelProps {
  memberId: string;
  memberName: string;
}

/** PRD Section 4.2 기반 Mock 감사 로그 데이터 */
function generateMockAuditLog(memberId: string): AuditEntry[] {
  const now = new Date();
  return [
    {
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
      entityId: memberId,
      field: 'trustScore',
      valueBefore: '72',
      valueAfter: '75',
      hash: 'a3f8c2e1d4b7f9a2c5e8b1d4f7a0c3e6',
      operator: 'SYSTEM_BATCH',
    },
    {
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
      entityId: memberId,
      field: 'wdi_score',
      valueBefore: '28.4',
      valueAfter: '31.2',
      hash: 'b7e1f4a2d8c5f0a3e6b9d2c7f1a4e7b0',
      operator: 'SYSTEM_BATCH',
    },
    {
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(),
      entityId: memberId,
      field: 'masking_applied',
      valueBefore: 'raw_statement',
      valueAfter: 'masked_statement',
      hash: 'c4a9e2b6f1d8c3a7e0b5d9c2f6a1e4b8',
      operator: 'MASKING_ENGINE',
    },
  ];
}

/**
 * AuditLogPanel — PRD Section 4.2 Immutable Audit Log의 경량 UI 구현.
 * Mock 데이터 기반. 실제 CSV/DB 연동은 Phase 3에서 확장.
 */
export default function AuditLogPanel({ memberId, memberName }: AuditLogPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const auditLog = generateMockAuditLog(memberId);

  return (
    <>
      {/* 트리거 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: 'var(--font-xs)',
          color: 'var(--text-3)',
          background: 'none',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 12px',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.color = 'var(--accent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--text-3)';
        }}
        title="PRD Section 4.2 데이터 변경 감사 로그 조회"
      >
        <span>🔍</span>
        <span>데이터 변경 이력 조회 ⓘ</span>
      </button>

      {/* 모달 오버레이 */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            animation: 'fadeIn 0.15s ease',
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: '28px',
              animation: 'tooltipFadeIn 0.2s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-1)', marginBottom: '4px' }}>
                  🔍 데이터 감사 로그
                </h3>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', margin: 0 }}>
                  {memberName} 의원 · PRD Section 4.2 Immutable Audit Log
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-3)', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* 설명 배너 */}
            <div style={{ backgroundColor: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: '20px', fontSize: 'var(--font-xs)', color: 'var(--text-2)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-1)' }}>⚠️ Mock 데이터 안내</strong><br />
              현재는 PRD Section 4.2 기준 구조를 보여주는 예시 데이터입니다.
              실제 운영 시 SHA-256 해시 기반 불변 감사 로그와 연동됩니다.
            </div>

            {/* 로그 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {auditLog.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px 16px',
                    backgroundColor: 'var(--bg-2)',
                    fontSize: 'var(--font-xs)',
                  }}
                >
                  {/* 타임스탬프 + 운영자 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: 'var(--text-3)' }}>
                      {new Date(entry.timestamp).toLocaleString('ko-KR')}
                    </span>
                    <span style={{
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '10px',
                      backgroundColor: 'var(--accent-bg)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}>
                      {entry.operator}
                    </span>
                  </div>

                  {/* 변경 필드 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ color: 'var(--text-3)', marginBottom: '2px' }}>변경 필드</div>
                      <strong style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{entry.field}</strong>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-3)', marginBottom: '2px' }}>변경 전</div>
                      <span style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)', textDecoration: 'line-through' }}>{entry.valueBefore}</span>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-3)', marginBottom: '2px' }}>변경 후</div>
                      <span style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{entry.valueAfter}</span>
                    </div>
                  </div>

                  {/* SHA-256 해시 */}
                  <div style={{ backgroundColor: 'var(--bg-3)', borderRadius: '4px', padding: '6px 10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }}>SHA-256:</span>
                    <code style={{ fontSize: '10px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                      {entry.hash}
                    </code>
                  </div>
                </div>
              ))}
            </div>

            {/* 하단 닫기 */}
            <div style={{ marginTop: '20px', textAlign: 'right', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button
                onClick={() => setIsOpen(false)}
                className="btn-secondary"
                style={{ padding: '8px 20px', fontSize: 'var(--font-xs)' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
