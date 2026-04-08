import { addDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { BOGOTA_TIMEZONE, createBogotaDateTime, getBogotaTime } from './dateTime';

const DEFAULT_WEEKLY_HOURS_LIMIT = 10;
const MAX_WEEK_ITERATIONS = 20;

export interface BookingInterval {
  id?: string;
  status?: string;
  startTime: Date;
  endTime: Date;
}

function toHourValue(milliseconds: number): number {
  return Number((milliseconds / (1000 * 60 * 60)).toFixed(2));
}

export function getWeeklyHoursLimit(): number {
  const rawValue = process.env.WEEKLY_HOURS_LIMIT;
  const parsed = Number(rawValue);

  if (!rawValue || Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_WEEKLY_HOURS_LIMIT;
  }

  return parsed;
}

export function getWeekKey(weekStart: Date): string {
  return formatInTimeZone(weekStart, BOGOTA_TIMEZONE, 'yyyy-MM-dd');
}

export function getWeekStartBogota(date: Date): Date {
  const dateString = formatInTimeZone(date, BOGOTA_TIMEZONE, 'yyyy-MM-dd');
  const isoDay = Number(formatInTimeZone(date, BOGOTA_TIMEZONE, 'i')); // 1 = Monday

  const dayStart = createBogotaDateTime(dateString, 0, 0);
  return addDays(dayStart, -(isoDay - 1));
}

export function getCurrentAndNextWeekStarts(referenceDate: Date = getBogotaTime()) {
  const currentWeekStart = getWeekStartBogota(referenceDate);
  const nextWeekStart = addDays(currentWeekStart, 7);

  return {
    currentWeekStart,
    nextWeekStart,
  };
}

function getOverlapHours(
  intervalStart: Date,
  intervalEnd: Date,
  rangeStart: Date,
  rangeEnd: Date
): number {
  const start = Math.max(intervalStart.getTime(), rangeStart.getTime());
  const end = Math.min(intervalEnd.getTime(), rangeEnd.getTime());

  if (end <= start) {
    return 0;
  }

  return toHourValue(end - start);
}

export function getWeeklyHoursByInterval(startTime: Date, endTime: Date): Map<string, number> {
  const result = new Map<string, number>();

  if (endTime <= startTime) {
    return result;
  }

  let weekStart = getWeekStartBogota(startTime);
  let iterations = 0;

  while (weekStart < endTime && iterations < MAX_WEEK_ITERATIONS) {
    const weekEnd = addDays(weekStart, 7);
    const hours = getOverlapHours(startTime, endTime, weekStart, weekEnd);

    if (hours > 0) {
      result.set(getWeekKey(weekStart), Number(hours.toFixed(2)));
    }

    weekStart = weekEnd;
    iterations += 1;
  }

  return result;
}

export function buildWeeklyUsageMap(bookings: BookingInterval[]): Map<string, number> {
  const usage = new Map<string, number>();

  bookings.forEach((booking) => {
    if (booking.status && booking.status !== 'active') {
      return;
    }

    const bookingMap = getWeeklyHoursByInterval(booking.startTime, booking.endTime);

    bookingMap.forEach((hours, weekKey) => {
      const previous = usage.get(weekKey) ?? 0;
      usage.set(weekKey, Number((previous + hours).toFixed(2)));
    });
  });

  return usage;
}
