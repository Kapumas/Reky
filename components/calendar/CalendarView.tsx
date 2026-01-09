'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { startOfMonth, endOfMonth, isBefore, startOfDay, eachDayOfInterval, isSameMonth, isToday, format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { BOGOTA_TIMEZONE } from '@/lib/utils/dateTime';

interface Booking {
  id: string;
  apartmentNumber: string;
  fullName: string;
  timeSlot: string;
  bookingDate: string;
}

interface CalendarViewProps {
  onDateClick: (date: Date) => void;
  onNewBooking: () => void;
}

export function CalendarView({ onDateClick, onNewBooking }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay());

  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  useEffect(() => {
    fetchBookings();
  }, [currentMonth]);

  async function fetchBookings() {
    setLoading(true);
    try {
      const monthStr = format(currentMonth, 'yyyy-MM');
      const response = await fetch(`/api/bookings/calendar?month=${monthStr}`);
      const data = await response.json();

      if (response.ok) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }

  function previousMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  }

  function getBookingsForDate(date: Date) {
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.bookingDate);
      return (
        bookingDate.getDate() === date.getDate() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getFullYear() === date.getFullYear()
      );
    });
  }

  function handleDayClick(date: Date) {
    if (!isBefore(date, startOfDay(new Date()))) {
      onDateClick(date);
    }
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
      {/* Calendar Header */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold capitalize" style={{ fontSize: '18px', color: '#1F2933' }}>
            {formatInTimeZone(currentMonth, BOGOTA_TIMEZONE, 'MMMM yyyy', { locale: es })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={previousMonth}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: '#F3F4F6', color: '#1F2933' }}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: '#F3F4F6', color: '#1F2933' }}
              aria-label="Siguiente mes"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center font-medium py-2"
              style={{ fontSize: '12px', color: '#6B7280' }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayBookings = getBookingsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isPast = isBefore(day, startOfDay(new Date()));
            const isCurrentDay = isToday(day);
            const hasBookings = dayBookings.length > 0;

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                disabled={isPast}
                className="min-h-[70px] p-2 rounded-lg transition-all relative"
                style={{
                  backgroundColor: isCurrentMonth ? 'white' : '#F9FAFB',
                  border: `1px solid ${isCurrentDay ? '#2F9E44' : '#E5E7EB'}`,
                  opacity: isPast ? 0.4 : isCurrentMonth ? 1 : 0.6,
                  cursor: isPast ? 'not-allowed' : 'pointer',
                }}
              >
                <div className="flex flex-col h-full">
                  <div
                    className="font-semibold mb-1"
                    style={{
                      fontSize: '14px',
                      color: isCurrentDay ? '#2F9E44' : isCurrentMonth ? '#1F2933' : '#9CA3AF'
                    }}
                  >
                    {format(day, 'd')}
                  </div>

                  {hasBookings && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: '#DC2626' }}
                      />
                      <span style={{ fontSize: '10px', color: '#6B7280', fontWeight: '500' }}>
                        {dayBookings.length}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>Cargando...</div>
        </div>
      )}
    </div>
  );
}
