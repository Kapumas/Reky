'use client';

import { useEffect, useState } from 'react';
import { CalendarPlus, CheckCircle, Download, Smartphone, X } from 'lucide-react';
import { downloadICalendarFile, type CalendarEventData } from '@/lib/utils/calendar';

interface AddToCalendarButtonProps {
  event: CalendarEventData;
  fileName: string;
  compact?: boolean;
}

export function AddToCalendarButton({ event, fileName, compact = false }: AddToCalendarButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!showConfirmation && !showTutorial) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowConfirmation(false);
        setShowTutorial(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showConfirmation, showTutorial]);

  function handleDownload() {
    downloadICalendarFile(event, fileName);
    setShowConfirmation(false);
    setShowTutorial(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirmation(true)}
        className={`${compact ? 'w-full px-3 py-2' : 'w-full px-4 py-3'} rounded-xl font-semibold transition-all flex items-center justify-center gap-2`}
        style={{
          backgroundColor: '#2F9E44',
          color: 'white',
          fontSize: compact ? '13px' : '15px',
          minHeight: compact ? '40px' : '48px',
          border: 'none',
        }}
        aria-label="Agregar reserva al calendario"
      >
        <CalendarPlus className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
        Agregar al calendario
      </button>

      {showConfirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowConfirmation(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 relative"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-confirmation-title"
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowConfirmation(false)}
              className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" style={{ color: '#6B7280' }} />
            </button>

            <div className="pr-8">
              <div className="p-3 rounded-xl inline-flex mb-4" style={{ backgroundColor: '#D1FAE5' }}>
                <CalendarPlus className="h-6 w-6" style={{ color: '#2F9E44' }} />
              </div>
              <h2 id="calendar-confirmation-title" className="font-semibold mb-2" style={{ fontSize: '20px', color: '#1F2933' }}>
                ¿Agregar al calendario?
              </h2>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                Se descargará un archivo con los datos de tu reserva para agregarlo a la aplicación de calendario de tu teléfono.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="flex-1 rounded-xl font-medium transition-all"
                style={{
                  backgroundColor: 'white',
                  color: '#1F2933',
                  fontSize: '14px',
                  minHeight: '44px',
                  border: '1px solid #E5E7EB',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: '#2F9E44',
                  color: 'white',
                  fontSize: '14px',
                  minHeight: '44px',
                  border: 'none',
                }}
              >
                <Download className="h-4 w-4" />
                Descargar
              </button>
            </div>
          </div>
        </div>
      )}

      {showTutorial && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowTutorial(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-tutorial-title"
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowTutorial(false)}
              className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" style={{ color: '#6B7280' }} />
            </button>

            <div className="pr-8">
              <div className="p-3 rounded-xl inline-flex mb-4" style={{ backgroundColor: '#D1FAE5' }}>
                <CheckCircle className="h-6 w-6" style={{ color: '#2F9E44' }} />
              </div>
              <h2 id="calendar-tutorial-title" className="font-semibold mb-2" style={{ fontSize: '20px', color: '#1F2933' }}>
                Archivo descargado
              </h2>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                Sigue estos pasos para agregar tu reserva al calendario del teléfono:
              </p>
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: '#F3F4F6' }}>
                  <Download className="h-5 w-5" style={{ color: '#6B7280' }} />
                </div>
                <div>
                  <p className="font-medium" style={{ fontSize: '14px', color: '#1F2933' }}>1. Abre el archivo</p>
                  <p className="mt-1" style={{ fontSize: '13px', color: '#6B7280' }}>
                    Toca la notificación de descarga o busca el archivo en la carpeta Descargas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: '#F3F4F6' }}>
                  <Smartphone className="h-5 w-5" style={{ color: '#6B7280' }} />
                </div>
                <div>
                  <p className="font-medium" style={{ fontSize: '14px', color: '#1F2933' }}>2. Elige tu calendario</p>
                  <p className="mt-1" style={{ fontSize: '13px', color: '#6B7280' }}>
                    Selecciona Apple Calendar, Google Calendar u otra aplicación compatible.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl" style={{ backgroundColor: '#F0FDF4', color: '#166534', fontSize: '13px' }}>
                <strong>En iPhone:</strong> toca el archivo y luego selecciona “Agregar todo” o “Agregar al calendario”.
                <br /><br />
                <strong>En Android:</strong> abre el archivo con Google Calendar y confirma la importación del evento.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTutorial(false)}
              className="w-full rounded-xl font-semibold transition-all mt-6"
              style={{
                backgroundColor: '#2F9E44',
                color: 'white',
                fontSize: '15px',
                minHeight: '48px',
                border: 'none',
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
