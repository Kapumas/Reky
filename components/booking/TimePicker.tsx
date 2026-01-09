import React, { useState } from 'react';
import { TIME_SLOTS } from '@/lib/constants';
import { formatTimeSlotForDisplay, isTimeSlotPast } from '@/lib/utils/dateTime';

interface TimePickerProps {
  selectedDate: string;
  selectedSlot: string;
  bookedSlots: string[];
  onSelectSlot: (slot: string) => void;
  startTime?: string;
  endTime?: string;
  onCustomTimeChange?: (startTime: string, endTime: string) => void;
  error?: string;
}

export function TimePicker({
  selectedDate,
  selectedSlot,
  bookedSlots,
  onSelectSlot,
  startTime = '',
  endTime = '',
  onCustomTimeChange,
  error,
}: TimePickerProps) {
  const date = selectedDate ? new Date(selectedDate) : null;
  const [useCustomTime, setUseCustomTime] = useState(false);

  const handleCustomTimeToggle = () => {
    const newUseCustomTime = !useCustomTime;
    setUseCustomTime(newUseCustomTime);
    
    if (!newUseCustomTime) {
      // Clear custom times when switching back to predefined slots
      if (onCustomTimeChange) {
        onCustomTimeChange('', '');
      }
    } else {
      // Clear selected slot when switching to custom time
      onSelectSlot('');
    }
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCustomTimeChange) {
      onCustomTimeChange(e.target.value, endTime);
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCustomTimeChange) {
      onCustomTimeChange(startTime, e.target.value);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-greige-700 dark:text-greige-300 mb-3">
        Selecciona el Horario
      </label>

      {!selectedDate ? (
        <p className="text-sm text-greige-500 dark:text-greige-400 italic">
          Por favor selecciona primero una fecha
        </p>
      ) : (
        <>
          {/* Toggle between predefined slots and custom time */}
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleCustomTimeToggle}
              className={`
                px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium
                ${
                  !useCustomTime
                    ? 'border-sage bg-sage bg-opacity-10 text-sage'
                    : 'border-greige-300 bg-white text-greige-700 hover:border-sage'
                }
              `}
            >
              Bloques de 2 horas
            </button>
            <button
              type="button"
              onClick={handleCustomTimeToggle}
              className={`
                px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium
                ${
                  useCustomTime
                    ? 'border-sage bg-sage bg-opacity-10 text-sage'
                    : 'border-greige-300 bg-white text-greige-700 hover:border-sage'
                }
              `}
            >
              Horario Personalizado
            </button>
          </div>

          {/* Predefined time slots */}
          {!useCustomTime && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TIME_SLOTS.map((slot) => {
                const isBooked = bookedSlots.includes(slot);
                const isPast = date ? isTimeSlotPast(date, slot) : false;
                const isDisabled = isBooked || isPast;
                const isSelected = selectedSlot === slot;

                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => !isDisabled && onSelectSlot(slot)}
                    disabled={isDisabled}
                    className={`
                      min-h-[56px] p-4 rounded-lg border-2 transition-all duration-200
                      ${
                        isSelected
                          ? 'border-sage bg-sage bg-opacity-10 dark:bg-opacity-20 ring-2 ring-sage'
                          : 'border-greige-300 dark:border-greige-600 bg-white dark:bg-greige-700 hover:border-sage'
                      }
                      ${
                        isDisabled
                          ? 'opacity-50 cursor-not-allowed bg-greige-100 dark:bg-greige-800'
                          : 'cursor-pointer'
                      }
                    `}
                  >
                    <div className="text-center">
                      <div className={`font-semibold ${isSelected ? 'text-sage' : 'text-greige-900 dark:text-greige-100'}`}>
                        {formatTimeSlotForDisplay(slot)}
                      </div>
                      {isBooked && (
                        <div className="text-xs text-terracotta mt-1">Reservado</div>
                      )}
                      {isPast && !isBooked && (
                        <div className="text-xs text-greige-500 dark:text-greige-400 mt-1">Pasado</div>
                      )}
                      {isSelected && !isDisabled && (
                        <div className="text-xs text-sage mt-1">Seleccionado</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom time selection */}
          {useCustomTime && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-greige-700 dark:text-greige-300 mb-2">
                    Hora de Inicio
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={handleStartTimeChange}
                    min="06:00"
                    max="22:00"
                    className="w-full px-4 py-3 rounded-lg border-2 border-greige-300 focus:border-sage focus:ring-2 focus:ring-sage focus:ring-opacity-20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-greige-700 dark:text-greige-300 mb-2">
                    Hora Final
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={handleEndTimeChange}
                    min="06:00"
                    max="22:00"
                    className="w-full px-4 py-3 rounded-lg border-2 border-greige-300 focus:border-sage focus:ring-2 focus:ring-sage focus:ring-opacity-20 transition-all"
                  />
                </div>
              </div>
              <p className="text-xs text-greige-600 dark:text-greige-400">
                El horario debe estar entre 6:00 AM y 10:00 PM
              </p>
            </div>
          )}
        </>
      )}

      {error && (
        <p className="mt-2 text-sm text-terracotta" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
