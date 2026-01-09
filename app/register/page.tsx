'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [torre, setTorre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Create/update user in database
      const response = await fetch('/api/users/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartmentNumber: torre,
          fullName: nombre,
          email: correo,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear la cuenta');
      }

      // Also save to localStorage for quick access
      localStorage.setItem('user', JSON.stringify({
        nombre,
        torre,
        correo
      }));

      router.push('/');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al crear la cuenta. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F6F8F7' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid #E5E7EB' }}>
          <h1 className="font-semibold mb-2 text-center" style={{ fontSize: '22px', color: '#1F2933' }}>
            Crear cuenta
          </h1>
          <p className="text-center mb-8" style={{ fontSize: '14px', color: '#6B7280' }}>
            Reserva más rápido con tu cuenta
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
                Nombre
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre completo"
                required
                className="w-full px-4 py-3 rounded-xl transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  minHeight: '44px',
                  backgroundColor: 'white',
                  color: '#1F2933'
                }}
              />
            </div>

            <div>
              <label 
                className="block mb-2 font-medium" 
                style={{ fontSize: '14px', color: '#1F2933' }}
              >
                Apartamento
              </label>
              <input
                type="text"
                value={torre}
                onChange={(e) => setTorre(e.target.value)}
                placeholder="2-101"
                required
                pattern="^\d+-\d+$"
                className="w-full px-4 py-3 rounded-xl transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  minHeight: '44px',
                  backgroundColor: 'white',
                  color: '#1F2933'
                }}
              />
              <p className="mt-1" style={{ fontSize: '12px', color: '#6B7280' }}>
                Formato: TORRE-APTO (ej: 2-101)
              </p>
            </div>

            <div>
              <label 
                className="block mb-2 font-medium" 
                style={{ fontSize: '14px', color: '#1F2933' }}
              >
                Correo
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-3 rounded-xl transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  minHeight: '44px',
                  backgroundColor: 'white',
                  color: '#1F2933'
                }}
              />
            </div>

            <div>
              <label 
                className="block mb-2 font-medium" 
                style={{ fontSize: '14px', color: '#1F2933' }}
              >
                Contraseña
              </label>
              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  minHeight: '44px',
                  backgroundColor: 'white',
                  color: '#1F2933'
                }}
              />
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
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>

            <div className="text-center">
              <Link 
                href="/" 
                className="font-medium"
                style={{ fontSize: '14px', color: '#2F9E44' }}
              >
                Volver al inicio
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
