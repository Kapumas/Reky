export const USER_SESSION_STORAGE_KEY = 'reky_user_session';
export const USER_SESSION_CHANGE_EVENT = 'reky:user-session-changed';

export interface UserSession {
  apartmentNumber: string;
  fullName: string;
  userId?: string;
}

function normalizeApartmentNumber(apartmentNumber: string): string {
  return apartmentNumber.trim().toUpperCase();
}

function normalizeFullName(fullName: string): string {
  return fullName.trim().replace(/\s+/g, ' ');
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getFirstName(fullName: string): string {
  const normalized = normalizeFullName(fullName);
  if (!normalized) return '';

  return normalized.split(' ')[0];
}

export function getStoredUserSession(): UserSession | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(USER_SESSION_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<UserSession>;
    if (!parsed.apartmentNumber || !parsed.fullName) {
      return null;
    }

    return {
      apartmentNumber: normalizeApartmentNumber(parsed.apartmentNumber),
      fullName: normalizeFullName(parsed.fullName),
      userId: parsed.userId,
    };
  } catch {
    return null;
  }
}

export function saveUserSession(session: UserSession): void {
  if (!isBrowser()) {
    return;
  }

  const normalizedSession: UserSession = {
    apartmentNumber: normalizeApartmentNumber(session.apartmentNumber),
    fullName: normalizeFullName(session.fullName),
    userId: session.userId,
  };

  window.localStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(normalizedSession));
  window.dispatchEvent(new Event(USER_SESSION_CHANGE_EVENT));
}

export function clearUserSession(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(USER_SESSION_STORAGE_KEY);
  window.dispatchEvent(new Event(USER_SESSION_CHANGE_EVENT));
}
