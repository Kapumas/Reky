import { z } from 'zod';
import { TIME_SLOTS } from '../constants';

export const bookingFormSchema = z.object({
  apartmentNumber: z
    .string()
    .min(1, 'El número de apartamento es requerido')
    .max(10, 'El número de apartamento debe tener máximo 10 caracteres')
    .regex(/^[a-zA-Z0-9-]+$/, 'El número de apartamento solo puede contener letras, números y guiones'),
  fullName: z
    .string()
    .min(2, 'El nombre completo debe tener al menos 2 caracteres')
    .max(100, 'El nombre completo debe tener máximo 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, 'El nombre solo puede contener letras, espacios, guiones y apóstrofes'),
  vehiclePlate: z
    .string()
    .min(1, 'La placa del vehículo es requerida')
    .max(6, 'La placa debe tener máximo 6 caracteres')
    .regex(/^[A-Z0-9]+$/, 'La placa solo puede contener letras mayúsculas y números'),
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
  
  return duration > 0 && duration <= 8;
}, {
  message: 'La duración debe ser entre 1 y 8 horas',
  path: ['endTime'],
});

export const confirmationCodeSchema = z
  .string()
  .min(1, 'El código de confirmación es requerido')
  .transform((val) => val.replace('-', '').toUpperCase())
  .refine((val) => val.length === 8, 'El código de confirmación debe tener 8 caracteres')
  .refine((val) => /^[A-Z0-9]{8}$/.test(val), 'Formato de código de confirmación inválido');

export type BookingFormSchema = z.infer<typeof bookingFormSchema>;
export type ConfirmationCodeSchema = z.infer<typeof confirmationCodeSchema>;
