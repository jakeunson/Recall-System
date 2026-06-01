'use client';

import React from 'react';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

interface DiffViewerProps {
  lines: DiffLine[];
}

export default function DiffViewer({ lines }: DiffViewerProps) {
  return (
    <div style={{ 
      backgroundColor: 'var(--bg-3)', 
      border: '1px solid var(--border)', 
      borderRadius: '8px', 
      overflow: 'hidden',
      fontFamily: 'var(--font-mono)',
      fontSize: '13px',
      lineHeight: '1.6'
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>법안 개정안 대조표</span>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: 'rgba(74, 222, 128, 0.2)', border: '1px solid var(--success)', borderRadius: '2px' }}></span>
            신설
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: 'rgba(248, 113, 113, 0.2)', border: '1px solid var(--danger)', borderRadius: '2px' }}></span>
            삭제
          </span>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {lines.map((line, i) => {
              const bgColor = 
                line.type === 'added' ? 'rgba(74, 222, 128, 0.08)' : 
                line.type === 'removed' ? 'rgba(248, 113, 113, 0.08)' : 
                'transparent';
              
              const signColor = 
                line.type === 'added' ? 'var(--success)' : 
                line.type === 'removed' ? 'var(--danger)' : 
                'var(--text-3)';

              const sign = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ';

              return (
                <tr key={i} style={{ backgroundColor: bgColor }}>
                  <td style={{ 
                    width: '40px', 
                    textAlign: 'center', 
                    color: 'var(--text-3)', 
                    borderRight: '1px solid var(--border)',
                    userSelect: 'none',
                    fontSize: '11px'
                  }}>{i + 1}</td>
                  <td style={{ 
                    width: '30px', 
                    textAlign: 'center', 
                    color: signColor, 
                    fontWeight: 800,
                    fontSize: '14px',
                    userSelect: 'none'
                  }}>{sign}</td>
                  <td style={{ 
                    padding: '2px 12px', 
                    color: line.type === 'unchanged' ? 'var(--text-2)' : 'var(--text-1)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {line.text}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
