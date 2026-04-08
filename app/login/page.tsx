'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserSession } from '@/hooks/useUserSession';
import { formatApartmentInput } from '@/lib/utils/apartment-input';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isHydrated, isAuthenticated, login } = useUserSession();
  const nextPath = searchParams.get('next') || '/';

  const [apartmentNumber, setApartmentNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isHydrated) return;
    if (isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isHydrated, isAuthenticated, nextPath, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const normalizedApartment = apartmentNumber.trim().toUpperCase();
    const apartmentRegex = /^\d+-[A-Z0-9]+$/;

    if (!apartmentRegex.test(normalizedApartment)) {
      setErrorMessage('Formato inválido. Usa TORRE-APTO (ej: 1-102B).');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/users/${normalizedApartment}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setErrorMessage('No encontramos ese apartamento registrado. Puedes registrarte abajo.');
        } else {
          setErrorMessage(data.error || 'No fue posible iniciar sesión.');
        }
        return;
      }

      login({
        apartmentNumber: data.user.apartmentNumber,
        fullName: data.user.fullName,
        userId: data.user.id,
      });

      router.replace(nextPath);
    } catch {
      setErrorMessage('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F6F8F7' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid #E5E7EB' }}>
          <h1 className="font-semibold mb-2 text-center" style={{ fontSize: '22px', color: '#1F2933' }}>
            Iniciar sesión
          </h1>
          <p className="text-center mb-8" style={{ fontSize: '14px', color: '#6B7280' }}>
            Ingresa con tu número de apartamento
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div
                className="p-4 rounded-xl"
                style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '14px' }}
              >
                {errorMessage}
              </div>
            )}

            <div>
              <label
                className="block mb-2 font-medium"
                style={{ fontSize: '14px', color: '#1F2933' }}
              >
                Apartamento
              </label>
              <input
                type="text"
                value={apartmentNumber}
                onChange={(e) => {
                  setApartmentNumber(formatApartmentInput(e.target.value, apartmentNumber));
                }}
                placeholder="1-102B"
                required
                className="w-full px-4 py-3 rounded-xl transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  fontSize: '16px',
                  minHeight: '44px',
                  backgroundColor: 'white',
                  color: '#1F2933',
                }}
              />
              <p className="mt-1" style={{ fontSize: '12px', color: '#6B7280' }}>
                Formato: TORRE-APTO (ej: 1-102B)
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl font-semibold transition-all disabled:opacity-50"
              style={{
                backgroundColor: '#2F9E44',
                color: 'white',
                fontSize: '15px',
                minHeight: '48px',
                border: 'none',
              }}
            >
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </button>

            <div className="text-center">
              <Link
                href="/register"
                className="font-medium"
                style={{ fontSize: '14px', color: '#2F9E44' }}
              >
                ¿No estás registrado? Regístrate aquí
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F6F8F7' }}>
          <p style={{ color: '#6B7280' }}>Cargando...</p>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
