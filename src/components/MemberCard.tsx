'use client';

import React, { useState } from 'react';
import RadarChart from './RadarChart';
import GaugeRing from './GaugeRing';

interface MemberData {
  id: string;
  name: string;
  party: string;
  region: string;
  trustScore: number;
  indicators: { label: string; value: number }[];
  statements: { text: string; category: string }[];
}

interface MemberCardProps {
  member: MemberData;
  anonymousId: string;
}

export default function MemberCard({ member, anonymousId }: MemberCardProps) {
  const [state, setState] = useState<'blind' | 'voted' | 'revealing' | 'revealed'>('blind');
  const [vote, setVote] = useState<'agree' | 'disagree' | null>(null);

  const handleVote = (type: 'agree' | 'disagree') => {
    setVote(type);
    setState('voted');

    setTimeout(() => {
      setState('revealing');
      setTimeout(() => {
        setState('revealed');
      }, 400);
    }, 1500);
  };

  return (
    <div className="card-base" style={{
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Top Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: state === 'revealed' ? 'var(--text-1)' : 'var(--text-2)',
            transition: 'color 0.4s ease',
          }}>
            {state === 'revealed' ? member.name : anonymousId}
          </h3>
          {state === 'revealed' && (
            <div style={{ display: 'flex', gap: '6px', animation: 'fadeIn 0.4s ease' }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '3px 10px',
                backgroundColor: 'var(--bg-3)',
                borderRadius: '12px',
                color: 'var(--text-2)',
              }}>{member.party}</span>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '3px 10px',
                backgroundColor: 'var(--bg-3)',
                borderRadius: '12px',
                color: 'var(--text-2)',
              }}>{member.region}</span>
            </div>
          )}
        </div>
        <GaugeRing value={member.trustScore} size={64} strokeWidth={5} />
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 -24px' }} />

      {/* Content Section */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {state === 'revealed' && <RadarChart indicators={member.indicators} />}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-1)',
            backgroundColor: 'var(--bg-3)',
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
            lineHeight: 1.6,
          }}>
            <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-3)', marginBottom: '8px' }}>주요 발언 요약</span>
            &ldquo;{member.statements[0].text}&rdquo;
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {member.indicators.slice(0, 4).map((ind, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-2)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{ind.label}</span>
                <span style={{ color: 'var(--text-1)', fontWeight: 700 }}>{ind.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interaction Section */}
      <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
        {state === 'blind' ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleVote('agree')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(22, 163, 74, 0.3)',
                color: 'var(--success)',
                fontSize: 'var(--font-sm)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
                backgroundColor: 'rgba(22, 163, 74, 0.05)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(22, 163, 74, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(22, 163, 74, 0.05)'}
            >동의합니다</button>
            <button
              onClick={() => handleVote('disagree')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                color: 'var(--danger)',
                fontSize: 'var(--font-sm)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
                backgroundColor: 'rgba(220, 38, 38, 0.05)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.05)'}
            >동의하지 않습니다</button>
          </div>
        ) : (
          <div style={{
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-sm)',
            border: 'none',
            gap: '8px',
          }}>
            {state === 'voted' && (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid var(--border-2)',
                  borderTop: '2px solid var(--text-2)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>처리 중...</span>
              </>
            )}
            {(state === 'revealing' || state === 'revealed') && (
              <span style={{ color: 'var(--text-1)', fontWeight: 700 }}>
                평가 완료 · {vote === 'agree' ? '동의' : '비동의'}
              </span>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
