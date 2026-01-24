import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { createBogotaDateTime, timestampToISOString } from '@/lib/utils/dateTime';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month'); // Format: YYYY-MM

    if (!month) {
      return NextResponse.json(
        { error: 'El mes es requerido (formato: YYYY-MM)' },
        { status: 400 }
      );
    }

    // Parse month and create date range in Bogota timezone
    const [year, monthNum] = month.split('-').map(Number);
    const startDateStr = `${year}-${String(monthNum).padStart(2, '0')}-01`;
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    const startDate = createBogotaDateTime(startDateStr, 0, 0);
    const endDate = createBogotaDateTime(endDateStr, 23, 59);

    // Query bookings for the month using Admin SDK
    const snapshot = await adminDb
      .collection('bookings')
      .where('status', '==', 'active')
      .where('bookingDate', '>=', Timestamp.fromDate(startDate))
      .where('bookingDate', '<=', Timestamp.fromDate(endDate))
      .get();

    const bookings = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        bookingDate: timestampToISOString(data.bookingDate),
        startTime: timestampToISOString(data.startTime),
        endTime: timestampToISOString(data.endTime),
        createdAt: timestampToISOString(data.createdAt),
      };
    });

    return NextResponse.json({
      success: true,
      bookings,
      month,
    });
  } catch (error) {
    console.error('Error fetching calendar bookings:', error);

    return NextResponse.json(
      { error: 'Error al obtener las reservas del calendario' },
      { status: 500 }
    );
  }
}
