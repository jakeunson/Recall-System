import React from 'react';

export const NAV_ITEMS = [
  { label: '홈', path: '/', icon: 'home' },
  { label: '대시보드', path: '/dashboard', icon: 'bar-chart' },
  { label: '블라인드 평가', path: '/blind', icon: 'eye-off' },
  { label: '법안 토론', path: '/bills', icon: 'file-text' },
  { label: '공개 질의', path: '/questions', icon: 'message-square' },
  { label: '의원 리포트', path: '/members', icon: 'users' },
] as const;

export function getIconSvg(name: string, isActive: boolean) {
  const color = isActive ? 'currentColor' : 'currentColor';
  const className = "w-4 h-4";
  
  switch (name) {
    case 'home':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
    case 'bar-chart':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>;
    case 'eye-off':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>;
    case 'file-text':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
    case 'message-square':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
    case 'users':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
    default:
      return null;
  }
}
