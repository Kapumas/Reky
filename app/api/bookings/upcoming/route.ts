import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { getBogotaTime, timestampToISOString } from '@/lib/utils/dateTime';

export async function GET(request: NextRequest) {
  try {
    const now = getBogotaTime();
    const nowTimestamp = Timestamp.fromDate(now);

    // Query for upcoming and currently active bookings (endTime > now)
    // This includes bookings that are currently running and future bookings
    const snapshot = await adminDb
      .collection('bookings')
      .where('status', '==', 'active')
      .where('endTime', '>', nowTimestamp)
      .orderBy('endTime', 'asc')
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
        bookingDate: timestampToISOString(data.bookingDate),
        startTime: timestampToISOString(data.startTime),
        endTime: timestampToISOString(data.endTime),
        createdAt: timestampToISOString(data.createdAt),
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
