'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Booking } from '@/lib/utils/bookingHelpers';
import { formatDateWithDayName, formatTimeToAMPM, parseDateInBogotaTimezone } from '@/lib/utils/dateTime';

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
  const [bookedHours, setBookedHours] = useState<string[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Generate all hours from 12:00 AM to 11:00 PM (0:00 to 23:00)
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    return `${i.toString().padStart(2, '0')}:00`;
  });

  // Format time to AM/PM for display
  const formatTimeForDisplay = (time24: string): string => {
    const [hourStr] = time24.split(':');
    const hour = parseInt(hourStr);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${ampm}`;
  };

  // Calculate end time based on start time and duration (can go into next day)
  const calculateEndTime = (startTime: string, hours: number): string => {
    if (!startTime) return '';
    const [hourStr, minuteStr] = startTime.split(':');
    const startHour = parseInt(hourStr);
    const endHour = (startHour + hours) % 24;
    return `${endHour.toString().padStart(2, '0')}:${minuteStr}`;
  };

  // Check if end time is on next day
  const isNextDay = (startTime: string, hours: number): boolean => {
    if (!startTime) return false;
    const [hourStr] = startTime.split(':');
    const startHour = parseInt(hourStr);
    return (startHour + hours) >= 24;
  };

  const horaFinal = hora && duracion ? calculateEndTime(hora, typeof duracion === 'number' ? duracion : parseInt(duracion)) : '';
  const crossesNextDay = hora && duracion ? isNextDay(hora, typeof duracion === 'number' ? duracion : parseInt(duracion)) : false;
  const maxDuracion = 24;

  useEffect(() => {
    if (isOpen && booking) {
      const bookingDate = new Date(booking.bookingDate);
      setDate(bookingDate.toISOString().split('T')[0]);
      const [start, end] = booking.timeSlot.split('-');
      setHora(start);
      // Calculate duration from start and end times
      const startHour = parseInt(start.split(':')[0]);
      const endHour = parseInt(end.split(':')[0]);
      let duration = endHour - startHour;
      if (duration < 0) duration += 24; // Handle next day
      setDuracion(duration);
    }
  }, [isOpen, booking]);

  const fetchAvailability = useCallback(async () => {
    if (!date) return;
    setIsLoadingBookings(true);
    try {
      const response = await fetch(`/api/bookings/day/${date}`);
      
      // Also fetch bookings from previous day (to check for overnight bookings)
      const [year, month, day] = date.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);
      const previousDate = new Date(year, month - 1, day - 1);
      const previousDateStr = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}-${String(previousDate.getDate()).padStart(2, '0')}`;
      const previousResponse = await fetch(`/api/bookings/day/${previousDateStr}`);
      
      if (response.ok) {
        const data = await response.json();
        const occupiedHours: string[] = [];
        
        // Process bookings from selected date
        data.bookings.forEach((b: any) => {
          // Skip current booking being edited
          if (b.confirmationCode === booking.confirmationCode) return;
          
          const startTime = new Date(b.startTime);
          const endTime = new Date(b.endTime);
          const startHour = startTime.getHours();
          const endHour = endTime.getHours();
          
          const crossesMidnight = endHour < startHour || endTime <= startTime;
          
          if (crossesMidnight) {
            for (let hour = startHour; hour < 24; hour++) {
              const hourStr = `${hour.toString().padStart(2, '0')}:00`;
              if (!occupiedHours.includes(hourStr)) {
                occupiedHours.push(hourStr);
              }
            }
          } else {
            for (let hour = startHour; hour < endHour || (hour === endHour && endTime.getMinutes() > 0); hour++) {
              const hourStr = `${hour.toString().padStart(2, '0')}:00`;
              if (!occupiedHours.includes(hourStr)) {
                occupiedHours.push(hourStr);
              }
            }
          }
        });
        
        // Process bookings from previous day that might extend to selected date
        if (previousResponse.ok) {
          const previousData = await previousResponse.json();
          
          previousData.bookings.forEach((b: any) => {
            if (b.confirmationCode === booking.confirmationCode) return;
            
            const startTime = new Date(b.startTime);
            const endTime = new Date(b.endTime);
            const startHour = startTime.getHours();
            const endHour = endTime.getHours();
            
            const crossesMidnight = endHour < startHour || endTime <= startTime;
            
            if (crossesMidnight) {
              for (let hour = 0; hour < endHour || (hour === endHour && endTime.getMinutes() > 0); hour++) {
                const hourStr = `${hour.toString().padStart(2, '0')}:00`;
                if (!occupiedHours.includes(hourStr)) {
                  occupiedHours.push(hourStr);
                }
              }
            }
          });
        }
        
        setBookedHours(occupiedHours);
        
        // Clear selected hour if it's now booked
        if (hora && occupiedHours.includes(hora)) {
          setHora('');
          setDuracion('');
        }
      } else {
        setBookedHours([]);
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
      setBookedHours([]);
    } finally {
      setIsLoadingBookings(false);
    }
  }, [date, booking.confirmationCode, hora]);

  useEffect(() => {
    if (date) {
      fetchAvailability();
    } else {
      setBookedHours([]);
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
    
    if (duracion < 1) {
      setError('La duración mínima es de 1 hora');
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
                min={minDate.toISOString().split('T')[0]}
                max={maxDate.toISOString().split('T')[0]}
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
                  const isBooked = bookedHours.includes(slot);
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
                    type="text"
                    inputMode="numeric"
                    value={duracion}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value === '') {
                        setDuracion('');
                      } else {
                        const numValue = parseInt(value);
                        if (numValue <= maxDuracion) {
                          setDuracion(numValue);
                        }
                      }
                    }}
                    disabled={isLoading}
                    className="py-3 px-4 rounded-xl text-center font-medium transition-colors"
                    style={{
                      border: '1px solid #E5E7EB',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      color: '#1F2933'
                    }}
                    placeholder="Hrs"
                  />
                </div>
                <p className="mt-1" style={{ fontSize: '12px', color: '#6B7280' }}>
                  O ingresa el número de horas (1-{maxDuracion})
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
