import { NextRequest, NextResponse } from 'next/server';
import { getBookingsByApartment } from '@/lib/firebase/firestore-admin';
import { timestampToISOString } from '@/lib/utils/dateTime';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ apartmentNumber: string }> }
) {
  try {
    const { apartmentNumber } = await params;
    const normalizedApartmentNumber = apartmentNumber?.trim().toUpperCase();

    if (!normalizedApartmentNumber) {
      return NextResponse.json(
        { error: 'Número de apartamento requerido' },
        { status: 400 }
      );
    }

    // Validate apartment format (TORRE-APTO)
    const apartmentRegex = /^\d+-[A-Z0-9]+$/;
    if (!apartmentRegex.test(normalizedApartmentNumber)) {
      return NextResponse.json(
        { error: 'Formato de apartamento inválido. Use TORRE-APTO (ej: 1-102B)' },
        { status: 400 }
      );
    }

    const bookings = await getBookingsByApartment(normalizedApartmentNumber);

    if (bookings.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron reservas para este apartamento' },
        { status: 404 }
      );
    }

    // Convert Firestore Timestamps to ISO strings for JSON serialization
    const serializedBookings = bookings.map(booking => ({
      ...booking,
      bookingDate: timestampToISOString(booking.bookingDate),
      startTime: timestampToISOString(booking.startTime),
      endTime: timestampToISOString(booking.endTime),
      createdAt: timestampToISOString(booking.createdAt),
      cancelledAt: booking.cancelledAt ? timestampToISOString(booking.cancelledAt) : undefined,
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
