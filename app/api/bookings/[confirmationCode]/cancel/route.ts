import { NextRequest, NextResponse } from 'next/server';
import { cancelBooking } from '@/lib/firebase/firestore-admin';
import { confirmationCodeSchema } from '@/lib/utils/validation';

export async function DELETE(
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

    // Cancel the booking
    await cancelBooking(confirmationCode);

    return NextResponse.json({
      success: true,
      message: 'Reserva cancelada exitosamente',
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Reserva no encontrada' },
          { status: 404 }
        );
      }

      if (error.message.includes('already been cancelled')) {
        return NextResponse.json(
          { error: 'Esta reserva ya ha sido cancelada' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Error al cancelar la reserva. Por favor intenta nuevamente.' },
      { status: 500 }
    );
  }
}
