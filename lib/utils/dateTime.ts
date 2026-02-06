import { addDays, startOfDay, isBefore, isAfter, addHours, parse } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { CHARGING_CONSTANTS } from '../constants';

// Bogotá timezone
export const BOGOTA_TIMEZONE = 'America/Bogota';

/**
 * Get current date/time in Bogotá timezone
 */
export function getBogotaTime(): Date {
  return toZonedTime(new Date(), BOGOTA_TIMEZONE);
}

/**
 * Parse a time slot string into start and end times
 * @param date - The date for the booking
 * @param timeSlot - Time slot string like "09:00-11:00"
 * @returns Object with startTime and endTime as Date objects
 */
export function parseTimeSlot(date: Date, timeSlot: string): { startTime: Date; endTime: Date } {
  const [startTimeStr, endTimeStr] = timeSlot.split('-');

  const startTime = parse(startTimeStr, 'HH:mm', date);
  let endTime = parse(endTimeStr, 'HH:mm', date);

  // If end time is before or equal to start time, the booking crosses midnight
  // Add one day to the end time
  if (endTime <= startTime) {
    endTime = addDays(endTime, 1);
  }

  return { startTime, endTime };
}

/**
 * Get the minimum selectable date (current date + MIN_HOURS_ADVANCE)
 */
export function getMinDate(): Date {
  return addHours(getBogotaTime(), CHARGING_CONSTANTS.MIN_HOURS_ADVANCE);
}

/**
 * Get the maximum selectable date (current date + MAX_DAYS_ADVANCE)
 */
export function getMaxDate(): Date {
  return addDays(getBogotaTime(), CHARGING_CONSTANTS.MAX_DAYS_ADVANCE);
}

/**
 * Format date for HTML date input (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date): string {
  return formatInTimeZone(date, BOGOTA_TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Format date for display (dd/MM/yyyy)
 */
export function formatDateForDisplay(date: Date): string {
  return formatInTimeZone(date, BOGOTA_TIMEZONE, 'dd/MM/yyyy', { locale: es });
}

/**
 * Format date with day name (e.g., "Jueves, 09/01/2026")
 */
export function formatDateWithDayName(date: Date): string {
  return formatInTimeZone(date, BOGOTA_TIMEZONE, "EEEE, dd/MM/yyyy", { locale: es });
}

/**
 * Format time for display (e.g., "9:00 AM - 11:00 AM")
 */
export function formatTimeSlotForDisplay(timeSlot: string): string {
  const [start, end] = timeSlot.split('-');
  return `${formatTimeToAMPM(start)} - ${formatTimeToAMPM(end)}`;
}

/**
 * Convert 24-hour time to 12-hour AM/PM format
 */
export function formatTimeToAMPM(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Check if a time slot is in the past
 */
export function isTimeSlotPast(date: Date, timeSlot: string): boolean {
  const { endTime } = parseTimeSlot(date, timeSlot);
  const minDate = getMinDate();
  return isBefore(endTime, minDate);
}

/**
 * Check if a date is within the allowed booking range
 */
export function isDateInRange(date: Date): boolean {
  const minDate = startOfDay(getBogotaTime());
  const maxDate = getMaxDate();
  return !isBefore(date, minDate) && !isAfter(date, maxDate);
}

/**
 * Get today's date in YYYY-MM-DD format for date input min attribute
 */
export function getTodayString(): string {
  return formatDateForInput(getBogotaTime());
}

/**
 * Get max date string for date input max attribute
 */
export function getMaxDateString(): string {
  return formatDateForInput(getMaxDate());
}

/**
 * Parse dd/MM/yyyy to Date object
 */
export function parseDDMMYYYY(dateString: string): Date | null {
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // Month is 0-indexed
  const year = parseInt(parts[2]);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  
  return new Date(year, month, day);
}

/**
 * Parse YYYY-MM-DD date string to Date object in Bogota timezone
 * This ensures the date is interpreted correctly regardless of server timezone
 */
export function parseDateInBogotaTimezone(dateString: string): Date {
  // Parse the date string as YYYY-MM-DD
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create date string in ISO format with Bogota timezone offset (-05:00)
  const isoString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00-05:00`;
  
  return new Date(isoString);
}

/**
 * Create a Date object with specific time in Bogota timezone
 */
export function createBogotaDateTime(dateString: string, hours: number, minutes: number = 0): Date {
  // Create ISO string with the specific time in Bogota timezone
  const [year, month, day] = dateString.split('-').map(Number);
  const isoString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00-05:00`;
  
  return new Date(isoString);
}

/**
 * Convert a Firebase Timestamp to ISO string in Bogota timezone
 * This prevents timezone conversion issues when .toDate() is called
 */
export function timestampToISOString(timestamp: { seconds: number; nanoseconds: number }): string {
  // Convert timestamp to milliseconds
  const milliseconds = timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1000000);
  const date = new Date(milliseconds);
  
  // Format in Bogota timezone
  return formatInTimeZone(date, BOGOTA_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
}

/**
 * Convert a Date object to ISO string in Bogota timezone
 */
export function dateToISOStringBogota(date: Date): string {
  return formatInTimeZone(date, BOGOTA_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
}
