import { NextRequest, NextResponse } from 'next/server';
import { createBooking, upsertUser } from '@/lib/firebase/firestore-admin';
import { bookingFormSchema } from '@/lib/utils/validation';
import { parseDateInBogotaTimezone, createBogotaDateTime } from '@/lib/utils/dateTime';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = bookingFormSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos del formulario inválidos', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { apartmentNumber, fullName, vehiclePlate, date, startTime, endTime } = validation.data;

    // Upsert user data (create or update if name changed)
    await upsertUser({
      apartmentNumber,
      fullName,
    });

    // Parse date in Bogota timezone
    const bookingDate = parseDateInBogotaTimezone(date);
    const timeSlot = `${startTime}-${endTime}`;
    
    // Parse start and end times as Date objects in Bogota timezone
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startTimeDate = createBogotaDateTime(date, startHour, startMinute);
    const endTimeDate = createBogotaDateTime(date, endHour, endMinute);

    // Create the booking
    const result = await createBooking({
      apartmentNumber,
      fullName,
      vehiclePlate,
      bookingDate,
      timeSlot,
      startTime: startTimeDate,
      endTime: endTimeDate,
    });

    return NextResponse.json(
      {
        success: true,
        confirmationCode: result.confirmationCode,
        booking: {
          apartmentNumber,
          fullName,
          vehiclePlate,
          date,
          timeSlot,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating booking:', error);

    if (error instanceof Error && error.message.includes('already booked')) {
      return NextResponse.json(
        { error: 'Este horario ya está reservado. Por favor selecciona otro horario.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear la reserva. Por favor intenta nuevamente.' },
      { status: 500 }
    );
  }
}
