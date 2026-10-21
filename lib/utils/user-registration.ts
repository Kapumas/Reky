import { RegistrationFormSchema } from './validation';

// These metrics are informational only: they are stored with the user profile
// for reference and do not affect bookings, availability, or any other logic.

const frequencyToWeeklySessions: Record<RegistrationFormSchema['chargingFrequency'], number> = {
  daily: 7,
  every_2_days: 3.5,
  two_to_three_times_week: 2.5,
  once_week: 1,
};

const chargingTime220vToHours: Record<RegistrationFormSchema['chargingTime220v'], number | null> = {
  '1_2': 1.5,
  '2_4': 3,
  '4_6': 5,
  '6_plus': 7,
  not_applicable: null,
};

const chargingTime110vToHours: Record<RegistrationFormSchema['chargingTime110v'], number | null> = {
  '0_2': 1,
  '2_4': 3,
  '4_6': 5,
  '6_8': 7,
  '8_plus': 9,
  not_applicable: null,
};

export function normalizeRegistrationMetrics(data: RegistrationFormSchema) {
  const weeklySessions = frequencyToWeeklySessions[data.chargingFrequency];
  const chargingHours220v = chargingTime220vToHours[data.chargingTime220v];
  const chargingHours110v = chargingTime110vToHours[data.chargingTime110v];
  const reportedHours = [chargingHours220v, chargingHours110v].filter(
    (hours): hours is number => hours !== null
  );
  const avgHoursPerSession = reportedHours.length
    ? Number((reportedHours.reduce((sum, hours) => sum + hours, 0) / reportedHours.length).toFixed(2))
    : null;

  return {
    weekly_sessions: weeklySessions,
    avg_hours_per_session: avgHoursPerSession,
    charging_hours_220v: chargingHours220v,
    charging_hours_110v: chargingHours110v,
  };
}
