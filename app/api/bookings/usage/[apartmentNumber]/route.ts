import { NextRequest, NextResponse } from 'next/server';
import { getUserByApartment } from '@/lib/firebase/firestore-admin';
import { getWeeklyUsageSummary } from '@/lib/services/weekly-booking-quota';
import { createBogotaDateTime, timestampToISOString } from '@/lib/utils/dateTime';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ apartmentNumber: string }> }
) {
  try {
    const { apartmentNumber } = await params;
    const normalizedApartmentNumber = apartmentNumber?.trim().toUpperCase();
    const dateParam = request.nextUrl.searchParams.get('date');

    if (!normalizedApartmentNumber) {
      return NextResponse.json(
        { error: 'Número de apartamento requerido' },
        { status: 400 }
      );
    }

    let referenceDate: Date | undefined;

    if (dateParam) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateParam)) {
        return NextResponse.json(
          { error: 'Formato de fecha inválido. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }

      referenceDate = createBogotaDateTime(dateParam, 12, 0);
    }

    const apartmentRegex = /^\d+-[A-Z0-9]+$/;
    if (!apartmentRegex.test(normalizedApartmentNumber)) {
      return NextResponse.json(
        { error: 'Formato de apartamento inválido. Use TORRE-APTO (ej: 1-102B)' },
        { status: 400 }
      );
    }

    const user = await getUserByApartment(normalizedApartmentNumber);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const usage = await getWeeklyUsageSummary(normalizedApartmentNumber, referenceDate);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        apartmentNumber: user.apartmentNumber,
        fullName: user.fullName,
        createdAt: timestampToISOString(user.createdAt),
        updatedAt: timestampToISOString(user.updatedAt),
      },
      usage: {
        weeklyLimit: usage.weeklyLimit,
        currentWeek: usage.currentWeek,
        nextWeek: usage.nextWeek,
      },
      nextBooking: usage.nextBooking
        ? {
            ...usage.nextBooking,
            startTime: usage.nextBooking.startTime.toISOString(),
            endTime: usage.nextBooking.endTime.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching booking usage:', error);

    return NextResponse.json(
      { error: 'Error al obtener el uso de horas. Por favor intenta nuevamente.' },
      { status: 500 }
    );
  }
}
