'use client';

import { useState, useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface WeeklyCalendarProps {
  onDateSelect?: (date: Date) => void;
}

interface DayAvailability {
  date: Date;
  isAvailable: boolean;
}

export function WeeklyCalendar({ onDateSelect }: WeeklyCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Generate days: 2 previous days + today + 13 future days (16 total)
  const allDays = useMemo(() => {
    const days: DayAvailability[] = [];
    const today = new Date();
    // Start from 2 days ago
    for (let i = -2; i < 14; i++) {
      const date = addDays(today, i);
      days.push({
        date,
        isAvailable: i % 3 !== 0, // Mock availability
      });
    }
    return days;
  }, []);

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
                  width: 'calc((100% - 12px) / 7)', // 7 items visible with 6 gaps of 2px
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
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: day.isAvailable
                      ? isSelected
                        ? 'white'
                        : '#2F9E44'
                      : '#E5E7EB',
                  }}
                />
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
          <span style={{ fontSize: '14px', color: '#6B7280' }}>Ocupado</span>
        </div>
      </div>
    </div>
  );
}
