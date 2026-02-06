'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { formatTimeSlotForDisplay } from '@/lib/utils/dateTime';
import { BookingDetailModal } from './BookingDetailModal';

interface Booking {
  id: string;
  apartmentNumber: string;
  fullName: string;
  vehiclePlate: string;
  timeSlot: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export function UpcomingBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchUpcomingBookings();
  }, []);

  async function fetchUpcomingBookings() {
    try {
      const response = await fetch('/api/bookings/upcoming');
      const data = await response.json();

      if (response.ok) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E5E7EB' }}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5" style={{ color: '#2F9E44' }} />
          <h2 className="font-semibold" style={{ fontSize: '16px', color: '#1F2933' }}>
            Próximas reservas
          </h2>
        </div>
        <p style={{ fontSize: '14px', color: '#6B7280' }}>Cargando...</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E5E7EB' }}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5" style={{ color: '#2F9E44' }} />
          <h2 className="font-semibold" style={{ fontSize: '16px', color: '#1F2933' }}>
            Próximas reservas
          </h2>
        </div>
        <p style={{ fontSize: '14px', color: '#6B7280' }}>
          No hay reservas próximas
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E5E7EB' }}>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5" style={{ color: '#2F9E44' }} />
        <h2 className="font-semibold" style={{ fontSize: '16px', color: '#1F2933' }}>
          Próximas reservas
        </h2>
      </div>

      <div className="space-y-3">
        {bookings.map((booking) => {
          const bookingDate = new Date(booking.startTime);
          
          // Check if booking extends to next day by parsing timeSlot
          // timeSlot format is "HH:MM-HH:MM" (e.g., "20:00-09:00")
          const [startTimeStr, endTimeStr] = booking.timeSlot.split('-');
          const [startHour] = startTimeStr.split(':').map(Number);
          const [endHour] = endTimeStr.split(':').map(Number);
          
          // If end hour is less than start hour, it means it crosses to next day
          const extendsToNextDay = endHour < startHour;
          
          // Calculate if it's today or tomorrow
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const bookingDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
          
          const isToday = bookingDay.getTime() === today.getTime();
          const isTomorrow = bookingDay.getTime() === tomorrow.getTime();
          
          let dateLabel;
          if (isToday) {
            dateLabel = 'Hoy';
          } else if (isTomorrow) {
            dateLabel = 'Mañana';
          } else {
            // Format date as "Lunes, 12/Ene/26"
            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const monthNamesShort = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            
            const dayName = dayNames[bookingDate.getDay()];
            const day = bookingDate.getDate();
            const monthName = monthNamesShort[bookingDate.getMonth()];
            // const year = bookingDate.getFullYear().toString().slice(-2); // Last 2 digits of year
            
            dateLabel = `${dayName}, ${day} de ${monthName}`;
          }

          return (
            <div
              key={booking.id}
              onClick={() => setSelectedBooking(booking)}
              className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-gray-50 cursor-pointer"
              style={{ border: '1px solid #E5E7EB' }}
            >
              <div
                className="p-2 rounded-lg mt-0.5"
                style={{ backgroundColor: '#FEE2E2' }}
              >
                <Clock className="h-4 w-4" style={{ color: '#DC2626' }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className="font-semibold"
                    style={{ fontSize: '14px', color: '#1F2933' }}
                  >
                    {dateLabel}
                  </span>
                  {extendsToNextDay && (
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: '#DBEAFE',
                        color: '#1E40AF',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    >
                      +1 día
                    </span>
                  )}
                </div>
                <p className="font-medium mb-1" style={{ fontSize: '15px', color: '#2F9E44' }}>
                  {formatTimeSlotForDisplay(booking.timeSlot)}
                </p>
                <p style={{ fontSize: '13px', color: '#6B7280' }}>
                  {booking.fullName}
                  {booking.vehiclePlate && booking.vehiclePlate.trim() !== '' && (
                    <span style={{ marginLeft: '8px' }}>
                      - Placa {booking.vehiclePlate}
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <BookingDetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
}
