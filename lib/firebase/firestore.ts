import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
  updateDoc,
  doc,
  setDoc,
} from 'firebase/firestore';
import { db } from './config';
import { Booking, BookingInput, BookingResponse } from '@/types/booking';
import { User, UserInput } from '@/types/user';
import { generateConfirmationCode } from '../utils/confirmationCode';
import { parseTimeSlot } from '../utils/dateTime';

const BOOKINGS_COLLECTION = 'bookings';
const USERS_COLLECTION = 'users';

/**
 * Check if a time slot is available for booking
 * @param date - The date to check
 * @param timeSlot - The time slot to check (e.g., "09:00-11:00")
 * @returns Array of conflicting bookings (empty if available)
 */
export async function checkAvailability(
  date: Date,
  timeSlot: string
): Promise<Booking[]> {
  const { startTime, endTime } = parseTimeSlot(date, timeSlot);

  // Query for active bookings that overlap with the requested time slot
  const q = query(
    collection(db, BOOKINGS_COLLECTION),
    where('status', '==', 'active'),
    where('startTime', '<', Timestamp.fromDate(endTime)),
    where('endTime', '>', Timestamp.fromDate(startTime))
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking));
}

/**
 * Create a new booking
 * @param bookingData - The booking data to create
 * @returns The created booking with confirmation code
 * @throws Error if the time slot is already booked
 */
export async function createBooking(
  bookingData: BookingInput
): Promise<BookingResponse> {
  // Check for conflicts
  const conflicts = await checkAvailability(
    bookingData.bookingDate,
    bookingData.timeSlot
  );

  if (conflicts.length > 0) {
    throw new Error('Este horario ya está reservado. Por favor selecciona otro horario.');
  }

  // Generate unique confirmation code
  const confirmationCode = generateConfirmationCode();

  // Create the booking
  const bookingRef = await addDoc(collection(db, BOOKINGS_COLLECTION), {
    confirmationCode,
    apartmentNumber: bookingData.apartmentNumber,
    fullName: bookingData.fullName,
    bookingDate: Timestamp.fromDate(bookingData.bookingDate),
    timeSlot: bookingData.timeSlot,
    startTime: Timestamp.fromDate(bookingData.startTime),
    endTime: Timestamp.fromDate(bookingData.endTime),
    status: 'active',
    createdAt: serverTimestamp(),
  });

  // Fetch the created booking to return complete data
  const snapshot = await getDocs(
    query(
      collection(db, BOOKINGS_COLLECTION),
      where('confirmationCode', '==', confirmationCode)
    )
  );

  const booking = snapshot.docs[0];
  return {
    id: booking.id,
    confirmationCode,
    booking: { id: booking.id, ...booking.data() } as Booking,
  };
}

/**
 * Get a booking by confirmation code
 * @param confirmationCode - The confirmation code to look up
 * @returns The booking if found, null otherwise
 */
export async function getBookingByCode(
  confirmationCode: string
): Promise<Booking | null> {
  const q = query(
    collection(db, BOOKINGS_COLLECTION),
    where('confirmationCode', '==', confirmationCode.toUpperCase())
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const bookingDoc = snapshot.docs[0];
  return { id: bookingDoc.id, ...bookingDoc.data() } as Booking;
}

/**
 * Cancel a booking (soft delete by updating status)
 * @param confirmationCode - The confirmation code of the booking to cancel
 * @throws Error if booking not found or already cancelled
 */
export async function cancelBooking(confirmationCode: string): Promise<void> {
  const booking = await getBookingByCode(confirmationCode);

  if (!booking) {
    throw new Error('Reserva no encontrada');
  }

  if (booking.status === 'cancelled') {
    throw new Error('Esta reserva ya ha sido cancelada');
  }

  // Update the booking status to cancelled
  const bookingRef = doc(db, BOOKINGS_COLLECTION, booking.id);
  await updateDoc(bookingRef, {
    status: 'cancelled',
    cancelledAt: serverTimestamp(),
  });
}

/**
 * Get all active bookings for a specific date
 * @param date - The date to get bookings for
 * @returns Array of active bookings
 */
export async function getBookingsByDate(date: Date): Promise<Booking[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, BOOKINGS_COLLECTION),
    where('status', '==', 'active'),
    where('bookingDate', '>=', Timestamp.fromDate(startOfDay)),
    where('bookingDate', '<=', Timestamp.fromDate(endOfDay))
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking));
}

/**
 * Get all bookings for a specific apartment
 * @param apartmentNumber - The apartment number (format: TORRE-APTO)
 * @returns Array of bookings for the apartment, sorted by date (newest first)
 */
export async function getBookingsByApartment(
  apartmentNumber: string
): Promise<Booking[]> {
  const q = query(
    collection(db, BOOKINGS_COLLECTION),
    where('apartmentNumber', '==', apartmentNumber)
  );

  const snapshot = await getDocs(q);
  const bookings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking));
  
  // Sort by booking date, newest first
  return bookings.sort((a, b) => {
    const dateA = a.bookingDate.toDate().getTime();
    const dateB = b.bookingDate.toDate().getTime();
    return dateB - dateA;
  });
}

/**
 * Get the currently active booking (one that is running right now)
 * @returns The active booking if found, null otherwise
 */
export async function getCurrentActiveBooking(): Promise<Booking | null> {
  const now = new Date();
  const nowTimestamp = Timestamp.fromDate(now);

  const q = query(
    collection(db, BOOKINGS_COLLECTION),
    where('status', '==', 'active'),
    where('startTime', '<=', nowTimestamp),
    where('endTime', '>', nowTimestamp)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const bookingDoc = snapshot.docs[0];
  return { id: bookingDoc.id, ...bookingDoc.data() } as Booking;
}

/**
 * Get user by apartment number
 * @param apartmentNumber - The apartment number (format: TORRE-APTO)
 * @returns User if found, null otherwise
 */
export async function getUserByApartment(
  apartmentNumber: string
): Promise<User | null> {
  const q = query(
    collection(db, USERS_COLLECTION),
    where('apartmentNumber', '==', apartmentNumber)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const userDoc = snapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() } as User;
}

/**
 * Create or update user (upsert)
 * @param userData - User data to create or update
 * @returns The created or updated user
 */
export async function upsertUser(userData: UserInput): Promise<User> {
  // Check if user exists
  const existingUser = await getUserByApartment(userData.apartmentNumber);

  if (existingUser) {
    // Update existing user
    const userRef = doc(db, USERS_COLLECTION, existingUser.id);
    await updateDoc(userRef, {
      fullName: userData.fullName,
      email: userData.email || existingUser.email,
      updatedAt: serverTimestamp(),
    });

    // Fetch updated user
    const updatedSnapshot = await getDocs(
      query(
        collection(db, USERS_COLLECTION),
        where('apartmentNumber', '==', userData.apartmentNumber)
      )
    );
    const updatedDoc = updatedSnapshot.docs[0];
    return { id: updatedDoc.id, ...updatedDoc.data() } as User;
  } else {
    // Create new user
    const userRef = await addDoc(collection(db, USERS_COLLECTION), {
      apartmentNumber: userData.apartmentNumber,
      fullName: userData.fullName,
      email: userData.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Fetch created user
    const snapshot = await getDocs(
      query(
        collection(db, USERS_COLLECTION),
        where('apartmentNumber', '==', userData.apartmentNumber)
      )
    );
    const userDoc = snapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as User;
  }
}
