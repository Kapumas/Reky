import { NextRequest, NextResponse } from 'next/server';
import { upsertUser } from '@/lib/firebase/firestore-admin';
import { timestampToISOString } from '@/lib/utils/dateTime';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apartmentNumber, fullName, email } = body;
    const normalizedApartmentNumber = apartmentNumber?.trim().toUpperCase();

    // Validate required fields
    if (!normalizedApartmentNumber || !fullName) {
      return NextResponse.json(
        { error: 'Apartamento y nombre son requeridos' },
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

    // Upsert user
    const user = await upsertUser({
      apartmentNumber: normalizedApartmentNumber,
      fullName,
      email,
    });

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        createdAt: timestampToISOString(user.createdAt),
        updatedAt: timestampToISOString(user.updatedAt),
      },
    });
  } catch (error) {
    console.error('Error upserting user:', error);

    return NextResponse.json(
      { error: 'Error al crear/actualizar el usuario. Por favor intenta nuevamente.' },
      { status: 500 }
    );
  }
}
