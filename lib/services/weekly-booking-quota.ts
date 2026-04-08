import type { Booking } from '@/types/booking';
import { getActiveBookingsByApartment } from '@/lib/firebase/firestore-admin';
import {
  buildWeeklyUsageMap,
  getCurrentAndNextWeekStarts,
  getWeekKey,
  getWeeklyHoursByInterval,
  getWeeklyHoursLimit,
  type BookingInterval,
} from '@/lib/utils/weekly-hours';

interface TimestampLike {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
}

export interface WeeklyUsageSummary {
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
  nextBooking: {
    id: string;
    apartmentNumber: string;
    fullName: string;
    vehiclePlate: string;
    timeSlot: string;
    startTime: Date;
    endTime: Date;
  } | null;
}

interface ValidateQuotaInput {
  apartmentNumber: string;
  newStartTime: Date;
  newEndTime: Date;
  ignoreBookingId?: string;
}

function toDate(value: unknown): Date {
  if (!value || typeof value !== 'object') {
    throw new Error('Timestamp inválido en reserva');
  }

  const timestamp = value as TimestampLike;

  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  if (typeof timestamp.seconds === 'number') {
    const nanoseconds = typeof timestamp.nanoseconds === 'number' ? timestamp.nanoseconds : 0;
    return new Date(timestamp.seconds * 1000 + Math.floor(nanoseconds / 1_000_000));
  }

  throw new Error('Timestamp inválido en reserva');
}

function toBookingIntervals(bookings: Booking[], ignoreBookingId?: string): BookingInterval[] {
  return bookings
    .filter((booking) => booking.status === 'active')
    .filter((booking) => (ignoreBookingId ? booking.id !== ignoreBookingId : true))
    .map((booking) => ({
      id: booking.id,
      status: booking.status,
      startTime: toDate(booking.startTime),
      endTime: toDate(booking.endTime),
    }));
}

function toRoundedHours(value: number): number {
  return Number(value.toFixed(2));
}

export async function validateWeeklyHoursQuota({
  apartmentNumber,
  newStartTime,
  newEndTime,
  ignoreBookingId,
}: ValidateQuotaInput): Promise<void> {
  const weeklyLimit = getWeeklyHoursLimit();
  const activeBookings = await getActiveBookingsByApartment(apartmentNumber);

  const usageMap = buildWeeklyUsageMap(toBookingIntervals(activeBookings, ignoreBookingId));
  const newBookingByWeek = getWeeklyHoursByInterval(newStartTime, newEndTime);

  for (const [weekKey, requestedHours] of newBookingByWeek.entries()) {
    const alreadyUsed = usageMap.get(weekKey) ?? 0;
    const projected = toRoundedHours(alreadyUsed + requestedHours);

    if (projected > weeklyLimit) {
      const available = Math.max(0, toRoundedHours(weeklyLimit - alreadyUsed));
      throw new Error(
        `Saldo semanal insuficiente para la semana ${weekKey}. ` +
          `Disponible: ${available}h, solicitado: ${requestedHours}h.`
      );
    }
  }
}

export async function getWeeklyUsageSummary(
  apartmentNumber: string,
  referenceDate?: Date
): Promise<WeeklyUsageSummary> {
  const weeklyLimit = getWeeklyHoursLimit();
  const activeBookings = await getActiveBookingsByApartment(apartmentNumber);

  const intervals = toBookingIntervals(activeBookings);
  const usageMap = buildWeeklyUsageMap(intervals);

  const { currentWeekStart, nextWeekStart } = getCurrentAndNextWeekStarts(referenceDate);
  const currentWeekKey = getWeekKey(currentWeekStart);
  const nextWeekKey = getWeekKey(nextWeekStart);

  const currentUsed = toRoundedHours(usageMap.get(currentWeekKey) ?? 0);
  const nextUsed = toRoundedHours(usageMap.get(nextWeekKey) ?? 0);

  const now = new Date();
  const upcoming = activeBookings
    .map((booking) => ({
      booking,
      startTime: toDate(booking.startTime),
      endTime: toDate(booking.endTime),
    }))
    .filter(({ endTime }) => endTime > now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];

  return {
    weeklyLimit,
    currentWeek: {
      weekKey: currentWeekKey,
      usedHours: currentUsed,
      remainingHours: Math.max(0, toRoundedHours(weeklyLimit - currentUsed)),
    },
    nextWeek: {
      weekKey: nextWeekKey,
      usedHours: nextUsed,
      remainingHours: Math.max(0, toRoundedHours(weeklyLimit - nextUsed)),
    },
    nextBooking: upcoming
      ? {
          id: upcoming.booking.id,
          apartmentNumber: upcoming.booking.apartmentNumber,
          fullName: upcoming.booking.fullName,
          vehiclePlate: upcoming.booking.vehiclePlate || '',
          timeSlot: upcoming.booking.timeSlot,
          startTime: upcoming.startTime,
          endTime: upcoming.endTime,
        }
      : null,
  };
}
