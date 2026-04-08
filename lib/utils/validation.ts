import { z } from 'zod';

export const bookingFormSchema = z.object({
  apartmentNumber: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, 'El número de apartamento es requerido')
    .max(10, 'El número de apartamento debe tener máximo 10 caracteres')
    .regex(/^\d+-[A-Z0-9]+$/, 'El número de apartamento debe tener formato TORRE-APTO (ej: 1-102B)'),
  fullName: z
    .string()
    .trim()
    .min(2, 'El nombre completo debe tener al menos 2 caracteres')
    .max(100, 'El nombre completo debe tener máximo 100 caracteres'),
  vehiclePlate: z
    .string()
    .min(1, 'La placa del vehículo es requerida')
    .max(7, 'La placa debe tener máximo 7 caracteres')
    .regex(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/, 'La placa debe tener el formato ABC-123')
    .transform((val) => val.replace(/-/g, '')),
  date: z
    .string()
    .min(1, 'La fecha es requerida')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  startTime: z
    .string()
    .min(1, 'La hora de inicio es requerida')
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  endTime: z
    .string()
    .min(1, 'La hora de fin es requerida')
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
}).refine((data) => {
  const start = data.startTime.split(':').map(Number);
  const end = data.endTime.split(':').map(Number);
  const startHour = start[0];
  const endHour = end[0];
  
  // Calculate duration in hours (handle cross-day bookings)
  let duration;
  if (endHour >= startHour) {
    duration = endHour - startHour;
  } else {
    // Crosses midnight
    duration = (24 - startHour) + endHour;
  }
  
  return duration > 0 && duration <= 24;
}, {
  message: 'La duración debe ser entre 1 y 24 horas',
  path: ['endTime'],
});

export const confirmationCodeSchema = z
  .string()
  .min(1, 'El código de confirmación es requerido')
  .transform((val) => val.replace('-', '').toUpperCase())
  .refine((val) => val.length === 8, 'El código de confirmación debe tener 8 caracteres')
  .refine((val) => /^[A-Z0-9]{8}$/.test(val), 'Formato de código de confirmación inválido');

const optionalPositiveNumber = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }

    return value;
  },
  z.number().positive('Debe ser un número mayor a 0').optional()
);

export const registrationFormSchema = z.object({
  apartmentNumber: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, 'El número de apartamento es requerido')
    .max(10, 'El número de apartamento debe tener máximo 10 caracteres')
    .regex(/^[0-9]+-[A-Z0-9]+$/, 'El número de apartamento debe tener formato TORRE-APTO (ej: 1-102B)'),
  fullName: z
    .string()
    .trim()
    .min(2, 'El nombre completo debe tener al menos 2 caracteres')
    .max(100, 'El nombre completo debe tener máximo 100 caracteres'),
  vehiclePlate: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, 'La placa del vehículo es requerida')
    .max(7, 'La placa debe tener máximo 7 caracteres')
    .regex(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/, 'La placa debe tener el formato ABC-123')
    .transform((val) => val.replace(/-/g, '')),
  vehicleType: z.enum(['BEV', 'PHEV']),
  vehicleBrandModel: z
    .string()
    .trim()
    .min(1, 'La marca y modelo son requeridos')
    .max(100, 'La marca y modelo debe tener máximo 100 caracteres'),
  batteryCapacityKwh: optionalPositiveNumber,
  estimatedRangeKm: optionalPositiveNumber,
  dailyAverageDrivingDistance: z.enum(['0_20', '20_40', '40_60', '60_100', '100_plus']),
  chargingFrequency: z.enum(['daily', 'every_2_days', 'two_to_three_times_week', 'once_week']),
  chargingTime220v: z.enum(['1_2', '2_4', '4_6', '6_plus']),
  chargingTime110v: z.enum(['2_4', '4_6', '6_8', '8_plus']),
  preferredChargingTime: z.enum(['day', 'night', 'no_preference']).optional(),
  agreedToFairUsage: z.literal(true),
});

export type BookingFormSchema = z.infer<typeof bookingFormSchema>;
export type ConfirmationCodeSchema = z.infer<typeof confirmationCodeSchema>;
export type RegistrationFormSchema = z.infer<typeof registrationFormSchema>;
