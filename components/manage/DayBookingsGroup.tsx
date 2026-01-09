'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { TimeSlotBooking } from './TimeSlotBooking';
import { formatDateHeader, type GroupedBookings } from '@/lib/utils/bookingHelpers';

interface DayBookingsGroupProps {
  group: GroupedBookings;
  onCancelBooking: (bookingId: string) => void;
  onEditBooking?: () => void;
}

export function DayBookingsGroup({ group, onCancelBooking, onEditBooking }: DayBookingsGroupProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
      {/* Date Header */}
      <div 
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" style={{ color: '#2F9E44' }} />
          <div>
            <h3 className="font-semibold" style={{ fontSize: '16px', color: '#1F2933' }}>
              {formatDateHeader(group.date)}
            </h3>
            <p style={{ fontSize: '12px', color: '#6B7280' }}>
              {group.activeCount > 0 && `${group.activeCount} activa${group.activeCount > 1 ? 's' : ''}`}
              {group.activeCount > 0 && group.cancelledCount > 0 && ' • '}
              {group.cancelledCount > 0 && `${group.cancelledCount} cancelada${group.cancelledCount > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* Time Slots */}
      <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
        {group.bookings.map((booking) => (
          <TimeSlotBooking
            key={booking.id}
            booking={booking}
            onCancel={() => onCancelBooking(booking.id)}
            onEdit={onEditBooking}
          />
        ))}
      </div>
    </div>
  );
}
