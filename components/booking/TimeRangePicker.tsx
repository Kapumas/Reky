import React from 'react';
import { Clock } from 'lucide-react';

interface TimeRangePickerProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  startTimeError?: string;
  endTimeError?: string;
}

export function TimeRangePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  startTimeError,
  endTimeError,
}: TimeRangePickerProps) {
  // Generate time options from 6:00 to 22:00 in 30-minute intervals
  const generateTimeOptions = () => {
    const times: string[] = [];
    for (let hour = 6; hour <= 22; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 22) {
        times.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className="w-full space-y-4">
      <label className="block text-sm font-medium text-greige-700 mb-3">
        Horario de Reserva
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Start Time */}
        <div>
          <label className="block text-sm font-medium text-greige-600 mb-2">
            Hora de Inicio
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-greige-400 pointer-events-none" />
            <select
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className={`
                w-full min-h-[44px] pl-10 pr-4 py-3 border rounded-lg
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
                appearance-none cursor-pointer
                ${
                  startTimeError
                    ? 'border-terracotta bg-red-50 focus:ring-terracotta'
                    : 'border-greige-300 bg-white hover:border-greige-400'
                }
              `}
            >
              <option value="">Seleccionar hora</option>
              {timeOptions.map((time) => (
                <option key={`start-${time}`} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          {startTimeError && (
            <p className="mt-1 text-sm text-terracotta" role="alert">
              {startTimeError}
            </p>
          )}
        </div>

        {/* End Time */}
        <div>
          <label className="block text-sm font-medium text-greige-600 mb-2">
            Hora de Fin
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-greige-400 pointer-events-none" />
            <select
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className={`
                w-full min-h-[44px] pl-10 pr-4 py-3 border rounded-lg
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
                appearance-none cursor-pointer
                ${
                  endTimeError
                    ? 'border-terracotta bg-red-50 focus:ring-terracotta'
                    : 'border-greige-300 bg-white hover:border-greige-400'
                }
              `}
            >
              <option value="">Seleccionar hora</option>
              {timeOptions.map((time) => (
                <option key={`end-${time}`} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          {endTimeError && (
            <p className="mt-1 text-sm text-terracotta" role="alert">
              {endTimeError}
            </p>
          )}
        </div>
      </div>

      <div className="bg-sage bg-opacity-10 border border-sage border-opacity-30 rounded-lg p-3">
        <p className="text-xs text-greige-700">
          <strong>Horario disponible:</strong> 6:00 AM - 10:00 PM
        </p>
        <p className="text-xs text-greige-600 mt-1">
          Puedes reservar por el tiempo que necesites dentro del horario disponible
        </p>
      </div>
    </div>
  );
}
