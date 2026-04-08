'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  clearUserSession,
  getFirstName,
  getStoredUserSession,
  saveUserSession,
  USER_SESSION_CHANGE_EVENT,
  type UserSession,
} from '@/lib/session/session-storage';

export function useUserSession() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const syncSession = () => {
      setSession(getStoredUserSession());
      setIsHydrated(true);
    };

    syncSession();
    window.addEventListener('storage', syncSession);
    window.addEventListener(USER_SESSION_CHANGE_EVENT, syncSession);

    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener(USER_SESSION_CHANGE_EVENT, syncSession);
    };
  }, []);

  const firstName = useMemo(() => {
    if (!session) return '';
    return getFirstName(session.fullName);
  }, [session]);

  function login(nextSession: UserSession) {
    saveUserSession(nextSession);
    setSession(nextSession);
  }

  function logout() {
    clearUserSession();
    setSession(null);
  }

  return {
    session,
    firstName,
    isHydrated,
    isAuthenticated: Boolean(session),
    login,
    logout,
  };
}
