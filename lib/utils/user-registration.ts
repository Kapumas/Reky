import { RegistrationFormSchema } from './validation';

const frequencyToWeeklySessions: Record<RegistrationFormSchema['chargingFrequency'], number> = {
  daily: 7,
  every_2_days: 3.5,
  two_to_three_times_week: 2.5,
  once_week: 1,
};

const chargingTime220vToHours: Record<RegistrationFormSchema['chargingTime220v'], number> = {
  '1_2': 1.5,
  '2_4': 3,
  '4_6': 5,
  '6_plus': 7,
};

const chargingTime110vToHours: Record<RegistrationFormSchema['chargingTime110v'], number> = {
  '2_4': 3,
  '4_6': 5,
  '6_8': 7,
  '8_plus': 9,
};

export function normalizeRegistrationMetrics(data: RegistrationFormSchema) {
  const weeklySessions = frequencyToWeeklySessions[data.chargingFrequency];
  const chargingHours220v = chargingTime220vToHours[data.chargingTime220v];
  const chargingHours110v = chargingTime110vToHours[data.chargingTime110v];
  const avgHoursPerSession = Number(((chargingHours220v + chargingHours110v) / 2).toFixed(2));

  return {
    weekly_sessions: weeklySessions,
    avg_hours_per_session: avgHoursPerSession,
    charging_hours_220v: chargingHours220v,
    charging_hours_110v: chargingHours110v,
  };
}
