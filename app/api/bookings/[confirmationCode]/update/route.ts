import { NextRequest, NextResponse } from 'next/server';
import { updateBooking } from '@/lib/firebase/firestore-admin';
import { parseDateInBogotaTimezone } from '@/lib/utils/dateTime';
import { z } from 'zod';

const updateBookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ confirmationCode: string }> }
) {
  try {
    const { confirmationCode } = await params;
    const body = await request.json();

    // Validate input
    const validation = updateBookingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { date, startTime, endTime } = validation.data;

    // Parse date and times
    const bookingDate = parseDateInBogotaTimezone(date);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startDateTime = new Date(bookingDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(bookingDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    // Handle overnight bookings (end time is next day)
    if (endDateTime <= startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    const timeSlot = `${startTime}-${endTime}`;

    // Update the booking
    const updatedBooking = await updateBooking(confirmationCode, {
      bookingDate,
      timeSlot,
      startTime: startDateTime,
      endTime: endDateTime,
    });

    return NextResponse.json({
      success: true,
      message: 'Reserva actualizada exitosamente',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Error updating booking:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar la reserva. Por favor intenta nuevamente.' },
      { status: 500 }
    );
  }
}
