import { useState, useEffect, useCallback } from 'react';

const isClient = typeof window !== 'undefined';

export const useSession = () => {
  const [session, setSession] = useState<{ id: string; displayName: string; trustLevel: number } | null>(null);

  const fetchSession = useCallback(() => {
    if (!isClient) return;
    const saved = localStorage.getItem('user_session');
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch {
        setSession(null);
      }
    } else {
      setSession(null);
    }
  }, []);

  useEffect(() => {
    fetchSession();

    const handleSessionChange = () => {
      fetchSession();
    };

    window.addEventListener('user-session-changed', handleSessionChange);
    window.addEventListener('storage', handleSessionChange);

    return () => {
      window.removeEventListener('user-session-changed', handleSessionChange);
      window.removeEventListener('storage', handleSessionChange);
    };
  }, [fetchSession]);

  const login = (displayName: string, trustLevel: number = 5) => {
    const newSession = { id: `U_${Date.now()}`, displayName, trustLevel };
    localStorage.setItem('user_session', JSON.stringify(newSession));
    window.dispatchEvent(new Event('user-session-changed'));
    return newSession;
  };

  const logout = () => {
    localStorage.removeItem('user_session');
    window.dispatchEvent(new Event('user-session-changed'));
  };

  return { session, login, logout, isAuthenticated: !!session };
};
