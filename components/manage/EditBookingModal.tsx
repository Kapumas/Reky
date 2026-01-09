'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Calendar, Clock } from 'lucide-react';
import type { Booking } from '@/lib/utils/bookingHelpers';
import { TIME_SLOTS } from '@/lib/constants';

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onSuccess: () => void;
}

export function EditBookingModal({ isOpen, onClose, booking, onSuccess }: EditBookingModalProps) {
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && booking) {
      const bookingDate = new Date(booking.bookingDate);
      setDate(bookingDate.toISOString().split('T')[0]);
      setTimeSlot(booking.timeSlot);
    }
  }, [isOpen, booking]);

  useEffect(() => {
    if (date) {
      fetchAvailability();
    }
  }, [date]);

  async function fetchAvailability() {
    try {
      const response = await fetch('/api/bookings/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out the current booking's slot
        setBookedSlots(data.bookedSlots.filter((slot: string) => slot !== booking.timeSlot));
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Cancel old booking
      const cancelResponse = await fetch(`/api/bookings/${booking.confirmationCode}/cancel`, {
        method: 'DELETE',
      });

      if (!cancelResponse.ok) {
        throw new Error('Error al cancelar la reserva anterior');
      }

      // Create new booking
      const [startTime, endTime] = timeSlot.split('-');
      const createResponse = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartmentNumber: booking.apartmentNumber,
          fullName: booking.fullName,
          date,
          startTime,
          endTime,
        }),
      });

      if (!createResponse.ok) {
        const data = await createResponse.json();
        throw new Error(data.error || 'Error al crear la nueva reserva');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la reserva');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" style={{ color: '#6B7280' }} />
        </button>

        <h2 className="text-2xl font-bold mb-2" style={{ color: '#1F2933' }}>
          Editar Reserva
        </h2>
        <p className="mb-6" style={{ color: '#6B7280', fontSize: '14px' }}>
          Modifica la fecha u horario de tu reserva
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium" style={{ color: '#1F2933', fontSize: '14px' }}>
              <Calendar className="inline h-4 w-4 mr-1" />
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={minDate.toISOString().split('T')[0]}
              max={maxDate.toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
              style={{ borderColor: '#E5E7EB', fontSize: '16px' }}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium" style={{ color: '#1F2933', fontSize: '14px' }}>
              <Clock className="inline h-4 w-4 mr-1" />
              Horario (2 horas)
            </label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
              style={{ borderColor: '#E5E7EB', fontSize: '16px' }}
              required
              disabled={isLoading || !date}
            >
              <option value="">Selecciona un horario</option>
              {TIME_SLOTS.map((slot) => {
                const isBooked = bookedSlots.includes(slot);
                return (
                  <option key={slot} value={slot} disabled={isBooked}>
                    {slot} {isBooked ? '(Ocupado)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {error && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
            >
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
              style={{
                backgroundColor: '#F3F4F6',
                color: '#1F2933',
                fontSize: '16px',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !date || !timeSlot}
              className="flex-1 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                backgroundColor: '#2F9E44',
                color: 'white',
                fontSize: '16px',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
