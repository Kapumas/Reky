'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DayBookingsGroup } from '@/components/manage/DayBookingsGroup';
import { Search, Loader2, ArrowLeft } from 'lucide-react';
import { groupBookingsByDate, type Booking } from '@/lib/utils/bookingHelpers';

export const dynamic = 'force-dynamic';

function ManagePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const apartmentFromUrl = searchParams.get('apartment');
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [apartmentNumber, setApartmentNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCancelled, setShowCancelled] = useState(false);

  useEffect(() => {
    if (apartmentFromUrl) {
      fetchBookings(apartmentFromUrl);
    }
  }, [apartmentFromUrl]);

  async function fetchBookings(apartment: string) {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/bookings/apartment/${apartment}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setError('No se encontraron reservas para este apartamento');
          setBookings([]);
        } else {
          throw new Error(data.error || 'Error al cargar reservas');
        }
      } else {
        setBookings(data.bookings);
        setApartmentNumber(apartment);
      }
    } catch (err) {
      setError('Error al cargar las reservas. Intenta nuevamente.');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleBookingCancelled(bookingId: string) {
    setShowCancelled(true);
    setBookings(prevBookings =>
      prevBookings.map(b =>
        b.id === bookingId ? { ...b, status: 'cancelled' } : b
      )
    );
    setTimeout(() => setShowCancelled(false), 3000);
  }

  function handleBookingUpdated() {
    // Refresh bookings after edit
    if (apartmentNumber) {
      fetchBookings(apartmentNumber);
    }
  }

  function handleBack() {
    router.push('/');
  }

  // Group bookings by date
  const groupedBookings = useMemo(() => groupBookingsByDate(bookings), [bookings]);
  
  // Separate active and cancelled groups
  const activeGroups = groupedBookings.filter(g => g.activeCount > 0);
  const cancelledGroups = groupedBookings.filter(g => g.activeCount === 0 && g.cancelledCount > 0);
  
  const totalActive = bookings.filter(b => b.status === 'active').length;
  const totalCancelled = bookings.filter(b => b.status === 'cancelled').length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F6F8F7' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
            style={{ color: '#2F9E44', fontSize: '14px' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl" style={{ backgroundColor: '#B7E4C7' }}>
              <Search className="h-10 w-10" style={{ color: '#2F9E44' }} />
            </div>
          </div>
          <h1 className="font-semibold mb-2" style={{ fontSize: '22px', color: '#1F2933' }}>
            Gestiona tus Reservas
          </h1>
          <p className="max-w-lg mx-auto" style={{ fontSize: '14px', color: '#6B7280' }}>
            {apartmentNumber ? `Reservas del apartamento ${apartmentNumber}` : 'Cargando reservas...'}
          </p>
        </div>

        {showCancelled && (
          <div 
            className="p-4 rounded-xl mb-6" 
            style={{ backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '14px' }}
          >
            <strong>Reserva Cancelada:</strong> Tu reserva ha sido cancelada exitosamente.
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1px solid #E5E7EB' }}>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: '#2F9E44' }} />
            <p style={{ color: '#6B7280', fontSize: '14px' }}>Cargando reservas...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E5E7EB' }}>
            <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '14px' }}>
              {error}
            </div>
            <button
              onClick={handleBack}
              className="w-full py-3 rounded-lg font-semibold"
              style={{ backgroundColor: '#2F9E44', color: 'white', fontSize: '16px' }}
            >
              Volver al inicio
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center" style={{ border: '1px solid #E5E7EB' }}>
            <p className="mb-4" style={{ color: '#6B7280', fontSize: '14px' }}>
              No se encontraron reservas para este apartamento
            </p>
            <button
              onClick={handleBack}
              className="py-3 px-6 rounded-lg font-semibold"
              style={{ backgroundColor: '#2F9E44', color: 'white', fontSize: '16px' }}
            >
              Volver al inicio
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Apartment Info */}
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #E5E7EB' }}>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>Apartamento</p>
              <p className="font-semibold mb-2" style={{ fontSize: '18px', color: '#1F2933' }}>
                {apartmentNumber}
              </p>
              <div className="flex gap-4 text-sm">
                {totalActive > 0 && (
                  <span style={{ color: '#2F9E44', fontWeight: '500' }}>
                    {totalActive} activa{totalActive > 1 ? 's' : ''}
                  </span>
                )}
                {totalCancelled > 0 && (
                  <span style={{ color: '#6B7280' }}>
                    {totalCancelled} cancelada{totalCancelled > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Active Bookings by Day */}
            {activeGroups.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-semibold px-1" style={{ fontSize: '16px', color: '#1F2933' }}>
                  Reservas Activas
                </h2>
                {activeGroups.map((group) => (
                  <DayBookingsGroup
                    key={group.dateString}
                    group={group}
                    onCancelBooking={handleBookingCancelled}
                    onEditBooking={handleBookingUpdated}
                  />
                ))}
              </div>
            )}

            {/* Cancelled Bookings by Day */}
            {cancelledGroups.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-semibold px-1" style={{ fontSize: '16px', color: '#6B7280' }}>
                  Historial de Cancelaciones
                </h2>
                {cancelledGroups.map((group) => (
                  <DayBookingsGroup
                    key={group.dateString}
                    group={group}
                    onCancelBooking={handleBookingCancelled}
                  />
                ))}
              </div>
            )}

            <button
              onClick={handleBack}
              className="w-full text-center underline py-2"
              style={{ fontSize: '14px', color: '#2F9E44' }}
            >
              Buscar otro apartamento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ManagePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen" style={{ backgroundColor: '#F6F8F7' }}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1px solid #E5E7EB' }}>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: '#2F9E44' }} />
            <p style={{ color: '#6B7280', fontSize: '14px' }}>Cargando...</p>
          </div>
        </div>
      </div>
    }>
      <ManagePageContent />
    </Suspense>
  );
}
