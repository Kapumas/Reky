import { NextRequest, NextResponse } from 'next/server';
import { getBookingsByApartment } from '@/lib/firebase/firestore-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ apartmentNumber: string }> }
) {
  try {
    const { apartmentNumber } = await params;

    if (!apartmentNumber) {
      return NextResponse.json(
        { error: 'Número de apartamento requerido' },
        { status: 400 }
      );
    }

    // Validate apartment format (TORRE-APTO)
    const apartmentRegex = /^\d+-\d+$/;
    if (!apartmentRegex.test(apartmentNumber)) {
      return NextResponse.json(
        { error: 'Formato de apartamento inválido. Use TORRE-APTO (ej: 2-101)' },
        { status: 400 }
      );
    }

    const bookings = await getBookingsByApartment(apartmentNumber);

    if (bookings.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron reservas para este apartamento' },
        { status: 404 }
      );
    }

    // Convert Firestore Timestamps to ISO strings for JSON serialization
    const serializedBookings = bookings.map(booking => ({
      ...booking,
      bookingDate: booking.bookingDate.toDate().toISOString(),
      startTime: booking.startTime.toDate().toISOString(),
      endTime: booking.endTime.toDate().toISOString(),
      createdAt: booking.createdAt.toDate().toISOString(),
      cancelledAt: booking.cancelledAt?.toDate().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      bookings: serializedBookings,
    });
  } catch (error) {
    console.error('Error fetching bookings by apartment:', error);

    return NextResponse.json(
      { error: 'Error al obtener las reservas. Por favor intenta nuevamente.' },
      { status: 500 }
    );
  }
}
