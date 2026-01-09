import { CalendarView } from '@/components/calendar/CalendarView';

interface CalendarSectionProps {
  onDateClick: (date: Date) => void;
  onNewBooking: () => void;
}

export function CalendarSection({ onDateClick, onNewBooking }: CalendarSectionProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-greige-900 mb-3">
          Calendario de Reservas
        </h2>
        <p className="text-greige-600">
          Selecciona una fecha para ver disponibilidad o hacer una nueva reserva
        </p>
      </div>

      <CalendarView onDateClick={onDateClick} onNewBooking={onNewBooking} />
    </div>
  );
}
