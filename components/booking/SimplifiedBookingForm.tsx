'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBogotaDateTime, formatDateForInput, formatDateWithDayName, formatTimeToAMPM, parseDateInBogotaTimezone } from '@/lib/utils/dateTime';
import { useUserSession } from '@/hooks/useUserSession';

interface SimplifiedBookingFormProps {
  preSelectedDate?: Date;
  onSuccess?: () => void;
}

interface DayBookingItem {
  startTime: string;
  endTime: string;
  fullName?: string;
}

interface RangeConflictItem {
  key: string;
  startIso: string;
  fullName: string;
  displayDate: string;
  displayTimeRange: string;
}

interface WeeklyUsageApiResponse {
  usage: {
    weeklyLimit: number;
    currentWeek: {
      remainingHours: number;
    };
  };
}

const HOUR_IN_MS = 60 * 60 * 1000;

const getDateWithOffset = (date: string, offsetDays: number): string => {
  const [year, month, day] = date.split('-').map(Number);
  const baseDate = new Date(Date.UTC(year, month - 1, day));
  baseDate.setUTCDate(baseDate.getUTCDate() + offsetDays);
  return `${baseDate.getUTCFullYear()}-${String(baseDate.getUTCMonth() + 1).padStart(2, '0')}-${String(baseDate.getUTCDate()).padStart(2, '0')}`;
};

const extractDateAndTimeFromISO = (isoDateTime: string): { date: string; time: string } => {
  const [datePart = '', timePart = ''] = isoDateTime.split('T');
  return {
    date: datePart,
    time: timePart.slice(0, 5),
  };
};

export function SimplifiedBookingForm({ preSelectedDate, onSuccess }: SimplifiedBookingFormProps) {
  const router = useRouter();
  const { session } = useUserSession();
  const [torre, setTorre] = useState(session?.apartmentNumber ?? '');
  const [nombre, setNombre] = useState(session?.fullName ?? '');
  const [placa, setPlaca] = useState('');
  const [fecha, setFecha] = useState(
    preSelectedDate ? formatDateForInput(preSelectedDate) : ''
  );
  const [hora, setHora] = useState('');
  const [duracion, setDuracion] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [userFound, setUserFound] = useState(false);
  const [bookedHours, setBookedHours] = useState<string[]>([]);
  const [nearbyBookings, setNearbyBookings] = useState<DayBookingItem[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [selectedWeekRemainingHours, setSelectedWeekRemainingHours] = useState<number | null>(null);
  const [isLoadingWeekHours, setIsLoadingWeekHours] = useState(false);
  const [weeklyHoursLimit, setWeeklyHoursLimit] = useState(10);

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
    const endHour = (startHour + hours) % 24; // Wrap around to next day if needed
    
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
  const maxDuracion = 24; // Always 24 hours max
  const weeklyLimitQuickDuration = Math.max(1, Math.min(maxDuracion, Math.floor(weeklyHoursLimit)));

  const overlappingBookings = useMemo<RangeConflictItem[]>(() => {
    if (!fecha || !hora || !duracion || nearbyBookings.length === 0) {
      return [];
    }

    const selectedDurationHours = typeof duracion === 'number' ? duracion : Number(duracion);
    if (!selectedDurationHours || selectedDurationHours < 1) {
      return [];
    }

    const [startHour, startMinute] = hora.split(':').map(Number);
    if (Number.isNaN(startHour) || Number.isNaN(startMinute)) {
      return [];
    }

    const selectedStartTime = createBogotaDateTime(fecha, startHour, startMinute);
    const selectedEndTime = new Date(selectedStartTime.getTime() + selectedDurationHours * HOUR_IN_MS);

    return nearbyBookings
      .map((booking, index) => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);

        const hasOverlap = selectedStartTime < bookingEnd && selectedEndTime > bookingStart;
        if (!hasOverlap) {
          return null;
        }

        const { date: bookingStartDate, time: bookingStartTime } = extractDateAndTimeFromISO(booking.startTime);
        const { date: bookingEndDate, time: bookingEndTime } = extractDateAndTimeFromISO(booking.endTime);

        if (!bookingStartDate || !bookingEndDate || !bookingStartTime || !bookingEndTime) {
          return null;
        }

        const displayDate =
          bookingStartDate === bookingEndDate
            ? formatDateWithDayName(parseDateInBogotaTimezone(bookingStartDate))
            : `${formatDateWithDayName(parseDateInBogotaTimezone(bookingStartDate))} → ${formatDateWithDayName(parseDateInBogotaTimezone(bookingEndDate))}`;

        return {
          key: `${booking.startTime}-${booking.endTime}-${index}`,
          startIso: booking.startTime,
          fullName: booking.fullName?.trim() || 'Usuario sin nombre',
          displayDate,
          displayTimeRange: `${formatTimeToAMPM(bookingStartTime)} - ${formatTimeToAMPM(bookingEndTime)}`,
        };
      })
      .filter((booking): booking is RangeConflictItem => booking !== null)
      .sort((a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime());
  }, [fecha, hora, duracion, nearbyBookings]);

  // Format vehicle plate with mask ABC-123
  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Remove non-alphanumeric
    
    // Add hyphen after 3 characters
    if (value.length > 3) {
      value = value.slice(0, 3) + '-' + value.slice(3, 6);
    }
    
    setPlaca(value);
  };

  useEffect(() => {
    if (!session) return;

    setTorre(session.apartmentNumber);
    setNombre(session.fullName);
  }, [session]);

  const fetchUserData = React.useCallback(async (apartmentNumber: string) => {
    setIsLoadingUser(true);
    try {
      const response = await fetch(`/api/users/${apartmentNumber}`);
      
      if (response.ok) {
        const data = await response.json();
        setNombre(data.user.fullName);
        // Auto-fill vehicle plate if available from last booking
        if (data.user.vehiclePlate && data.user.vehiclePlate.trim() !== '') {
          // Format plate with hyphen (ABC123 -> ABC-123)
          const plate = data.user.vehiclePlate;
          const formattedPlate = plate.length === 6 ? `${plate.slice(0, 3)}-${plate.slice(3)}` : plate;
          setPlaca(formattedPlate);
        }
        setUserFound(true);
      } else {
        setUserFound(false);
      }
    } catch {
      setUserFound(false);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  const fetchBookingsForDate = React.useCallback(async (date: string) => {
    setIsLoadingBookings(true);
    try {
      const previousDateStr = getDateWithOffset(date, -1);
      const nextDateStr = getDateWithOffset(date, 1);

      const [selectedDateResponse, previousDateResponse, nextDateResponse] = await Promise.all([
        fetch(`/api/bookings/day/${date}`),
        fetch(`/api/bookings/day/${previousDateStr}`),
        fetch(`/api/bookings/day/${nextDateStr}`),
      ]);

      const selectedDateData = selectedDateResponse.ok ? await selectedDateResponse.json() : { bookings: [] };
      const previousDateData = previousDateResponse.ok ? await previousDateResponse.json() : { bookings: [] };
      const nextDateData = nextDateResponse.ok ? await nextDateResponse.json() : { bookings: [] };

      const selectedBookings: DayBookingItem[] = selectedDateData.bookings ?? [];
      const previousBookings: DayBookingItem[] = previousDateData.bookings ?? [];
      const nextBookings: DayBookingItem[] = nextDateData.bookings ?? [];

      setNearbyBookings([...previousBookings, ...selectedBookings, ...nextBookings]);

      const occupiedHours = new Set<string>();
      const selectedDayStart = createBogotaDateTime(date, 0, 0);
      const selectedDayEnd = createBogotaDateTime(nextDateStr, 0, 0);

      [...selectedBookings, ...previousBookings].forEach((booking) => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);

        const overlapStart = bookingStart > selectedDayStart ? bookingStart : selectedDayStart;
        const overlapEnd = bookingEnd < selectedDayEnd ? bookingEnd : selectedDayEnd;

        if (overlapStart >= overlapEnd) {
          return;
        }

        for (let hour = 0; hour < 24; hour++) {
          const slotStart = new Date(selectedDayStart.getTime() + hour * HOUR_IN_MS);
          const slotEnd = new Date(slotStart.getTime() + HOUR_IN_MS);

          if (overlapStart < slotEnd && overlapEnd > slotStart) {
            occupiedHours.add(`${hour.toString().padStart(2, '0')}:00`);
          }
        }
      });

      const occupiedHoursList = Array.from(occupiedHours).sort();
      setBookedHours(occupiedHoursList);

      if (hora && occupiedHours.has(hora)) {
        setHora('');
        setDuracion('');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookedHours([]);
      setNearbyBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  }, [hora]);

  const fetchWeekRemainingHours = React.useCallback(async (apartmentNumber: string, date: string) => {
    setIsLoadingWeekHours(true);

    try {
      const response = await fetch(`/api/bookings/usage/${apartmentNumber}?date=${date}`);

      if (response.ok) {
        const data: WeeklyUsageApiResponse = await response.json();
        setWeeklyHoursLimit(data.usage.weeklyLimit > 0 ? data.usage.weeklyLimit : 10);
        setSelectedWeekRemainingHours(data.usage.currentWeek.remainingHours);
      } else {
        setWeeklyHoursLimit(10);
        setSelectedWeekRemainingHours(null);
      }
    } catch {
      setWeeklyHoursLimit(10);
      setSelectedWeekRemainingHours(null);
    } finally {
      setIsLoadingWeekHours(false);
    }
  }, []);

  // Auto-fill user data when apartment number is valid (with debounce)
  useEffect(() => {
    const apartmentRegex = /^\d+-[A-Z0-9]+$/;
    
    // Debounce timer
    const timer = setTimeout(() => {
      if (apartmentRegex.test(torre)) {
        fetchUserData(torre);
      } else {
        setUserFound(false);
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timer);
  }, [torre, fetchUserData]);

  // Fetch bookings when date changes
  useEffect(() => {
    const apartmentRegex = /^\d+-[A-Z0-9]+$/;

    if (fecha) {
      fetchBookingsForDate(fecha);

      if (apartmentRegex.test(torre)) {
        fetchWeekRemainingHours(torre, fecha);
      } else {
        setSelectedWeekRemainingHours(null);
      }
    } else {
      setBookedHours([]);
      setNearbyBookings([]);
      setSelectedWeekRemainingHours(null);
    }
  }, [fecha, torre, fetchBookingsForDate, fetchWeekRemainingHours]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    // Validate duration is provided and doesn't exceed 8 hours
    if (duracion === '' || !duracion) {
      setErrorMessage('Por favor ingresa la duración de la reserva');
      setIsSubmitting(false);
      return;
    }
    
    if (duracion > 24) {
      setErrorMessage('La duración máxima es de 24 horas');
      setIsSubmitting(false);
      return;
    }
    
    if (duracion < 1) {
      setErrorMessage('La duración mínima es de 1 hora');
      setIsSubmitting(false);
      return;
    }

    if (overlappingBookings.length > 0) {
      setErrorMessage('La reserva se cruza con una ya existente en el rango seleccionado.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartmentNumber: torre,
          fullName: nombre,
          vehiclePlate: placa,
          date: fecha,
          startTime: hora,
          endTime: horaFinal,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (onSuccess) {
          onSuccess();
        }
        const params = new URLSearchParams({
          confirmationCode: result.confirmationCode,
          apartment: torre,
          name: nombre,
          vehiclePlate: placa,
          date: fecha,
          timeSlot: `${hora}-${horaFinal}`,
        });
        router.push(`/confirmation?${params.toString()}`);
      } else {
        setErrorMessage(result.error || 'Error al crear la reserva');
      }
    } catch {
      setErrorMessage('Error de conexión. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label 
          className="block mb-2 font-medium" 
          style={{ fontSize: '14px', color: '#1F2933' }}
        >
          Apartamento
        </label>
        <input
          type="text"
          inputMode="text"
          value={torre}
          readOnly
          disabled
          placeholder="1-102B"
          pattern="^\d+-[A-Za-z0-9]+$"
          className="w-full px-4 py-3 rounded-xl transition-colors"
          style={{
            border: `1px solid ${userFound ? '#2F9E44' : '#E5E7EB'}`,
            fontSize: '16px',
            minHeight: '44px',
            backgroundColor: '#F9FAFB',
            color: '#1F2933'
          }}
        />
        <p className="mt-1" style={{ fontSize: '12px', color: userFound ? '#2F9E44' : '#6B7280' }}>
          {isLoadingUser ? 'Buscando usuario...' : userFound ? '✓ Usuario encontrado (dato bloqueado de sesión)' : 'Apartamento de sesión (no editable)'}
        </p>
      </div>

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
          readOnly
          placeholder="Pepito Perez"
          required
          className="w-full px-4 py-3 rounded-xl transition-colors"
          style={{
            border: '1px solid #E5E7EB',
            fontSize: '16px',
            minHeight: '44px',
            backgroundColor: userFound ? '#F9FAFB' : 'white',
            color: '#1F2933'
          }}
        />
        <p className="mt-1" style={{ fontSize: '12px', color: '#6B7280' }}>
          Nombre asociado a tu sesión
        </p>
      </div>

      <div>
        <label 
          className="block mb-2 font-medium" 
          style={{ fontSize: '14px', color: '#1F2933' }}
        >
          Placa del Vehículo
        </label>
        <input
          type="text"
          value={placa}
          onChange={handlePlacaChange}
          placeholder="ABC-123"
          required
          maxLength={7}
          className="w-full px-4 py-3 rounded-xl transition-colors"
          style={{
            border: '1px solid #E5E7EB',
            fontSize: '16px',
            minHeight: '44px',
            backgroundColor: userFound && placa ? '#F9FAFB' : 'white',
            color: '#1F2933'
          }}
        />
        <p className="mt-1" style={{ fontSize: '12px', color: '#6B7280' }}>
          {userFound && placa ? 'Placa de tu última reserva (puedes modificarla)' : 'Formato: ABC-123'}
        </p>
      </div>

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
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              setHora('');
              setDuracion('');
            }}
            required
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
            disabled={isLoadingBookings}
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

        {fecha && (
          <div
            className="mt-3 p-3 rounded-xl"
            style={{
              backgroundColor: '#ECFDF3',
              border: '1px solid #86EFAC',
            }}
          >
            <p style={{ fontSize: '13px', color: '#166534', fontWeight: '500' }}>
              {isLoadingWeekHours
                ? 'Consultando saldo de horas para esa semana...'
                : selectedWeekRemainingHours !== null
                  ? `Tienes ${selectedWeekRemainingHours} horas disponibles para la semana de esta reserva.`
                  : 'No fue posible consultar las horas disponibles para esa semana.'}
            </p>
          </div>
        )}
        
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
                onClick={() => setDuracion(weeklyLimitQuickDuration)}
                className="py-3 rounded-xl font-medium transition-all"
                style={{
                  backgroundColor: duracion === weeklyLimitQuickDuration ? '#2F9E44' : 'white',
                  color: duracion === weeklyLimitQuickDuration ? 'white' : '#1F2933',
                  border: `1px solid ${duracion === weeklyLimitQuickDuration ? '#2F9E44' : '#E5E7EB'}`,
                  fontSize: '14px',
                }}
              >
                +{weeklyLimitQuickDuration}h
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
        {fecha && hora && horaFinal && (
          <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            <p className="font-medium mb-1" style={{ fontSize: '14px', color: '#1F2933' }}>
              {formatDateWithDayName(parseDateInBogotaTimezone(fecha))}
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

        {fecha && hora && duracion && overlappingBookings.length > 0 && (
          <div
            className="mt-4 p-4 rounded-xl"
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
            }}
          >
            <p style={{ fontSize: '13px', color: '#991B1B', fontWeight: '600' }}>
              Esta reserva se cruza con una ya existente.
            </p>
            <ul className="mt-2 space-y-1" style={{ fontSize: '12px', color: '#B91C1C' }}>
              {overlappingBookings.map((booking) => (
                <li key={booking.key}>
                  {booking.fullName} · {booking.displayDate} · {booking.displayTimeRange}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {errorMessage && (
        <div 
          className="p-4 rounded-xl" 
          style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '14px' }}
        >
          {errorMessage}
        </div>
      )}

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
        {isSubmitting ? 'Confirmando...' : 'Confirmar reserva'}
      </button>
    </form>
  );
}
