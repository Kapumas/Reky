import { NextRequest, NextResponse } from 'next/server';
import { getBookingsByDate } from '@/lib/firebase/firestore-admin';
import { parseDateInBogotaTimezone } from '@/lib/utils/dateTime';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date } = body;

    if (!date) {
      return NextResponse.json(
        { error: 'La fecha es requerida' },
        { status: 400 }
      );
    }

    const bookingDate = parseDateInBogotaTimezone(date);

    // Get all active bookings for the selected date
    const bookings = await getBookingsByDate(bookingDate);

    // Extract booked time slots
    const bookedSlots = bookings.map((booking) => booking.timeSlot);

    return NextResponse.json({
      success: true,
      bookedSlots,
    });
  } catch (error) {
    console.error('Error checking availability:', error);

    return NextResponse.json(
      { error: 'Error al verificar disponibilidad. Por favor intenta nuevamente.' },
      { status: 500 }
    );
  }
}
