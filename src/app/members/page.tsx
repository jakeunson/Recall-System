'use client';

import React from 'react';
import Link from 'next/link';
import { MOCK_MEMBERS } from '@/lib/mock-data';

export default function MembersPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 600, marginBottom: '8px' }}>국회의원 평가</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 'var(--font-sm)' }}>전체 의원의 프로필과 최신 평가 기록을 확인하세요.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-2)', backgroundColor: 'var(--bg-2)', fontSize: 'var(--font-sm)' }}>
            <option>전체 정당</option>
            <option>국민의힘</option>
            <option>더불어민주당</option>
            <option>개혁신당</option>
            <option>조국혁신당</option>
          </select>
          <select style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-2)', backgroundColor: 'var(--bg-2)', fontSize: 'var(--font-sm)' }}>
            <option>전체 지역</option>
            <option>수도권</option>
            <option>영남권</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {MOCK_MEMBERS.map((member) => (
          <Link key={member.id} href={`/members/${member.id}`} className="card-base" style={{ display: 'flex', flexDirection: 'column', gap: '20px', textDecoration: 'none', color: 'inherit', padding: '24px' }}>
            <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: 'var(--text-1)', border: '1px solid var(--border-2)', flexShrink: 0 }}>
                {member.name.substring(0, 1)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'var(--font-lg)', fontWeight: 600 }}>{member.name}</span>
                  <span className="mono" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-2)', backgroundColor: 'var(--bg-3)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>{member.party}</span>
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', fontWeight: 600 }}>{member.region}</div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: 'var(--bg-3)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', marginBottom: '6px', fontWeight: 600 }}>신뢰도</div>
                <div style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{member.trustScore}</div>
              </div>
              {member.indicators?.[0] && (
                <div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', marginBottom: '6px', fontWeight: 600 }}>{member.indicators[0].label}</div>
                  <div style={{ fontSize: 'var(--font-lg)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{member.indicators[0].value}%</div>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
