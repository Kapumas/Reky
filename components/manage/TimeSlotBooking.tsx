'use client';

import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, Edit2 } from 'lucide-react';
import { formatTimeSlotForDisplay } from '@/lib/utils/dateTime';
import type { Booking } from '@/lib/utils/bookingHelpers';
import { EditBookingModal } from './EditBookingModal';

interface TimeSlotBookingProps {
  booking: Booking;
  onCancel: () => void;
  onEdit?: () => void;
}

export function TimeSlotBooking({ booking, onCancel, onEdit }: TimeSlotBookingProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isActive = booking.status === 'active';

  function handleEditSuccess() {
    setShowEditModal(false);
    if (onEdit) {
      onEdit();
    }
  }

  async function handleCancel() {
    setIsCancelling(true);
    setErrorMessage('');

    try {
      const response = await fetch(
        `/api/bookings/${booking.confirmationCode}/cancel`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (response.ok) {
        onCancel();
      } else {
        setErrorMessage(data.error || 'Error al cancelar la reserva');
      }
    } catch {
      setErrorMessage('Error de conexión. Por favor intenta nuevamente.');
    } finally {
      setIsCancelling(false);
      setShowCancelConfirm(false);
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        {/* Left side: Icon and Time info */}
        <div className="flex items-start gap-3 flex-1">
          <div 
            className="p-2 rounded-lg flex-shrink-0"
            style={{ backgroundColor: isActive ? '#D1FAE5' : '#FEE2E2' }}
          >
            <Clock className="h-5 w-5" style={{ color: isActive ? '#2F9E44' : '#DC2626' }} />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Time range in horizontal row */}
            <div className="flex items-center gap-2 mb-2">
              <p className="font-semibold" style={{ fontSize: '15px', color: '#1F2933' }}>
                {formatTimeSlotForDisplay(booking.timeSlot)}
              </p>
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: isActive ? '#D1FAE5' : '#FEE2E2',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: isActive ? '#065F46' : '#991B1B'
                }}
              >
                {isActive ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Activa
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    Cancelada
                  </>
                )}
              </div>
            </div>
            
            {/* Name and vehicle plate (last digits only) */}
            <p style={{ fontSize: '13px', color: '#6B7280' }}>
              {booking.fullName}
              {booking.vehiclePlate && booking.vehiclePlate.trim() !== '' && (
                <span style={{ marginLeft: '8px' }}>
                  - Placa {booking.vehiclePlate}
                </span>
              )}
            </p>
            
            {/* Created date */}
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
              Creada: {new Date(booking.createdAt).toLocaleDateString('es-CO', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Right side: Action Buttons stacked vertically */}
        {isActive && !showCancelConfirm && (
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#DBEAFE',
                color: '#1E40AF',
                fontSize: '13px',
                border: '1px solid #93C5FD',
                minWidth: '100px',
              }}
            >
              <Edit2 className="h-3.5 w-3.5" />
              Editar
            </button>
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                fontSize: '13px',
                border: '1px solid #FCA5A5',
                minWidth: '100px',
              }}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div 
          className="mt-3 p-3 rounded-lg" 
          style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '13px' }}
        >
          {errorMessage}
        </div>
      )}

      {/* Cancel Confirmation */}
      {isActive && showCancelConfirm && (
        <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}>
          <p className="font-medium mb-2" style={{ fontSize: '13px', color: '#92400E' }}>
            ¿Cancelar esta reserva?
          </p>
          <p className="mb-3" style={{ fontSize: '12px', color: '#92400E' }}>
            El horario quedará disponible para otros residentes.
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setShowCancelConfirm(false)}
              disabled={isCancelling}
              className="flex-1 rounded-lg font-medium transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'white',
                color: '#1F2933',
                fontSize: '13px',
                minHeight: '36px',
                border: '1px solid #E5E7EB',
              }}
            >
              No
            </button>
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="flex-1 rounded-lg font-medium transition-all disabled:opacity-50"
              style={{
                backgroundColor: '#DC2626',
                color: 'white',
                fontSize: '13px',
                minHeight: '36px',
                border: 'none',
              }}
            >
              {isCancelling ? 'Cancelando...' : 'Sí, Cancelar'}
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <EditBookingModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        booking={booking}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
