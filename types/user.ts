import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  apartmentNumber: string; // Unique identifier (e.g., "2-101")
  fullName: string;
  email?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserInput {
  apartmentNumber: string;
  fullName: string;
  email?: string;
}
