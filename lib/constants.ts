export const CHARGING_CONSTANTS = {
  SLOT_DURATION_HOURS: 2,
  SLOT_INTERVAL_MINUTES: 30,
  BUSINESS_HOURS_START: 6,
  BUSINESS_HOURS_END: 22,
  MAX_DAYS_ADVANCE: 30,
  MIN_HOURS_ADVANCE: 2,
} as const;

export const APP_NAME = 'Booky';

export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  const { BUSINESS_HOURS_START, BUSINESS_HOURS_END, SLOT_DURATION_HOURS, SLOT_INTERVAL_MINUTES } = CHARGING_CONSTANTS;
  const businessStartMinutes = BUSINESS_HOURS_START * 60;
  const businessEndMinutes = BUSINESS_HOURS_END * 60;
  const slotDurationMinutes = SLOT_DURATION_HOURS * 60;

  for (
    let startMinutes = businessStartMinutes;
    startMinutes + slotDurationMinutes <= businessEndMinutes;
    startMinutes += SLOT_INTERVAL_MINUTES
  ) {
    const endMinutes = startMinutes + slotDurationMinutes;
    const startTime = `${Math.floor(startMinutes / 60).toString().padStart(2, '0')}:${(startMinutes % 60).toString().padStart(2, '0')}`;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
    slots.push(`${startTime}-${endTime}`);
  }

  return slots;
}

// Available time slots for the charging station
export const TIME_SLOTS = generateTimeSlots();
// ['06:00-08:00', '08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00']
