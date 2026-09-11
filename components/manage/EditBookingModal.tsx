'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Booking } from '@/lib/utils/bookingHelpers';
import { formatDateForInput, formatDateWithDayName, formatTimeToAMPM, getMaxDateString, getTodayString, parseDateInBogotaTimezone } from '@/lib/utils/dateTime';
import { getBookingDurationMinutes } from '@/lib/utils/validation';

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onSuccess: () => void;
}

export function EditBookingModal({ isOpen, onClose, booking, onSuccess }: EditBookingModalProps) {
  const [date, setDate] = useState('');
  const [hora, setHora] = useState('');
  const [duracion, setDuracion] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Generate time slots from 12:00 AM to 11:30 PM (0:00 to 23:30)
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const totalMinutes = i * 30;
    return `${Math.floor(totalMinutes / 60).toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}`;
  });

  // Format time to AM/PM for display
  const formatTimeForDisplay = (time24: string): string => {
    const [hourStr, minuteStr] = time24.split(':');
    const hour = parseInt(hourStr);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minuteStr} ${ampm}`;
  };

  // Calculate end time based on start time and duration (can go into next day)
  const calculateEndTime = (startTime: string, hours: number): string => {
    if (!startTime) return '';
    const [hourStr, minuteStr] = startTime.split(':');
    const startMinutes = parseInt(hourStr) * 60 + parseInt(minuteStr);
    const endMinutes = (startMinutes + hours * 60) % (24 * 60);
    return `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
  };

  // Check if end time is on next day
  const isNextDay = (startTime: string, hours: number): boolean => {
    if (!startTime) return false;
    const [hourStr, minuteStr] = startTime.split(':');
    const startMinutes = parseInt(hourStr) * 60 + parseInt(minuteStr);
    return startMinutes + hours * 60 >= 24 * 60;
  };

  const horaFinal = hora && duracion ? calculateEndTime(hora, typeof duracion === 'number' ? duracion : Number(duracion)) : '';
  const crossesNextDay = hora && duracion ? isNextDay(hora, typeof duracion === 'number' ? duracion : Number(duracion)) : false;
  const maxDuracion = 24;

  useEffect(() => {
    if (isOpen && booking) {
      const bookingDate = new Date(booking.bookingDate);
      setDate(formatDateForInput(bookingDate));
      const [start, end] = booking.timeSlot.split('-');
      setHora(start);
      setDuracion(getBookingDurationMinutes(start, end) / 60);
    }
  }, [isOpen, booking]);

  const fetchAvailability = useCallback(async () => {
    if (!date) return;
    setIsLoadingBookings(true);
    try {
      const response = await fetch(`/api/bookings/day/${date}`);
      
      // Also fetch bookings from previous day (to check for overnight bookings)
      const [year, month, day] = date.split('-').map(Number);
      const selectedDate = new Date(Date.UTC(year, month - 1, day));
      const previousDate = new Date(selectedDate);
      previousDate.setUTCDate(previousDate.getUTCDate() - 1);
      const previousDateStr = `${previousDate.getUTCFullYear()}-${String(previousDate.getUTCMonth() + 1).padStart(2, '0')}-${String(previousDate.getUTCDate()).padStart(2, '0')}`;
      const previousResponse = await fetch(`/api/bookings/day/${previousDateStr}`);
      const data = response.ok ? await response.json() : { bookings: [] };
      const previousData = previousResponse.ok ? await previousResponse.json() : { bookings: [] };
      const bookings = [...(data.bookings ?? []), ...(previousData.bookings ?? [])] as Array<{
        confirmationCode: string;
        startTime: string;
        endTime: string;
      }>;
      const occupiedTimeSlots = new Set<string>();
      const selectedDayStart = parseDateInBogotaTimezone(date);
      const selectedDayEnd = new Date(selectedDayStart.getTime() + 24 * 60 * 60 * 1000);

      bookings.forEach((currentBooking) => {
        // Skip current booking being edited
        if (currentBooking.confirmationCode === booking.confirmationCode) return;

        const bookingStart = new Date(currentBooking.startTime);
        const bookingEnd = new Date(currentBooking.endTime);
        const overlapStart = bookingStart > selectedDayStart ? bookingStart : selectedDayStart;
        const overlapEnd = bookingEnd < selectedDayEnd ? bookingEnd : selectedDayEnd;

        if (overlapStart >= overlapEnd) return;

        for (let slotIndex = 0; slotIndex < 48; slotIndex++) {
          const slotStart = new Date(selectedDayStart.getTime() + slotIndex * 30 * 60 * 1000);
          const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);
          const totalMinutes = slotIndex * 30;
          const slot = `${Math.floor(totalMinutes / 60).toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}`;

          if (overlapStart < slotEnd && overlapEnd > slotStart) {
            occupiedTimeSlots.add(slot);
          }
        }
      });

      setBookedTimeSlots(Array.from(occupiedTimeSlots).sort());

      // Clear selected hour if it's now booked
      if (hora && occupiedTimeSlots.has(hora)) {
        setHora('');
        setDuracion('');
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
      setBookedTimeSlots([]);
    } finally {
      setIsLoadingBookings(false);
    }
  }, [date, booking.confirmationCode, hora]);

  useEffect(() => {
    if (date) {
      fetchAvailability();
    } else {
      setBookedTimeSlots([]);
    }
  }, [date, fetchAvailability]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validate duration
    if (duracion === '' || !duracion) {
      setError('Por favor ingresa la duración de la reserva');
      return;
    }
    
    if (duracion > 24) {
      setError('La duración máxima es de 24 horas');
      return;
    }
    
    if (duracion < 0.5 || !Number.isInteger(duracion * 2)) {
      setError('La duración debe estar en intervalos de 30 minutos');
      return;
    }

    setIsLoading(true);

    try {
      // Update booking
      const updateResponse = await fetch(`/api/bookings/${booking.confirmationCode}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          startTime: hora,
          endTime: horaFinal,
        }),
      });

      if (!updateResponse.ok) {
        const data = await updateResponse.json();
        throw new Error(data.error || 'Error al actualizar la reserva');
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

  const minDate = getTodayString();
  const maxDate = getMaxDateString();

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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label 
              className="block mb-2 font-medium" 
              style={{ fontSize: '14px', color: '#1F2933' }}
            >
              Fecha y hora
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setHora('');
                  setDuracion('');
                }}
                min={minDate}
                max={maxDate}
                required
                disabled={isLoading}
                className="px-4 py-3 rounded-xl transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  fontSize: '16px',
                  minHeight: '44px',
                  backgroundColor: 'white',
                  color: '#1F2933'
                }}
              />
              <select
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                required
                disabled={isLoadingBookings || isLoading}
                className="px-4 py-3 rounded-xl transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  fontSize: '16px',
                  minHeight: '44px',
                  backgroundColor: 'white',
                  color: '#1F2933'
                }}
              >
                <option value="">{isLoadingBookings ? 'Cargando...' : 'Hora'}</option>
                {timeSlots.map((slot) => {
                  const isBooked = bookedTimeSlots.includes(slot);
                  return (
                    <option key={slot} value={slot} disabled={isBooked}>
                      {formatTimeForDisplay(slot)}{isBooked ? ' (Reservada)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            
            {/* Duration Selection */}
            {hora && (
              <div className="mt-4">
                <label 
                  className="block mb-2 font-medium" 
                  style={{ fontSize: '14px', color: '#1F2933' }}
                >
                  Duración
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setDuracion(0.5)}
                    disabled={isLoading}
                    className="py-3 rounded-xl font-medium transition-all"
                    style={{
                      backgroundColor: duracion === 0.5 ? '#2F9E44' : 'white',
                      color: duracion === 0.5 ? 'white' : '#1F2933',
                      border: `1px solid ${duracion === 0.5 ? '#2F9E44' : '#E5E7EB'}`,
                      fontSize: '14px',
                    }}
                  >
                    +0.5h
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuracion(1)}
                    disabled={isLoading}
                    className="py-3 rounded-xl font-medium transition-all"
                    style={{
                      backgroundColor: duracion === 1 ? '#2F9E44' : 'white',
                      color: duracion === 1 ? 'white' : '#1F2933',
                      border: `1px solid ${duracion === 1 ? '#2F9E44' : '#E5E7EB'}`,
                      fontSize: '14px',
                    }}
                  >
                    +1h
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuracion(2)}
                    disabled={isLoading}
                    className="py-3 rounded-xl font-medium transition-all"
                    style={{
                      backgroundColor: duracion === 2 ? '#2F9E44' : 'white',
                      color: duracion === 2 ? 'white' : '#1F2933',
                      border: `1px solid ${duracion === 2 ? '#2F9E44' : '#E5E7EB'}`,
                      fontSize: '14px',
                    }}
                  >
                    +2h
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuracion(12)}
                    disabled={isLoading}
                    className="py-3 rounded-xl font-medium transition-all"
                    style={{
                      backgroundColor: duracion === 12 ? '#2F9E44' : 'white',
                      color: duracion === 12 ? 'white' : '#1F2933',
                      border: `1px solid ${duracion === 12 ? '#2F9E44' : '#E5E7EB'}`,
                      fontSize: '14px',
                    }}
                  >
                    +12h
                  </button>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.5"
                    max={maxDuracion}
                    step="0.5"
                    value={duracion}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setDuracion('');
                        return;
                      }

                      const numValue = Number(value);
                      if (Number.isFinite(numValue) && numValue <= maxDuracion) {
                        setDuracion(numValue);
                      }
                    }}
                    disabled={isLoading}
                    className="col-span-4 py-3 px-4 rounded-xl text-center font-medium transition-colors"
                    style={{
                      border: '1px solid #E5E7EB',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      color: '#1F2933'
                    }}
                    placeholder="Otra duración en horas"
                  />
                </div>
                <p className="mt-1" style={{ fontSize: '12px', color: '#6B7280' }}>
                  O ingresa el número de horas (0.5-{maxDuracion}, en intervalos de 0.5)
                </p>
              </div>
            )}

            {/* Summary */}
            {date && hora && horaFinal && (
              <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <p className="font-medium mb-1" style={{ fontSize: '14px', color: '#1F2933' }}>
                  {formatDateWithDayName(parseDateInBogotaTimezone(date))}
                </p>
                <p style={{ fontSize: '16px', color: '#2F9E44', fontWeight: '600' }}>
                  {formatTimeToAMPM(hora)} - {formatTimeToAMPM(horaFinal)}
                  {crossesNextDay && (
                    <span style={{ fontSize: '12px', color: '#6B7280', marginLeft: '8px' }}>
                      (día siguiente)
                    </span>
                  )}
                </p>
                <p style={{ fontSize: '12px', color: '#6B7280' }}>
                  Duración: {duracion} {duracion === 1 ? 'hora' : 'horas'}
                </p>
              </div>
            )}
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
              disabled={isLoading || !date || !hora || !duracion}
              className="flex-1 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
