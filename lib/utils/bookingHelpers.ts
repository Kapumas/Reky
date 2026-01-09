import { isSameDay, parseISO } from 'date-fns';
import { formatDateForInput, formatDateWithDayName, getBogotaTime } from './dateTime';

export interface Booking {
  id: string;
  confirmationCode: string;
  apartmentNumber: string;
  fullName: string;
  vehiclePlate: string;
  timeSlot: string;
  status: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  cancelledAt?: string;
}

export interface GroupedBookings {
  dateString: string;
  date: Date;
  dateLabel: string;
  bookings: Booking[];
  activeCount: number;
  cancelledCount: number;
}

/**
 * Format date for group header display
 */
export function formatDateHeader(date: Date): string {
  const today = getBogotaTime();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isSameDay(date, today)) {
    return 'Hoy';
  }
  if (isSameDay(date, tomorrow)) {
    return 'Mañana';
  }
  
  return formatDateWithDayName(date);
}

/**
 * Groups bookings by date
 * @param bookings - Array of bookings to group
 * @returns Array of grouped bookings by date, sorted by date (newest first)
 */
export function groupBookingsByDate(bookings: Booking[]): GroupedBookings[] {
  const grouped = new Map<string, GroupedBookings>();

  // Sort bookings by date
  const sortedBookings = [...bookings].sort((a, b) => {
    return new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime();
  });

  // Group by date
  sortedBookings.forEach((booking) => {
    const date = parseISO(booking.bookingDate);
    const dateString = formatDateForInput(date);

    if (!grouped.has(dateString)) {
      grouped.set(dateString, {
        date,
        dateString,
        dateLabel: formatDateHeader(date),
        bookings: [],
        activeCount: 0,
        cancelledCount: 0,
      });
    }

    const group = grouped.get(dateString)!;
    group.bookings.push(booking);
    
    if (booking.status === 'active') {
      group.activeCount++;
    } else if (booking.status === 'cancelled') {
      group.cancelledCount++;
    }
  });

  // Sort bookings within each group by start time
  grouped.forEach((group) => {
    group.bookings.sort((a, b) => {
      const timeA = parseISO(a.startTime).getTime();
      const timeB = parseISO(b.startTime).getTime();
      return timeA - timeB;
    });
  });

  // Convert to array and sort by date (newest first)
  return Array.from(grouped.values()).sort((a, b) => {
    return b.date.getTime() - a.date.getTime();
  });
}
