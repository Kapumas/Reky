'use client';

import React from 'react';
import { X } from 'lucide-react';
import { SimplifiedBookingForm } from './SimplifiedBookingForm';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
}

export function BookingModal({ isOpen, onClose, selectedDate }: BookingModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ 
          maxHeight: '90vh',
          border: '1px solid #E5E7EB'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #E5E7EB' }}>
          <h2 className="font-semibold" style={{ fontSize: '20px', color: '#1F2933' }}>
            Agendar carga
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100"
            aria-label="Cerrar"
            style={{ color: '#6B7280' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <SimplifiedBookingForm preSelectedDate={selectedDate} onSuccess={onClose} />
        </div>
      </div>
    </div>
  );
}
