'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateForInput, formatDateWithDayName, formatTimeToAMPM } from '@/lib/utils/dateTime';

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
  const [duracion, setDuracion] = useState(2); // Default 2 hours
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [userFound, setUserFound] = useState(false);

  // Generate all hours from 12:00 AM to 11:00 PM (0:00 to 23:00)
  // Filter out past hours if selected date is today
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    return `${i.toString().padStart(2, '0')}:00`;
  }).filter((timeSlot) => {
    // If no date selected, show all slots
    if (!fecha) return true;
    
    // Check if selected date is today
    const selectedDate = new Date(fecha);
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    
    // If not today, show all slots
    if (!isToday) return true;
    
    // If today, filter out past hours
    const [hourStr] = timeSlot.split(':');
    const slotHour = parseInt(hourStr);
    const currentHour = today.getHours();
    
    return slotHour > currentHour;
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

  const horaFinal = hora ? calculateEndTime(hora, duracion) : '';
  const crossesNextDay = hora ? isNextDay(hora, duracion) : false;
  const maxDuracion = 8; // Always 8 hours max

  // Auto-fill user data when apartment number is valid
  useEffect(() => {
    const apartmentRegex = /^\d+-\d+$/;
    
    if (apartmentRegex.test(torre)) {
      fetchUserData(torre);
    } else {
      setUserFound(false);
    }
  }, [torre]);

  async function fetchUserData(apartmentNumber: string) {
    setIsLoadingUser(true);
    try {
      const response = await fetch(`/api/users/${apartmentNumber}`);
      
      if (response.ok) {
        const data = await response.json();
        setNombre(data.user.fullName);
        // Auto-fill vehicle plate if available from last booking
        if (data.user.vehiclePlate && data.user.vehiclePlate.trim() !== '') {
          setPlaca(data.user.vehiclePlate);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

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
          value={torre}
          onChange={(e) => {
            let value = e.target.value;
            
            // Only allow numbers and hyphen
            value = value.replace(/[^0-9-]/g, '');
            
            // Auto-add hyphen after first digit
            if (value.length === 1 && /^\d$/.test(value)) {
              value = value + '-';
            }
            
            // Prevent multiple hyphens
            const hyphenCount = (value.match(/-/g) || []).length;
            if (hyphenCount > 1) {
              value = value.replace(/-/g, (match, offset) => offset === value.indexOf('-') ? '-' : '');
            }
            
            // Limit format to X-XXX (max 5 characters)
            if (value.length > 5) {
              value = value.slice(0, 5);
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
          onChange={(e) => setPlaca(e.target.value.toUpperCase())}
          placeholder="ABC123"
          required
          maxLength={6}
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
          {userFound && placa ? 'Placa de tu última reserva (puedes modificarla)' : 'Ingresa la placa sin espacios ni guiones'}
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
            onChange={(e) => setFecha(e.target.value)}
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
            className="px-4 py-3 rounded-xl transition-colors"
            style={{
              border: '1px solid #E5E7EB',
              fontSize: '14px',
              minHeight: '44px',
              backgroundColor: 'white',
              color: '#1F2933'
            }}
          >
            <option value="">Hora</option>
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {formatTimeForDisplay(slot)}
              </option>
            ))}
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
            <div className="grid grid-cols-3 gap-2">
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
              <input
                type="number"
                min="1"
                max={maxDuracion}
                value={duracion}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setDuracion(Math.min(Math.max(value, 1), maxDuracion));
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
              {formatDateWithDayName(new Date(fecha))}
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
