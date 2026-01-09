import React from 'react';
import { getTodayString, getMaxDateString } from '@/lib/utils/dateTime';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  error?: string;
}

export function DatePicker({ value, onChange, error }: DatePickerProps) {
  const today = getTodayString();
  const maxDate = getMaxDateString();

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-greige-700 dark:text-greige-300 mb-2">
        Selecciona la Fecha
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={today}
        max={maxDate}
        className={`
          w-full min-h-[44px] px-4 py-3 border rounded-lg
          transition-colors duration-200 text-greige-900 dark:text-greige-100
          focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
          ${
            error
              ? 'border-terracotta bg-red-50 dark:bg-red-900/20 focus:ring-terracotta'
              : 'border-greige-300 dark:border-greige-600 bg-white dark:bg-greige-700 hover:border-greige-400 dark:hover:border-greige-500'
          }
        `}
      />
      {error && (
        <p className="mt-1 text-sm text-terracotta" role="alert">
          {error}
        </p>
      )}
      <p className="mt-2 text-xs text-greige-500 dark:text-greige-400">
        Puedes reservar hasta 30 días por adelantado
      </p>
    </div>
  );
}
