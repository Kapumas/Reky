'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUserSession } from '@/hooks/useUserSession';

interface SessionGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function SessionGuard({ children, redirectTo = '/login' }: SessionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isHydrated, isAuthenticated } = useUserSession();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
      router.replace(`${redirectTo}${next}`);
    }
  }, [isHydrated, isAuthenticated, pathname, redirectTo, router]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F6F8F7' }}>
        <p style={{ color: '#6B7280' }}>Cargando sesión...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F6F8F7' }}>
        <p style={{ color: '#6B7280' }}>Redirigiendo al inicio de sesión...</p>
      </div>
    );
  }

  return <>{children}</>;
}
