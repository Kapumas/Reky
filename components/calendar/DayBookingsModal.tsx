'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Calendar, Clock, Plus } from 'lucide-react';
import { formatDateForInput, formatDateWithDayName, formatTimeSlotForDisplay } from '@/lib/utils/dateTime';

interface Booking {
  id: string;
  apartmentNumber: string;
  fullName: string;
  vehiclePlate: string;
  timeSlot: string;
  status: string;
}

interface DayBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
}

export function DayBookingsModal({ isOpen, onClose, selectedDate }: DayBookingsModalProps) {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDayBookings = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = formatDateForInput(selectedDate);
      const response = await fetch(`/api/bookings/day/${dateStr}`);
      const data = await response.json();

      if (response.ok) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching day bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (isOpen && selectedDate) {
      fetchDayBookings();
    }
  }, [isOpen, selectedDate, fetchDayBookings]);

  if (!isOpen) return null;

  const activeBookings = bookings.filter(b => b.status === 'active');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ 
          maxHeight: '85vh',
          border: '1px solid #E5E7EB'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #E5E7EB' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#B7E4C7' }}>
              <Calendar className="h-5 w-5" style={{ color: '#2F9E44' }} />
            </div>
            <div>
              <h2 className="font-semibold" style={{ fontSize: '18px', color: '#1F2933' }}>
                {formatDateWithDayName(selectedDate)}
              </h2>
              <p style={{ fontSize: '13px', color: '#6B7280' }}>
                {activeBookings.length} {activeBookings.length === 1 ? 'reserva' : 'reservas'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100"
            aria-label="Cerrar"
            style={{ color: '#6B7280' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          {loading ? (
            <div className="text-center py-8" style={{ color: '#6B7280', fontSize: '14px' }}>
              Cargando reservas...
            </div>
          ) : activeBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <Clock className="h-12 w-12 mx-auto" style={{ color: '#D1D5DB' }} />
              </div>
              <p className="font-medium mb-2" style={{ fontSize: '16px', color: '#1F2933' }}>
                No hay reservas
              </p>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                Este día está completamente disponible
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeBookings
                .sort((a, b) => {
                  const timeA = a.timeSlot.split('-')[0];
                  const timeB = b.timeSlot.split('-')[0];
                  return timeA.localeCompare(timeB);
                })
                .map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div 
                          className="mt-1 p-2 rounded-lg"
                          style={{ backgroundColor: '#FEE2E2' }}
                        >
                          <Clock className="h-5 w-5" style={{ color: '#DC2626' }} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold mb-1" style={{ fontSize: '15px', color: '#1F2933' }}>
                            {formatTimeSlotForDisplay(booking.timeSlot)}
                          </p>
                          <p style={{ fontSize: '13px', color: '#6B7280' }}>
                            {booking.fullName}
                          </p>
                          <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
                            🚗 {booking.vehiclePlate}
                          </p>
                        </div>
                      </div>
                      <div
                        className="px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: '#FEE2E2',
                          fontSize: '11px',
                          fontWeight: '500',
                          color: '#991B1B'
                        }}
                      >
                        Ocupado
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white px-6 py-4" style={{ borderTop: '1px solid #E5E7EB' }}>
          <button
            onClick={() => {
              const dateStr = selectedDate.toISOString().split('T')[0];
              router.push(`/book?date=${dateStr}`);
            }}
            className="w-full rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: '#2F9E44',
              color: 'white',
              fontSize: '15px',
              minHeight: '48px',
              border: 'none',
            }}
          >
            <Plus className="h-5 w-5" />
            Agendar en este día
          </button>
        </div>
      </div>
    </div>
  );
}
