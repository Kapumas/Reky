import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { getBogotaTime } from '@/lib/utils/dateTime';

export async function GET(request: NextRequest) {
  try {
    const now = getBogotaTime();
    const nowTimestamp = Timestamp.fromDate(now);

    // Query for upcoming active bookings
    const snapshot = await adminDb
      .collection('bookings')
      .where('status', '==', 'active')
      .where('startTime', '>=', nowTimestamp)
      .orderBy('startTime', 'asc')
      .limit(5)
      .get();

    const bookings = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        apartmentNumber: data.apartmentNumber,
        fullName: data.fullName,
        vehiclePlate: data.vehiclePlate || '',
        timeSlot: data.timeSlot,
        status: data.status,
        bookingDate: data.bookingDate.toDate().toISOString(),
        startTime: data.startTime.toDate().toISOString(),
        endTime: data.endTime.toDate().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error('Error fetching upcoming bookings:', error);

    return NextResponse.json(
      { error: 'Error al obtener las próximas reservas. Por favor intenta nuevamente.' },
      { status: 500 }
    );
  }
}
