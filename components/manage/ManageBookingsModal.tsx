'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface ManageBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManageBookingsModal({ isOpen, onClose }: ManageBookingsModalProps) {
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate apartment format
      const apartmentRegex = /^\d+-\d+$/;
      if (!apartmentRegex.test(apartmentNumber)) {
        setError('Formato inválido. Use TORRE-APTO (ej: 2-101)');
        setIsLoading(false);
        return;
      }

      // Redirect to manage page with apartment number
      window.location.href = `/manage?apartment=${apartmentNumber}`;
    } catch (err) {
      setError('Error al buscar reservas');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" style={{ color: '#6B7280' }} />
        </button>

        <h2 className="text-2xl font-bold mb-2" style={{ color: '#1F2933' }}>
          Gestionar Reservas
        </h2>
        <p className="mb-6" style={{ color: '#6B7280', fontSize: '14px' }}>
          Ingresa tu número de apartamento para ver y gestionar tus reservas
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="apartmentNumber"
              className="block mb-2 font-medium"
              style={{ color: '#1F2933', fontSize: '14px' }}
            >
              Número de Apartamento
            </label>
            <input
              type="text"
              id="apartmentNumber"
              value={apartmentNumber}
              onChange={(e) => {
                let value = e.target.value;
                
                // Only allow numbers and hyphen
                value = value.replace(/[^0-9-]/g, '');
                
                // Auto-add hyphen after first digit
                if (value.length === 1 && /^\d$/.test(value)) {
                  value = value + '-';
                }
                
                // Prevent multiple hyphens
                const hyphenCount = (value.match(/-/g) || []).length;
                if (hyphenCount > 1) {
                  value = value.replace(/-/g, (match, offset) => offset === value.indexOf('-') ? '-' : '');
                }
                
                // Limit format to X-XXX (max 5 characters)
                if (value.length > 5) {
                  value = value.slice(0, 5);
                }
                
                setApartmentNumber(value);
              }}
              placeholder="Ej: 2-101"
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                borderColor: '#E5E7EB',
                fontSize: '16px',
              }}
              required
              disabled={isLoading}
            />
            <p className="mt-1 text-xs" style={{ color: '#6B7280' }}>
              Formato: TORRE-APTO
            </p>
          </div>

          {error && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              backgroundColor: '#2F9E44',
              color: 'white',
              fontSize: '16px',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Buscando...
              </>
            ) : (
              'Ver mis reservas'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
