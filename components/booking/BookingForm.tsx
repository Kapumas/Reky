'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { DatePicker } from './DatePicker';
import { TimePicker } from './TimePicker';
import { bookingFormSchema, BookingFormSchema } from '@/lib/utils/validation';
import { formatDateForInput } from '@/lib/utils/dateTime';

interface BookingFormProps {
  preSelectedDate?: Date;
  onSuccess?: () => void;
}

export function BookingForm({ preSelectedDate, onSuccess }: BookingFormProps = {}) {
  const router = useRouter();
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormSchema>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      apartmentNumber: '',
      fullName: '',
      date: preSelectedDate ? formatDateForInput(preSelectedDate) : '',
      startTime: '',
      endTime: '',
    },
  });

  const selectedDate = watch('date');
  const startTime = watch('startTime');
  const endTime = watch('endTime');

  const checkAvailability = useCallback(async (date: string) => {
    setIsCheckingAvailability(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/bookings/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });

      const data = await response.json();

      if (response.ok) {
        setBookedSlots(data.bookedSlots || []);
      } else {
        setErrorMessage(data.error || 'Error al verificar disponibilidad');
      }
    } catch {
      setErrorMessage('Error de conexión. Por favor verifica tu conexión.');
    } finally {
      setIsCheckingAvailability(false);
    }
  }, []);

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      checkAvailability(selectedDate);
    } else {
      setBookedSlots([]);
      setValue('startTime', '');
      setValue('endTime', '');
    }
  }, [selectedDate, checkAvailability, setValue]);

  async function onSubmit(data: BookingFormSchema) {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
        // Redirect to confirmation page with booking details
        const params = new URLSearchParams({
          confirmationCode: result.confirmationCode,
          apartment: data.apartmentNumber,
          name: data.fullName,
          date: data.date,
          timeSlot: `${data.startTime}-${data.endTime}`,
        });
        router.push(`/confirmation?${params.toString()}`);
      } else {
        setErrorMessage(result.error || 'Error al crear la reserva');
      }
    } catch {
      setErrorMessage('Error de conexión. Por favor verifica tu conexión e intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {errorMessage && (
        <Alert type="error" title="Error de Reserva">
          {errorMessage}
        </Alert>
      )}

      <Input
        label="Número de Apartamento"
        placeholder="ej: 101, A-205"
        error={errors.apartmentNumber?.message}
        {...register('apartmentNumber')}
      />

      <Input
        label="Nombre Completo"
        placeholder="Tu nombre completo"
        error={errors.fullName?.message}
        {...register('fullName')}
      />

      <DatePicker
        value={selectedDate}
        onChange={(date) => setValue('date', date)}
        error={errors.date?.message}
      />

      {isCheckingAvailability && (
        <Alert type="info">Verificando disponibilidad...</Alert>
      )}

      <TimePicker
        selectedDate={selectedDate}
        selectedSlot={startTime && endTime ? `${startTime}-${endTime}` : ''}
        bookedSlots={bookedSlots}
        onSelectSlot={(slot) => {
          const [start, end] = slot.split('-');
          setValue('startTime', start);
          setValue('endTime', end);
        }}
        startTime={startTime}
        endTime={endTime}
        onCustomTimeChange={(start, end) => {
          setValue('startTime', start);
          setValue('endTime', end);
        }}
        error={errors.startTime?.message || errors.endTime?.message}
      />

      <Button
        type="submit"
        variant="primary"
        isLoading={isSubmitting}
        disabled={isSubmitting || isCheckingAvailability}
        className="w-full"
      >
        Reservar Turno de Carga
      </Button>
    </form>
  );
}
