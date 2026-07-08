import { Timestamp } from 'firebase/firestore';

export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  apartmentNumber: string; // Unique identifier (e.g., "2-101")
  fullName: string;
  email?: string;
  status?: UserStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserInput {
  apartmentNumber: string;
  fullName: string;
  email?: string;
}
