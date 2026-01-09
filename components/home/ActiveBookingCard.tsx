'use client';

import React, { useEffect, useState } from 'react';
import { Zap, Clock, User, Car } from 'lucide-react';
import { formatTimeSlotForDisplay } from '@/lib/utils/dateTime';

interface ActiveBookingData {
  id: string;
  confirmationCode: string;
  apartmentNumber: string;
  fullName: string;
  vehiclePlate: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  status: string;
}

export function ActiveBookingCard() {
  const [activeBooking, setActiveBooking] = useState<ActiveBookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    fetchActiveBooking();
    const interval = setInterval(fetchActiveBooking, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeBooking) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const endTime = new Date(activeBooking.endTime);
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Finalizada');
        fetchActiveBooking();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m restantes`);
      } else {
        setTimeRemaining(`${minutes}m restantes`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, [activeBooking]);

  async function fetchActiveBooking() {
    try {
      const response = await fetch('/api/bookings/active');
      const data = await response.json();

      if (response.ok && data.booking) {
        setActiveBooking(data.booking);
      } else {
        setActiveBooking(null);
      }
    } catch (error) {
      console.error('Error fetching active booking:', error);
      setActiveBooking(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !activeBooking) {
    return null;
  }

  return (
    <div 
      className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 mb-6 border-2"
      style={{ borderColor: '#2F9E44' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: '#2F9E44' }}
          >
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold" style={{ fontSize: '16px', color: '#1F2933' }}>
              Carga en progreso
            </h3>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              {timeRemaining}
            </p>
          </div>
        </div>
        <div 
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: '#2F9E44' }}
        >
          <span className="text-xs font-semibold text-white">
            ACTIVA
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" style={{ color: '#2F9E44' }} />
          <span className="font-medium" style={{ fontSize: '14px', color: '#1F2933' }}>
            {formatTimeSlotForDisplay(activeBooking.timeSlot)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <User className="h-4 w-4" style={{ color: '#2F9E44' }} />
          <span style={{ fontSize: '14px', color: '#1F2933' }}>
            {activeBooking.fullName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Car className="h-4 w-4" style={{ color: '#2F9E44' }} />
          <span style={{ fontSize: '14px', color: '#1F2933' }}>
            Placa: {activeBooking.vehiclePlate || 'No especificada'}
          </span>
        </div>
      </div>
    </div>
  );
}
