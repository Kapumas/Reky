'use client';

import React from 'react';
import { X, Calendar, Clock, User, Home, Car } from 'lucide-react';
import { formatTimeSlotForDisplay, formatDateForDisplay } from '@/lib/utils/dateTime';

interface Booking {
  id: string;
  apartmentNumber: string;
  fullName: string;
  vehiclePlate: string;
  timeSlot: string;
  bookingDate: string;
  startTime: string;
  createdAt: string;
}

interface BookingDetailModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export function BookingDetailModal({ booking, onClose }: BookingDetailModalProps) {
  if (!booking) return null;

  const bookingDate = new Date(booking.startTime);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ border: '1px solid #E5E7EB' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold" style={{ fontSize: '18px', color: '#1F2933' }}>
            Detalle de la Reserva
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" style={{ color: '#6B7280' }} />
          </button>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 mt-0.5" style={{ color: '#6B7280' }} />
            <div>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>Fecha</p>
              <p className="font-medium" style={{ color: '#1F2933' }}>
                {formatDateForDisplay(bookingDate)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 mt-0.5" style={{ color: '#6B7280' }} />
            <div>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>Horario</p>
              <p className="font-medium" style={{ color: '#2F9E44', fontSize: '16px' }}>
                {formatTimeSlotForDisplay(booking.timeSlot)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="h-5 w-5 mt-0.5" style={{ color: '#6B7280' }} />
            <div>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>Nombre</p>
              <p className="font-medium" style={{ color: '#1F2933' }}>
                {booking.fullName}
              </p>
            </div>
          </div>

          {booking.vehiclePlate && booking.vehiclePlate.trim() !== '' && (
            <div className="flex items-start gap-3">
              <Car className="h-5 w-5 mt-0.5" style={{ color: '#6B7280' }} />
              <div>
                <p style={{ fontSize: '14px', color: '#6B7280' }}>Placa del Vehículo</p>
                <p className="font-medium" style={{ color: '#1F2933' }}>
                  {booking.vehiclePlate}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 mt-0.5" style={{ color: '#6B7280' }} />
            <div>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>Fecha de creación</p>
              <p className="font-medium" style={{ color: '#1F2933' }}>
                {new Date(booking.createdAt).toLocaleDateString('es-CO', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric'
                })} a las {new Date(booking.createdAt).toLocaleTimeString('es-CO', { 
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 rounded-xl font-semibold transition-all"
          style={{
            backgroundColor: '#2F9E44',
            color: 'white',
            fontSize: '15px',
            minHeight: '48px',
            border: 'none',
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
