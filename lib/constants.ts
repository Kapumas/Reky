export const CHARGING_CONSTANTS = {
  SLOT_DURATION_HOURS: 2,
  BUSINESS_HOURS_START: 6,
  BUSINESS_HOURS_END: 22,
  MAX_DAYS_ADVANCE: 30,
  MIN_HOURS_ADVANCE: 2,
} as const;

export const APP_NAME = 'Booky';

export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  const { BUSINESS_HOURS_START, BUSINESS_HOURS_END, SLOT_DURATION_HOURS } = CHARGING_CONSTANTS;

  for (let hour = BUSINESS_HOURS_START; hour < BUSINESS_HOURS_END; hour += SLOT_DURATION_HOURS) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endHour = hour + SLOT_DURATION_HOURS;
    const endTime = `${endHour.toString().padStart(2, '0')}:00`;
    slots.push(`${startTime}-${endTime}`);
  }

  return slots;
}

// Available time slots for the charging station
export const TIME_SLOTS = generateTimeSlots();
// ['06:00-08:00', '08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00']
