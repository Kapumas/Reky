'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateForInput, formatDateWithDayName, formatTimeToAMPM, parseDateInBogotaTimezone } from '@/lib/utils/dateTime';

interface SimplifiedBookingFormProps {
  preSelectedDate?: Date;
  onSuccess?: () => void;
}

export function SimplifiedBookingForm({ preSelectedDate, onSuccess }: SimplifiedBookingFormProps) {
  const router = useRouter();
  const [torre, setTorre] = useState('');
  const [nombre, setNombre] = useState('');
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

  // Format vehicle plate with mask ABC-123
  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Remove non-alphanumeric
    
    // Add hyphen after 3 characters
    if (value.length > 3) {
      value = value.slice(0, 3) + '-' + value.slice(3, 6);
    }
    
    setPlaca(value);
  };

  // Auto-fill user data when apartment number is valid (with debounce)
  useEffect(() => {
    const apartmentRegex = /^\d+-\d+$/;
    
    // Debounce timer
    const timer = setTimeout(() => {
      if (apartmentRegex.test(torre)) {
        fetchUserData(torre);
      } else {
        setUserFound(false);
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timer);
  }, [torre]);

  // Fetch bookings when date changes
  useEffect(() => {
    if (fecha) {
      fetchBookingsForDate(fecha);
    } else {
      setBookedHours([]);
    }
  }, [fecha]);

  async function fetchUserData(apartmentNumber: string) {
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
  }

  async function fetchBookingsForDate(date: string) {
    setIsLoadingBookings(true);
    try {
      // Fetch bookings for selected date
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
        data.bookings.forEach((booking: any) => {
          const startTime = new Date(booking.startTime);
          const endTime = new Date(booking.endTime);
          const startHour = startTime.getHours();
          const endHour = endTime.getHours();
          
          // Check if booking crosses midnight based on hours
          // If end hour is less than start hour, it means it goes to next day
          const crossesMidnight = endHour < startHour || endTime <= startTime;
          
          if (crossesMidnight) {
            // Booking crosses midnight - block from start hour to 23:59
            for (let hour = startHour; hour < 24; hour++) {
              const hourStr = `${hour.toString().padStart(2, '0')}:00`;
              if (!occupiedHours.includes(hourStr)) {
                occupiedHours.push(hourStr);
              }
            }
          } else {
            // Same day booking
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
          
          previousData.bookings.forEach((booking: any) => {
            const startTime = new Date(booking.startTime);
            const endTime = new Date(booking.endTime);
            const startHour = startTime.getHours();
            const endHour = endTime.getHours();
            
            // Check if this booking crosses midnight (end hour < start hour or endTime <= startTime)
            const crossesMidnight = endHour < startHour || endTime <= startTime;
            
            if (crossesMidnight) {
              // Block from 00:00 to end hour on selected date
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
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookedHours([]);
    } finally {
      setIsLoadingBookings(false);
    }
  }

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
          timeSlot: `${hora}-${parseInt(hora.split(':')[0]) + 2}:00`,
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
          inputMode="numeric"
          value={torre}
          onChange={(e) => {
            let value = e.target.value;
            
            // Only allow numbers and hyphen
            value = value.replace(/[^0-9-]/g, '');
            
            // Auto-add hyphen after first digit only if user is typing (not deleting)
            if (value.length === 1 && /^\d$/.test(value) && value.length > torre.length) {
              value = value + '-';
            }
            
            // Prevent multiple hyphens
            const hyphenCount = (value.match(/-/g) || []).length;
            if (hyphenCount > 1) {
              value = value.replace(/-/g, (match, offset) => offset === value.indexOf('-') ? '-' : '');
            }
            
            // Limit format to X-XXX (max 10 characters)
            if (value.length > 10) {
              value = value.slice(0, 10);
            }
            
            setTorre(value);
          }}
          placeholder="2-101"
          required
          pattern="^\d+-\d+$"
          className="w-full px-4 py-3 rounded-xl transition-colors"
          style={{
            border: `1px solid ${userFound ? '#2F9E44' : '#E5E7EB'}`,
            fontSize: '14px',
            minHeight: '44px',
            backgroundColor: 'white',
            color: '#1F2933'
          }}
        />
        <p className="mt-1" style={{ fontSize: '12px', color: userFound ? '#2F9E44' : '#6B7280' }}>
          {isLoadingUser ? 'Buscando usuario...' : userFound ? '✓ Usuario encontrado' : 'Formato: TORRE-APTO (ej: 2-101)'}
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
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Pepito Perez"
          required
          className="w-full px-4 py-3 rounded-xl transition-colors"
          style={{
            border: '1px solid #E5E7EB',
            fontSize: '14px',
            minHeight: '44px',
            backgroundColor: userFound ? '#F9FAFB' : 'white',
            color: '#1F2933'
          }}
        />
        {userFound && (
          <p className="mt-1" style={{ fontSize: '12px', color: '#6B7280' }}>
            Puedes modificar el nombre si ha cambiado
          </p>
        )}
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
            fontSize: '14px',
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
              fontSize: '14px',
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
              fontSize: '14px',
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
                onClick={() => setDuracion(12)}
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
                className="py-3 px-4 rounded-xl text-center font-medium transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
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
