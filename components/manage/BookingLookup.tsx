'use client';

import React, { useState } from 'react';

interface Booking {
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
}

interface BookingLookupProps {
  onBookingsFound: (bookings: Booking[]) => void;
}

export function BookingLookup({ onBookingsFound }: BookingLookupProps) {
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setIsSearching(true);
    setErrorMessage('');

    // Validate apartment format
    const apartmentRegex = /^\d+-\d+$/;
    if (!apartmentRegex.test(apartmentNumber)) {
      setErrorMessage('Formato inválido. Use TORRE-APTO (ej: 2-101)');
      setIsSearching(false);
      return;
    }

    try {
      const response = await fetch(`/api/bookings/apartment/${apartmentNumber}`);
      const data = await response.json();

      if (response.ok) {
        onBookingsFound(data.bookings);
      } else {
        if (response.status === 404) {
          setErrorMessage('No se encontraron reservas para este apartamento.');
        } else {
          setErrorMessage(data.error || 'Error al obtener las reservas');
        }
      }
    } catch (error) {
      setErrorMessage('Error de conexión. Por favor verifica tu conexión.');
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <form onSubmit={handleLookup} className="space-y-4">
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
          Número de Apartamento
        </label>
        <input
          type="text"
          value={apartmentNumber}
          onChange={(e) => setApartmentNumber(e.target.value)}
          placeholder="2-101"
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
        <p className="mt-1" style={{ fontSize: '12px', color: '#6B7280' }}>
          Formato: TORRE-APTO (ej: 2-101)
        </p>
      </div>

      <button
        type="submit"
        disabled={isSearching}
        className="w-full rounded-xl font-semibold transition-all disabled:opacity-50"
        style={{
          backgroundColor: '#2F9E44',
          color: 'white',
          fontSize: '15px',
          minHeight: '48px',
          border: 'none',
        }}
      >
        {isSearching ? 'Buscando...' : 'Buscar Reservas'}
      </button>
    </form>
  );
}
