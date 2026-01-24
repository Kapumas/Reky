import { NextRequest, NextResponse } from 'next/server';
import { getUserByApartment } from '@/lib/firebase/firestore-admin';
import { adminDb } from '@/lib/firebase/admin';
import { timestampToISOString } from '@/lib/utils/dateTime';

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

    const user = await getUserByApartment(apartmentNumber);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Get the last booking with a vehicle plate
    let vehiclePlate = '';
    try {
      const bookingsSnapshot = await adminDb
        .collection('bookings')
        .where('apartmentNumber', '==', apartmentNumber)
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (!bookingsSnapshot.empty) {
        const lastBooking = bookingsSnapshot.docs[0].data();
        if (lastBooking.vehiclePlate && lastBooking.vehiclePlate.trim() !== '') {
          vehiclePlate = lastBooking.vehiclePlate;
        }
      }
    } catch (error) {
      console.error('Error fetching last booking:', error);
      // Continue without vehicle plate if there's an error
    }

    // Convert Firestore Timestamps to ISO strings for JSON serialization
    return NextResponse.json({
      success: true,
      user: {
        ...user,
        createdAt: timestampToISOString(user.createdAt),
        updatedAt: timestampToISOString(user.updatedAt),
        vehiclePlate, // Add vehicle plate from last booking
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);

    return NextResponse.json(
      { error: 'Error al obtener el usuario. Por favor intenta nuevamente.' },
      { status: 500 }
    );
  }
}
