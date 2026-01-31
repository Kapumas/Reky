'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SimplifiedBookingForm } from '@/components/booking/SimplifiedBookingForm';
import { Suspense } from 'react';

function BookingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  
  const preSelectedDate = dateParam ? new Date(dateParam) : undefined;

  const handleSuccess = () => {
    // The form will redirect to confirmation page
    // No need to do anything here
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F6F8F7' }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-white"
            style={{ color: '#1F2933' }}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Volver</span>
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 mb-6" style={{ border: '1px solid #E5E7EB' }}>
          <h1 className="font-semibold mb-6" style={{ fontSize: '24px', color: '#1F2933' }}>
            Agendar carga
          </h1>
          
          <SimplifiedBookingForm 
            preSelectedDate={preSelectedDate} 
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F6F8F7' }}>
        <p style={{ color: '#6B7280' }}>Cargando...</p>
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  );
}
