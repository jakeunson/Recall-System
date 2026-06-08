import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { Member } from '@/lib/types';
import RadarChart from '@/components/RadarChart';
import GaugeRing from '@/components/GaugeRing';

// trustScore 기반 아바타 배경색 반환
function getAvatarColor(score: number): { bg: string; color: string } {
  if (score >= 75) return { bg: 'bg-success/10', color: 'text-success' };
  if (score >= 50) return { bg: 'bg-warning/10', color: 'text-warning' };
  return { bg: 'bg-danger/10', color: 'text-danger' };
}

// 정당별 브랜드 색상 (Hex -> RGBA 지원)
function getPartyColor(party: string): string {
  switch (party) {
    case '국민의힘': return '#E61E2B';
    case '더불어민주당': return '#004EA2';
    case '개혁신당': return '#FF7F00';
    case '조국혁신당': return '#0073CF';
    default: return 'var(--color-border-2)';
  }
}

export default async function MembersPage() {
  const supabase = await createClient();
  const { data: members } = await supabase.from('members').select('*');
  const membersList: Member[] = members || [];

  return (
    <div className="flex flex-col gap-8 fade-in">

      {/* Page Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold mb-1.5">국회의원 평가</h1>
          <p className="text-muted-foreground text-sm">전체 의원의 프로필과 최신 평가 기록을 확인하세요.</p>
        </div>
        <div className="flex gap-2">
          {/* We'll use standard tailwind select for simplicity if shadcn select needs client side state, since this is an async component */}
          <div className="relative">
            <select className="appearance-none py-2 pl-3.5 pr-8 rounded-sm border border-border bg-card text-sm text-foreground cursor-pointer outline-none font-sans">
              <option>전체 정당</option>
              <option>국민의힘</option>
              <option>더불어민주당</option>
              <option>개혁신당</option>
              <option>조국혁신당</option>
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <div className="relative">
            <select className="appearance-none py-2 pl-3.5 pr-8 rounded-sm border border-border bg-card text-sm text-foreground cursor-pointer outline-none font-sans">
              <option>전체 지역</option>
              <option>수도권</option>
              <option>영남권</option>
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {membersList.map((member) => {
          const avatarColors = getAvatarColor(member.trustScore);
          const partyColor = getPartyColor(member.party);
          const defenseRate = member.indicators?.find(ind => ind.label === '내로남불 방어율')?.value || 0;
          
          // mockup style progress indicators (using the first 4 indicators)
          const displayIndicators = member.indicators?.slice(0, 4) || [
            { label: '출석률', value: 96 },
            { label: '법안통과율', value: 45 },
            { label: '발언일치율', value: 88 },
            { label: '공약이행률', value: 72 }
          ];

          return (
            <Link 
              key={member.id} 
              href={`/members/${member.id}`} 
              className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden transition-all hover:border-border-2 hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Top: Photo & Info */}
              <div className="p-6 flex items-start gap-4">
                <div 
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden ${avatarColors.bg} ${avatarColors.color}`} 
                  style={{ border: `2px solid ${partyColor}40` }}
                >
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    member.name.substring(0, 1)
                  )}
                </div>
                
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h2 className="text-xl font-extrabold text-foreground tracking-tight group-hover:text-accent transition-colors">
                      {member.name}
                    </h2>
                  </div>
                  <p className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: partyColor }}></span>
                    {member.party} <span className="opacity-50">|</span> {member.region}
                  </p>
                </div>

                <div className="shrink-0 -mt-1">
                  <GaugeRing 
                    value={member.trustScore} 
                    size={56} 
                    strokeWidth={4} 
                    label="신뢰" 
                  />
                </div>
              </div>

              {/* Middle: Radar Chart */}
              <div className="border-y border-border/60 bg-bg/50 py-5 flex items-center justify-center">
                <RadarChart indicators={member.indicators || []} size={180} />
              </div>

              {/* Bottom: Progress Bars */}
              <div className="p-6 flex flex-col gap-4 mt-auto bg-card">
                {displayIndicators.map(ind => (
                  <div key={ind.label} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-muted-foreground text-xs font-medium tracking-wide">
                        {ind.label}
                      </span>
                      <span className="text-foreground text-sm font-bold font-mono">
                        {ind.value}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-border/50">
                      <div 
                        className="h-full bg-accent rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${ind.value}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Link>
          );
        })}
      </div>


    </div>
  );
}
