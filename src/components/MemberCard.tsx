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
    
    // Simulate delay before revealing (2 seconds)
    setTimeout(() => {
      setState('revealing');
      setTimeout(() => {
        setState('revealed');
      }, 400); // Animation duration
    }, 1500);
  };

  return (
    <div className="card-base" style={{
      background: 'var(--bg-3)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top Section: Identity (Masked or Revealed) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>의원 식별 코드</span>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: 700, 
            color: state === 'revealed' ? 'var(--text-1)' : 'var(--text-2)',
            transition: 'color 0.4s ease'
          }}>
            {state === 'revealed' ? member.name : anonymousId}
          </h3>
          {state === 'revealed' && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', animation: 'fadeIn 0.4s ease' }}>
              <span style={{ 
                fontSize: '11px', 
                padding: '2px 8px', 
                backgroundColor: 'var(--border)', 
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-2)'
              }}>{member.party}</span>
              <span style={{ 
                fontSize: '11px', 
                padding: '2px 8px', 
                backgroundColor: 'var(--border)', 
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-2)'
              }}>{member.region}</span>
            </div>
          )}
        </div>
        <GaugeRing value={member.trustScore} size={70} />
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 -24px' }} />

      {/* Content Section: Behavior Data */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <RadarChart indicators={member.indicators} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-2)', backgroundColor: 'var(--bg-2)', padding: '12px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent)' }}>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>주요 발언 (마스킹 처리됨)</span>
            &ldquo;{member.statements[0].text}&rdquo;
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {member.indicators.slice(0, 4).map((ind, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-3)' }}>{ind.label}</span>
                <span className="mono" style={{ color: 'var(--text-2)' }}>{ind.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interaction Section */}
      <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
        {state === 'blind' ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => handleVote('agree')}
              style={{ 
                flex: 1, 
                padding: '12px', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid var(--success)', 
                color: 'var(--success)',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(74, 222, 128, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >동의</button>
            <button 
              onClick={() => handleVote('disagree')}
              style={{ 
                flex: 1, 
                padding: '12px', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid var(--danger)', 
                color: 'var(--danger)',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >비동의</button>
          </div>
        ) : (
          <div style={{ 
            height: '46px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'var(--bg-2)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            color: 'var(--text-2)',
            border: '1px solid var(--border)'
          }}>
            {state === 'voted' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="spinner" style={{ width: '12px', height: '12px', border: '2px solid var(--text-3)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                데이터 출처 분석 중...
              </div>
            )}
            {(state === 'revealing' || state === 'revealed') && (
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>검증 완료: {vote === 'agree' ? '동의' : '비동의'} 평가됨</span>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
