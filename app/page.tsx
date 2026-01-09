'use client';

import { useState } from 'react';
import { BookingModal } from '@/components/booking/BookingModal';
import { WeeklyCalendar } from '@/components/calendar/WeeklyCalendar';
import { DayBookingsModal } from '@/components/calendar/DayBookingsModal';
import { UpcomingBookings } from '@/components/home/UpcomingBookings';
import { ActiveBookingCard } from '@/components/home/ActiveBookingCard';

export default function HomePage() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  function handleDateSelect(date: Date) {
    setSelectedDate(date);
    setIsDayModalOpen(true);
  }

  function handleOpenBooking() {
    setIsBookingModalOpen(true);
  }

  function handleCloseBookingModal() {
    setIsBookingModalOpen(false);
  }

  function handleCloseDayModal() {
    setIsDayModalOpen(false);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F6F8F7' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-semibold mb-2" style={{ fontSize: '22px', color: '#1F2933' }}>
            📅 Colinas del Mameyal
          </h1>
        </div>

        <ActiveBookingCard />

        <div className="bg-white rounded-xl p-6 mb-6" style={{ border: '1px solid #E5E7EB' }}>
          <WeeklyCalendar onDateSelect={handleDateSelect} />
        </div>

        <button
          onClick={handleOpenBooking}
          className="w-full rounded-xl font-semibold transition-all active:scale-98 mb-6"
          style={{
            backgroundColor: '#2F9E44',
            color: 'white',
            fontSize: '16px',
            minHeight: '56px',
            border: 'none',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          Agendar carga
        </button>

        <UpcomingBookings />
      </div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={handleCloseBookingModal}
        selectedDate={selectedDate}
      />

      {selectedDate && (
        <DayBookingsModal
          isOpen={isDayModalOpen}
          onClose={handleCloseDayModal}
          selectedDate={selectedDate}
          onNewBooking={handleOpenBooking}
        />
      )}
    </div>
  );
}
