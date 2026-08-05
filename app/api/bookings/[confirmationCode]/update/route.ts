import { NextRequest, NextResponse } from 'next/server';
import { getBookingByCode, updateBooking } from '@/lib/firebase/firestore-admin';
import { createBogotaDateTime } from '@/lib/utils/dateTime';
import { validateWeeklyHoursQuota } from '@/lib/services/weekly-booking-quota';
import { z } from 'zod';

const updateBookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
});

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || request.headers.get('cf-connecting-ip')
    || 'unknown';
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ confirmationCode: string }> }
) {
  try {
    const { confirmationCode } = await params;
    const body = await request.json();

    const existingBooking = await getBookingByCode(confirmationCode);

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

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
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startDateTime = createBogotaDateTime(date, startHour, startMinute);

    let endDate = date;
    if (endHour < startHour) {
      const [year, month, day] = date.split('-').map(Number);
      const currentDate = new Date(Date.UTC(year, month - 1, day));
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      endDate = `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth() + 1).padStart(2, '0')}-${String(currentDate.getUTCDate()).padStart(2, '0')}`;
    }

    const endDateTime = createBogotaDateTime(endDate, endHour, endMinute);

    await validateWeeklyHoursQuota({
      apartmentNumber: existingBooking.apartmentNumber,
      newStartTime: startDateTime,
      newEndTime: endDateTime,
      ignoreBookingId: existingBooking.id,
    });

    const timeSlot = `${startTime}-${endTime}`;

    // Update the booking
    const updatedBooking = await updateBooking(confirmationCode, {
      bookingDate: startDateTime,
      timeSlot,
      startTime: startDateTime,
      endTime: endDateTime,
    }, getClientIp(request));

    return NextResponse.json({
      success: true,
      message: 'Reserva actualizada exitosamente',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Error updating booking:', error);

    if (error instanceof Error) {
      if (error.message.includes('Saldo semanal insuficiente')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }

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
