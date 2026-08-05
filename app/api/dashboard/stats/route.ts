import { NextRequest, NextResponse } from 'next/server';
import { subMonths } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { adminDb } from '@/lib/firebase/admin';
import { Booking } from '@/types/booking';
import { BOGOTA_TIMEZONE, getBogotaTime } from '@/lib/utils/dateTime';
import { DASHBOARD_AUTH_HEADER, isValidDashboardPassword } from '@/lib/utils/dashboardAuth';

const BOOKINGS_COLLECTION = 'bookings';
const USERS_COLLECTION = 'users';

type StatsRange = '1m' | '6m' | 'all';

function getBookingHours(booking: Booking): number {
  if (booking.startTime && booking.endTime) {
    const startMs = booking.startTime.seconds * 1000;
    const endMs = booking.endTime.seconds * 1000;
    const hours = (endMs - startMs) / (1000 * 60 * 60);
    if (hours > 0 && hours <= 24) {
      return hours;
    }
  }
  return 2;
}

export async function GET(request: NextRequest) {
  try {
    if (!isValidDashboardPassword(request.headers.get(DASHBOARD_AUTH_HEADER))) {
      return new NextResponse(null, { status: 401 });
    }

    const rangeParam = request.nextUrl.searchParams.get('range') || '1m';
    const range: StatsRange = ['1m', '6m', 'all'].includes(rangeParam)
      ? (rangeParam as StatsRange)
      : '1m';

    const now = getBogotaTime();
    const cutoffMs =
      range === '1m'
        ? subMonths(now, 1).getTime()
        : range === '6m'
          ? subMonths(now, 6).getTime()
          : null;

    const [bookingsSnapshot, usersSnapshot] = await Promise.all([
      adminDb.collection(BOOKINGS_COLLECTION).get(),
      adminDb.collection(USERS_COLLECTION).get(),
    ]);

    const inactiveApartments = new Set<string>();
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      if (data.status === 'inactive' && typeof data.apartmentNumber === 'string') {
        inactiveApartments.add(data.apartmentNumber);
      }
    }

    const allBookings = bookingsSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Booking)
    );

    const bookings = cutoffMs
      ? allBookings.filter((b) => b.bookingDate.seconds * 1000 >= cutoffMs)
      : allBookings;

    const activeBookings = bookings.filter((b) => b.status === 'active');
    const cancelledBookings = bookings.filter((b) => b.status === 'cancelled');

    const totalHours = activeBookings.reduce((sum, b) => sum + getBookingHours(b), 0);

    const userStatsMap = new Map<string, { fullName: string; bookings: number; hours: number }>();
    for (const booking of activeBookings) {
      const key = booking.apartmentNumber;
      const current = userStatsMap.get(key) || { fullName: booking.fullName, bookings: 0, hours: 0 };
      current.fullName = booking.fullName;
      current.bookings += 1;
      current.hours += getBookingHours(booking);
      userStatsMap.set(key, current);
    }

    const rankedUsers = Array.from(userStatsMap.entries())
      .map(([apartmentNumber, stats]) => ({ apartmentNumber, ...stats }))
      .sort((a, b) => b.bookings - a.bookings || b.hours - a.hours);

    const uniqueUsers = Array.from(userStatsMap.keys()).filter(
      (apartmentNumber) => !inactiveApartments.has(apartmentNumber)
    ).length;

    const bookingsByHour = new Array<number>(24).fill(0);
    for (const booking of activeBookings) {
      let hour: number | null = null;

      if (booking.startTime) {
        hour = parseInt(
          formatInTimeZone(new Date(booking.startTime.seconds * 1000), BOGOTA_TIMEZONE, 'H'),
          10
        );
      } else if (booking.timeSlot) {
        hour = parseInt(booking.timeSlot.split('-')[0], 10);
      }

      if (hour !== null && !isNaN(hour) && hour >= 0 && hour < 24) {
        bookingsByHour[hour] += 1;
      }
    }

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayOfWeekCounts = new Array(7).fill(0);
    for (const booking of activeBookings) {
      const date = new Date(booking.bookingDate.seconds * 1000);
      dayOfWeekCounts[date.getUTCDay()] += 1;
    }
    const bookingsByDayOfWeek = dayNames.map((day, index) => ({ day, count: dayOfWeekCounts[index] }));

    return NextResponse.json({
      success: true,
      range,
      generatedAt: now.toISOString(),
      totals: {
        bookings: bookings.length,
        activeBookings: activeBookings.length,
        cancelledBookings: cancelledBookings.length,
        totalHours,
        uniqueUsers,
      },
      rankedUsers,
      bookingsByHour,
      bookingsByDayOfWeek,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);

    return new NextResponse(null, { status: 500 });
  }
}
