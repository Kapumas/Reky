import { NextRequest, NextResponse } from 'next/server';
import { getBookingsByDate } from '@/lib/firebase/firestore-admin';
import { parseDateInBogotaTimezone } from '@/lib/utils/dateTime';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date: dateStr } = await params;

    if (!dateStr) {
      return NextResponse.json(
        { error: 'Fecha requerida' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const date = parseDateInBogotaTimezone(dateStr);
    const bookings = await getBookingsByDate(date);

    // Convert Firestore Timestamps to ISO strings for JSON serialization
    const serializedBookings = bookings.map(booking => ({
      id: booking.id,
      apartmentNumber: booking.apartmentNumber,
      fullName: booking.fullName,
      vehiclePlate: booking.vehiclePlate || '',
      timeSlot: booking.timeSlot,
      status: booking.status,
      bookingDate: booking.bookingDate.toDate().toISOString(),
      startTime: booking.startTime.toDate().toISOString(),
      endTime: booking.endTime.toDate().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      bookings: serializedBookings,
      date: dateStr,
    });
  } catch (error) {
    console.error('Error fetching bookings by date:', error);

    return NextResponse.json(
      { error: 'Error al obtener las reservas. Por favor intenta nuevamente.' },
      { status: 500 }
    );
  }
}
