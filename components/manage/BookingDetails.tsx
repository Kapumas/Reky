'use client';

import React, { useState } from 'react';
import { formatDateForDisplay, formatTimeSlotForDisplay } from '@/lib/utils/dateTime';
import { CheckCircle, XCircle, Calendar, Clock } from 'lucide-react';

interface BookingDetailsProps {
  booking: {
    id: string;
    confirmationCode: string;
    apartmentNumber: string;
    fullName: string;
    bookingDate: string;
    timeSlot: string;
    status: string;
    startTime: string;
    endTime: string;
    createdAt: string;
    cancelledAt?: string;
  };
  onCancel: () => void;
}

export function BookingDetails({ booking, onCancel }: BookingDetailsProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const bookingDate = new Date(booking.bookingDate);
  const isActive = booking.status === 'active';

  async function handleCancel() {
    setIsCancelling(true);
    setErrorMessage('');

    try {
      const response = await fetch(
        `/api/bookings/${booking.confirmationCode}/cancel`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (response.ok) {
        onCancel();
      } else {
        setErrorMessage(data.error || 'Error al cancelar la reserva');
      }
    } catch {
      setErrorMessage('Error de conexión. Por favor intenta nuevamente.');
    } finally {
      setIsCancelling(false);
      setShowCancelConfirm(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E5E7EB' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold" style={{ fontSize: '16px', color: '#1F2933' }}>
          Reserva
        </h3>
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full"
          style={{
            backgroundColor: isActive ? '#D1FAE5' : '#FEE2E2',
            color: isActive ? '#065F46' : '#991B1B',
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          {isActive ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Activa
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              Cancelada
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 mt-0.5" style={{ color: '#6B7280' }} />
          <div>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>Fecha</p>
            <p className="font-medium" style={{ fontSize: '15px', color: '#1F2933' }}>
              {formatDateForDisplay(bookingDate)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 mt-0.5" style={{ color: '#6B7280' }} />
          <div>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>Horario</p>
            <p className="font-medium" style={{ fontSize: '15px', color: '#1F2933' }}>
              {formatTimeSlotForDisplay(booking.timeSlot)}
            </p>
          </div>
        </div>
      </div>


      {errorMessage && (
        <div 
          className="p-3 rounded-xl mt-4" 
          style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '13px' }}
        >
          {errorMessage}
        </div>
      )}

      {isActive && !showCancelConfirm && (
        <button
          onClick={() => setShowCancelConfirm(true)}
          className="w-full rounded-xl font-medium transition-all mt-4"
          style={{
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            fontSize: '14px',
            minHeight: '44px',
            border: '1px solid #FCA5A5',
          }}
        >
          Cancelar Reserva
        </button>
      )}

      {isActive && showCancelConfirm && (
        <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}>
          <p className="font-medium mb-3" style={{ fontSize: '14px', color: '#92400E' }}>
            ¿Estás seguro?
          </p>
          <p className="mb-4" style={{ fontSize: '13px', color: '#92400E' }}>
            Esta acción no se puede deshacer. Tu reserva será cancelada y el horario quedará disponible para otros.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowCancelConfirm(false)}
              disabled={isCancelling}
              className="flex-1 rounded-xl font-medium transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'white',
                color: '#1F2933',
                fontSize: '14px',
                minHeight: '44px',
                border: '1px solid #E5E7EB',
              }}
            >
              Mantener
            </button>
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="flex-1 rounded-xl font-medium transition-all disabled:opacity-50"
              style={{
                backgroundColor: '#DC2626',
                color: 'white',
                fontSize: '14px',
                minHeight: '44px',
                border: 'none',
              }}
            >
              {isCancelling ? 'Cancelando...' : 'Sí, Cancelar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
