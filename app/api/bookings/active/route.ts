import { NextResponse } from 'next/server';
import { getCurrentActiveBooking } from '@/lib/firebase/firestore';

export async function GET() {
  try {
    const booking = await getCurrentActiveBooking();

    if (!booking) {
      return NextResponse.json(
        { booking: null, message: 'No hay reservas activas en este momento' },
        { status: 200 }
      );
    }

    const bookingData = {
      id: booking.id,
      confirmationCode: booking.confirmationCode,
      apartmentNumber: booking.apartmentNumber,
      fullName: booking.fullName,
      vehiclePlate: booking.vehiclePlate,
      timeSlot: booking.timeSlot,
      startTime: booking.startTime.toDate().toISOString(),
      endTime: booking.endTime.toDate().toISOString(),
      status: booking.status,
    };

    return NextResponse.json({ booking: bookingData }, { status: 200 });
  } catch (error) {
    console.error('Error fetching active booking:', error);
    return NextResponse.json(
      { error: 'Error al obtener la reserva activa' },
      { status: 500 }
    );
  }
}
