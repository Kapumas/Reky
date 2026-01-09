import { NextRequest, NextResponse } from 'next/server';
import { getBookingByCode } from '@/lib/firebase/firestore-admin';
import { confirmationCodeSchema } from '@/lib/utils/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ confirmationCode: string }> }
) {
  try {
    const { confirmationCode: rawCode } = await params;

    // Validate confirmation code format
    const validation = confirmationCodeSchema.safeParse(rawCode);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Formato de código de confirmación inválido' },
        { status: 400 }
      );
    }

    const confirmationCode = validation.data;

    // Fetch the booking
    const booking = await getBookingByCode(confirmationCode);

    if (!booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Convert Firestore Timestamps to ISO strings for JSON serialization
    return NextResponse.json({
      success: true,
      booking: {
        ...booking,
        bookingDate: booking.bookingDate.toDate().toISOString(),
        startTime: booking.startTime.toDate().toISOString(),
        endTime: booking.endTime.toDate().toISOString(),
        createdAt: booking.createdAt.toDate().toISOString(),
        cancelledAt: booking.cancelledAt?.toDate().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching booking:', error);

    return NextResponse.json(
      { error: 'Error al obtener la reserva. Por favor intenta nuevamente.' },
      { status: 500 }
    );
  }
}
