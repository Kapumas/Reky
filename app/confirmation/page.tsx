'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { formatDateForDisplay, formatTimeSlotForDisplay } from '@/lib/utils/dateTime';
import { CheckCircle, Calendar, Clock, Home, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

function ConfirmationContent() {
  const searchParams = useSearchParams();

  const apartment = searchParams.get('apartment');
  const name = searchParams.get('name');
  const date = searchParams.get('date');
  const timeSlot = searchParams.get('timeSlot');

  if (!apartment || !name || !date || !timeSlot) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F6F8F7' }}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div 
            className="p-4 rounded-xl mb-6" 
            style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '14px' }}
          >
            <strong>Confirmación Inválida:</strong> Falta información de la reserva. Por favor intenta reservar nuevamente.
          </div>
          <Link href="/">
            <button
              className="w-full rounded-xl font-semibold transition-all"
              style={{
                backgroundColor: '#2F9E44',
                color: 'white',
                fontSize: '15px',
                minHeight: '48px',
                border: 'none',
              }}
            >
              Volver a Reservar
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const bookingDate = new Date(date);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F6F8F7' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full" style={{ backgroundColor: '#D1FAE5' }}>
              <CheckCircle className="h-14 w-14" style={{ color: '#2F9E44' }} />
            </div>
          </div>
          <h1 className="font-semibold mb-2" style={{ fontSize: '22px', color: '#1F2933' }}>
            ¡Reserva Confirmada!
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            Tu turno de carga ha sido reservado exitosamente
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: '1px solid #E5E7EB' }}>
          <h2 className="font-semibold mb-4" style={{ fontSize: '18px', color: '#1F2933' }}>
            Detalles de la Reserva
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 mt-0.5" style={{ color: '#6B7280' }} />
              <div>
                <p style={{ fontSize: '14px', color: '#6B7280' }}>Nombre Completo</p>
                <p className="font-medium" style={{ color: '#1F2933' }}>{name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Home className="h-5 w-5 mt-0.5" style={{ color: '#6B7280' }} />
              <div>
                <p style={{ fontSize: '14px', color: '#6B7280' }}>Número de Apartamento</p>
                <p className="font-medium" style={{ color: '#1F2933' }}>{apartment}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 mt-0.5" style={{ color: '#6B7280' }} />
              <div>
                <p style={{ fontSize: '14px', color: '#6B7280' }}>Fecha</p>
                <p className="font-medium" style={{ color: '#1F2933' }}>
                  {formatDateForDisplay(bookingDate)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 mt-0.5" style={{ color: '#6B7280' }} />
              <div>
                <p style={{ fontSize: '14px', color: '#6B7280' }}>Horario</p>
                <p className="font-medium" style={{ color: '#1F2933' }}>
                  {formatTimeSlotForDisplay(timeSlot)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/manage">
            <button
              className="w-full rounded-xl font-semibold transition-all"
              style={{
                backgroundColor: 'white',
                color: '#1F2933',
                fontSize: '15px',
                minHeight: '48px',
                border: '1px solid #E5E7EB',
              }}
            >
              Gestionar Esta Reserva
            </button>
          </Link>
          <Link href="/">
            <button
              className="w-full rounded-xl font-semibold transition-all"
              style={{
                backgroundColor: '#2F9E44',
                color: 'white',
                fontSize: '15px',
                minHeight: '48px',
                border: 'none',
              }}
            >
              Reservar Otro Turno
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F6F8F7' }}>
        <p className="text-center" style={{ fontSize: '14px', color: '#6B7280' }}>Cargando...</p>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
