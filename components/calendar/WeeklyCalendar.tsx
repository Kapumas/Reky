'use client';

import { useState, useMemo, useEffect } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatDateForInput } from '@/lib/utils/dateTime';

// Calendar display configuration
const DAYS_BEFORE = 2; // Number of days to show before today
const DAYS_AFTER = 15; // Number of days to show after today

interface WeeklyCalendarProps {
  onDateSelect?: (date: Date) => void;
}

interface DayAvailability {
  date: Date;
  isAvailable: boolean;
  hasBookings: boolean;
}

interface Booking {
  id: string;
  bookingDate: string;
}

export function WeeklyCalendar({ onDateSelect }: WeeklyCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Calculate total days to display
  const TOTAL_DAYS = DAYS_BEFORE + 1 + DAYS_AFTER; // before + today + after
  const VISIBLE_DAYS = Math.min(TOTAL_DAYS, 7); // Max 7 days visible at once

  // Fetch bookings for current and next month (to cover the full date range)
  useEffect(() => {
    async function fetchBookings() {
      try {
        const today = new Date();
        const endDate = addDays(today, DAYS_AFTER); // Last day shown in calendar
        
        // Get unique months to fetch
        const months = new Set<string>();
        months.add(format(today, 'yyyy-MM'));
        months.add(format(endDate, 'yyyy-MM'));
        
        // Fetch bookings for all relevant months
        const allBookings: Booking[] = [];
        for (const monthStr of months) {
          const response = await fetch(`/api/bookings/calendar?month=${monthStr}`);
          if (response.ok) {
            const data = await response.json();
            allBookings.push(...(data.bookings || []));
          }
        }
        
        setBookings(allBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  // Generate days based on configuration
  const allDays = useMemo(() => {
    const days: DayAvailability[] = [];
    const today = new Date();
    // Start from DAYS_BEFORE days ago
    for (let i = -DAYS_BEFORE; i <= DAYS_AFTER; i++) {
      const date = addDays(today, i);
      const dateString = formatDateForInput(date);
      
      // Check if this date has any bookings
      // Convert ISO date to YYYY-MM-DD for comparison
      const hasBookings = bookings.some(booking => {
        const bookingDate = new Date(booking.bookingDate);
        const bookingDateString = formatDateForInput(bookingDate);
        return bookingDateString === dateString;
      });
      
      days.push({
        date,
        isAvailable: !hasBookings, // Available if no bookings
        hasBookings,
      });
    }
    return days;
  }, [bookings]);

  const handleDateClick = (day: DayAvailability) => {
    setSelectedDate(day.date);
    if (onDateSelect) {
      onDateSelect(day.date);
    }
  };

  return (
    <div className="w-full">
      {/* Horizontal scrollable container */}
      <div 
        className="overflow-x-auto scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div className="flex gap-2 pb-2" style={{ minWidth: 'min-content' }}>
          {allDays.map((day, index) => {
            const isSelected = selectedDate && isSameDay(day.date, selectedDate);
            const isToday = isSameDay(day.date, new Date());

            return (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                className="flex flex-col items-center py-2 px-1 rounded-xl transition-all flex-shrink-0 relative"
                style={{
                  backgroundColor: isSelected ? '#2F9E44' : 'white',
                  border: `1px solid ${isToday ? '#2F9E44' : '#E5E7EB'}`,
                  minHeight: '65px',
                  width: `calc((100% - ${(VISIBLE_DAYS - 1) * 8}px) / ${VISIBLE_DAYS})`, // Dynamic width based on visible days
                  minWidth: '45px',
                  maxWidth: '60px',
                }}
              >
                {isToday && (
                  <div
                    className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: '#2F9E44',
                      fontSize: '8px',
                      fontWeight: '600',
                      color: 'white',
                    }}
                  >
                    Hoy
                  </div>
                )}
                <span
                  className="text-xs font-medium mb-0.5"
                  style={{ color: isSelected ? 'white' : '#6B7280', fontSize: '10px' }}
                >
                  {format(day.date, 'EEE', { locale: es }).toUpperCase()}
                </span>
                <span
                  className="text-xl font-semibold mb-1"
                  style={{ color: isSelected ? 'white' : '#1F2933' }}
                >
                  {format(day.date, 'd')}
                </span>
                {!loading && (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: day.hasBookings
                        ? '#E5E7EB' // Gris si hay reservas (ocupado)
                        : isSelected
                        ? 'white'
                        : '#2F9E44', // Verde si está disponible
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* CSS to hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="flex items-center justify-center gap-6 mt-6">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: '#2F9E44' }}
          />
          <span style={{ fontSize: '14px', color: '#6B7280' }}>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: '#E5E7EB' }}
          />
          <span style={{ fontSize: '14px', color: '#6B7280' }}>Con reservas</span>
        </div>
      </div>
    </div>
  );
}
