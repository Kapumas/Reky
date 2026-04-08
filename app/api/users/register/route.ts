import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { registrationFormSchema } from '@/lib/utils/validation';
import { normalizeRegistrationMetrics } from '@/lib/utils/user-registration';

const USERS_COLLECTION = 'users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registrationFormSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos del formulario inválidos', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    const normalizedMetrics = normalizeRegistrationMetrics(data);

    const normalizedApartment = data.apartmentNumber.trim().toUpperCase();
    const userPayload = {
      apartmentNumber: normalizedApartment,
      fullName: data.fullName,
      vehiclePlate: data.vehiclePlate,
      vehicleType: data.vehicleType,
      vehicleBrandModel: data.vehicleBrandModel,
      batteryCapacityKwh: data.batteryCapacityKwh ?? null,
      estimatedRangeKm: data.estimatedRangeKm ?? null,
      dailyAverageDrivingDistance: data.dailyAverageDrivingDistance,
      chargingFrequency: data.chargingFrequency,
      chargingTime220v: data.chargingTime220v,
      chargingTime110v: data.chargingTime110v,
      preferredChargingTime: data.preferredChargingTime ?? null,
      agreedToFairUsage: data.agreedToFairUsage,
      ...normalizedMetrics,
      updatedAt: FieldValue.serverTimestamp(),
    };

    const existingSnapshot = await adminDb
      .collection(USERS_COLLECTION)
      .where('apartmentNumber', '==', normalizedApartment)
      .limit(1)
      .get();

    let userId = '';

    if (existingSnapshot.empty) {
      const docRef = await adminDb.collection(USERS_COLLECTION).add({
        ...userPayload,
        createdAt: FieldValue.serverTimestamp(),
      });
      userId = docRef.id;
    } else {
      const existingDoc = existingSnapshot.docs[0];
      await adminDb.collection(USERS_COLLECTION).doc(existingDoc.id).update(userPayload);
      userId = existingDoc.id;
    }

    return NextResponse.json(
      {
        success: true,
        userId,
        normalized: {
          weekly_sessions: normalizedMetrics.weekly_sessions,
          avg_hours_per_session: normalizedMetrics.avg_hours_per_session,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user profile:', error);

    return NextResponse.json(
      { error: 'Error al guardar el registro. Por favor intenta nuevamente.' },
      { status: 500 }
    );
  }
}
