import { adminDb } from './admin';
import { User, UserInput } from '@/types/user';
import { Booking, BookingInput, BookingResponse } from '@/types/booking';
import { generateConfirmationCode } from '../utils/confirmationCode';
import { parseTimeSlot } from '../utils/dateTime';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const BOOKINGS_COLLECTION = 'bookings';
const USERS_COLLECTION = 'users';

/**
 * Check if a time slot is available for booking (Admin SDK)
 */
export async function checkAvailability(
  date: Date,
  timeSlot: string
): Promise<Booking[]> {
  const { startTime, endTime } = parseTimeSlot(date, timeSlot);

  const snapshot = await adminDb
    .collection(BOOKINGS_COLLECTION)
    .where('status', '==', 'active')
    .where('startTime', '<', Timestamp.fromDate(endTime))
    .where('endTime', '>', Timestamp.fromDate(startTime))
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking));
}

/**
 * Create a new booking (Admin SDK)
 */
export async function createBooking(
  bookingData: BookingInput
): Promise<BookingResponse> {
  const conflicts = await checkAvailability(
    bookingData.bookingDate,
    bookingData.timeSlot
  );

  if (conflicts.length > 0) {
    throw new Error('Este horario ya está reservado. Por favor selecciona otro horario.');
  }

  const confirmationCode = generateConfirmationCode();

  await adminDb.collection(BOOKINGS_COLLECTION).add({
    confirmationCode,
    apartmentNumber: bookingData.apartmentNumber,
    fullName: bookingData.fullName,
    vehiclePlate: bookingData.vehiclePlate,
    bookingDate: Timestamp.fromDate(bookingData.bookingDate),
    timeSlot: bookingData.timeSlot,
    startTime: Timestamp.fromDate(bookingData.startTime),
    endTime: Timestamp.fromDate(bookingData.endTime),
    status: 'active',
    createdAt: FieldValue.serverTimestamp(),
  });

  const snapshot = await adminDb
    .collection(BOOKINGS_COLLECTION)
    .where('confirmationCode', '==', confirmationCode)
    .get();

  const booking = snapshot.docs[0];
  return {
    id: booking.id,
    confirmationCode,
    booking: { id: booking.id, ...booking.data() } as Booking,
  };
}

/**
 * Get a booking by confirmation code (Admin SDK)
 */
export async function getBookingByCode(
  confirmationCode: string
): Promise<Booking | null> {
  const snapshot = await adminDb
    .collection(BOOKINGS_COLLECTION)
    .where('confirmationCode', '==', confirmationCode.toUpperCase())
    .get();

  if (snapshot.empty) {
    return null;
  }

  const bookingDoc = snapshot.docs[0];
  return { id: bookingDoc.id, ...bookingDoc.data() } as Booking;
}

/**
 * Cancel a booking (Admin SDK)
 */
export async function cancelBooking(confirmationCode: string): Promise<void> {
  const booking = await getBookingByCode(confirmationCode);

  if (!booking) {
    throw new Error('Reserva no encontrada');
  }

  if (booking.status === 'cancelled') {
    throw new Error('Esta reserva ya ha sido cancelada');
  }

  await adminDb
    .collection(BOOKINGS_COLLECTION)
    .doc(booking.id)
    .update({
      status: 'cancelled',
      cancelledAt: FieldValue.serverTimestamp(),
    });
}

/**
 * Get all active bookings for a specific date (Admin SDK)
 */
export async function getBookingsByDate(date: Date): Promise<Booking[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const snapshot = await adminDb
    .collection(BOOKINGS_COLLECTION)
    .where('status', '==', 'active')
    .where('bookingDate', '>=', Timestamp.fromDate(startOfDay))
    .where('bookingDate', '<=', Timestamp.fromDate(endOfDay))
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking));
}

/**
 * Get all bookings for a specific apartment (Admin SDK)
 */
export async function getBookingsByApartment(
  apartmentNumber: string
): Promise<Booking[]> {
  const snapshot = await adminDb
    .collection(BOOKINGS_COLLECTION)
    .where('apartmentNumber', '==', apartmentNumber)
    .get();

  const bookings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking));
  
  return bookings.sort((a, b) => {
    const dateA = a.bookingDate.toDate().getTime();
    const dateB = b.bookingDate.toDate().getTime();
    return dateB - dateA;
  });
}

/**
 * Get user by apartment number (Admin SDK)
 */
export async function getUserByApartment(
  apartmentNumber: string
): Promise<User | null> {
  const snapshot = await adminDb
    .collection(USERS_COLLECTION)
    .where('apartmentNumber', '==', apartmentNumber)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const userDoc = snapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() } as User;
}

/**
 * Create or update user (Admin SDK)
 */
export async function upsertUser(userData: UserInput): Promise<User> {
  const existingUser = await getUserByApartment(userData.apartmentNumber);

  if (existingUser) {
    const updateData: Record<string, any> = {
      fullName: userData.fullName,
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    if (userData.email !== undefined) {
      updateData.email = userData.email;
    }
    
    await adminDb
      .collection(USERS_COLLECTION)
      .doc(existingUser.id)
      .update(updateData);

    const updatedSnapshot = await adminDb
      .collection(USERS_COLLECTION)
      .where('apartmentNumber', '==', userData.apartmentNumber)
      .get();
    const updatedDoc = updatedSnapshot.docs[0];
    return { id: updatedDoc.id, ...updatedDoc.data() } as User;
  } else {
    const newUserData: Record<string, any> = {
      apartmentNumber: userData.apartmentNumber,
      fullName: userData.fullName,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    if (userData.email) {
      newUserData.email = userData.email;
    }
    
    await adminDb.collection(USERS_COLLECTION).add(newUserData);

    const snapshot = await adminDb
      .collection(USERS_COLLECTION)
      .where('apartmentNumber', '==', userData.apartmentNumber)
      .get();
    const userDoc = snapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as User;
  }
}
