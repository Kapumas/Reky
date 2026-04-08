'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WeeklyCalendar } from '@/components/calendar/WeeklyCalendar';
import { DayBookingsModal } from '@/components/calendar/DayBookingsModal';
import { ActiveBookingCard } from '@/components/home/ActiveBookingCard';
import { UpcomingBookings } from '@/components/home/UpcomingBookings';
import { SessionGuard } from '@/components/auth/SessionGuard';
import { useUserSession } from '@/hooks/useUserSession';

interface UsageResponse {
  usage: {
    weeklyLimit: number;
    currentWeek: {
      weekKey: string;
      usedHours: number;
      remainingHours: number;
    };
    nextWeek: {
      weekKey: string;
      usedHours: number;
      remainingHours: number;
    };
  };
  nextBooking: {
    timeSlot: string;
    startTime: string;
  } | null;
}

export default function HomePage() {
  const router = useRouter();
  const { session, firstName } = useUserSession();
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [usageData, setUsageData] = useState<UsageResponse | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  useEffect(() => {
    if (!session?.apartmentNumber) {
      setIsLoadingUsage(false);
      return;
    }

    fetchUsageSummary(session.apartmentNumber);
  }, [session?.apartmentNumber]);

  async function fetchUsageSummary(apartmentNumber: string) {
    setIsLoadingUsage(true);
    try {
      const response = await fetch(`/api/bookings/usage/${apartmentNumber}`);
      const data = await response.json();

      if (response.ok) {
        setUsageData(data);
      }
    } catch (error) {
      console.error('Error fetching usage summary:', error);
    } finally {
      setIsLoadingUsage(false);
    }
  }

  function handleDateSelect(date: Date) {
    setSelectedDate(date);
    setIsDayModalOpen(true);
  }

  function handleOpenBooking(date?: Date) {
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      router.push(`/book?date=${dateStr}`);
    } else {
      router.push('/book');
    }
  }

  function handleCloseDayModal() {
    setIsDayModalOpen(false);
  }

  const weeklyRemainingHours = isLoadingUsage || !usageData
    ? '...'
    : usageData.usage.currentWeek.remainingHours;

  return (
    <SessionGuard>
      <div className="min-h-screen" style={{ backgroundColor: '#F6F8F7' }}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-6">
            <div>
              <h1 className="font-semibold" style={{ fontSize: '24px', color: '#1F2933' }}>
                Hola {firstName || 'vecino'}, tienes {weeklyRemainingHours} horas de carga para esta semana
              </h1>
              <p style={{ fontSize: '13px', color: '#6B7280' }}>
                Apartamento {session?.apartmentNumber}
              </p>
            </div>
          </div>

          <ActiveBookingCard />

          <div className="mb-6">
            <UpcomingBookings />
          </div>

          <div className="bg-white rounded-xl p-6 mb-6" style={{ border: '1px solid #E5E7EB' }}>
            <WeeklyCalendar onDateSelect={handleDateSelect} />
          </div>

          <button
            onClick={() => handleOpenBooking()}
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
        </div>

        {selectedDate && (
          <DayBookingsModal
            isOpen={isDayModalOpen}
            onClose={handleCloseDayModal}
            selectedDate={selectedDate}
          />
        )}
      </div>
    </SessionGuard>
  );
}
