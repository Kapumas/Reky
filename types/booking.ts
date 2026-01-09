import { Timestamp } from 'firebase/firestore';

export type BookingStatus = 'active' | 'cancelled';

export interface Booking {
  id: string;
  confirmationCode: string;
  apartmentNumber: string;
  fullName: string;
  vehiclePlate: string;
  bookingDate: Timestamp;
  timeSlot: string;
  startTime: Timestamp;
  endTime: Timestamp;
  status: BookingStatus;
  createdAt: Timestamp;
  cancelledAt?: Timestamp;
}

export interface BookingInput {
  apartmentNumber: string;
  fullName: string;
  vehiclePlate: string;
  bookingDate: Date;
  timeSlot: string;
  startTime: Date;
  endTime: Date;
}

export interface BookingFormData {
  apartmentNumber: string;
  fullName: string;
  vehiclePlate: string;
  date: string;
  timeSlot: string;
}

export interface BookingResponse {
  id: string;
  confirmationCode: string;
  booking: Booking;
}
