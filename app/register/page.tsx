'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type VehicleTypeValue = '' | 'BEV' | 'PHEV';
type DailyDistanceValue = '' | '0_20' | '20_40' | '40_60' | '60_100' | '100_plus';
type ChargingFrequencyValue = '' | 'daily' | 'every_2_days' | 'two_to_three_times_week' | 'once_week';
type ChargingTime220vValue = '' | '1_2' | '2_4' | '4_6' | '6_plus';
type ChargingTime110vValue = '' | '2_4' | '4_6' | '6_8' | '8_plus';
type PreferredTimeValue = '' | 'day' | 'night' | 'no_preference';

interface RegistrationFormData {
  fullName: string;
  vehicleType: VehicleTypeValue;
  vehicleBrandModel: string;
  batteryCapacityKwh: string;
  estimatedRangeKm: string;
  dailyAverageDrivingDistance: DailyDistanceValue;
  chargingFrequency: ChargingFrequencyValue;
  chargingTime220v: ChargingTime220vValue;
  chargingTime110v: ChargingTime110vValue;
  preferredChargingTime: PreferredTimeValue;
  agreedToFairUsage: boolean;
}

const initialFormData: RegistrationFormData = {
  fullName: '',
  vehicleType: '',
  vehicleBrandModel: '',
  batteryCapacityKwh: '',
  estimatedRangeKm: '',
  dailyAverageDrivingDistance: '',
  chargingFrequency: '',
  chargingTime220v: '',
  chargingTime110v: '',
  preferredChargingTime: '',
  agreedToFairUsage: false,
};

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegistrationFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  function updateField<K extends keyof RegistrationFormData>(
    field: K,
    value: RegistrationFormData[K]
  ) {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        fullName: formData.fullName,
        vehicleType: formData.vehicleType,
        vehicleBrandModel: formData.vehicleBrandModel,
        batteryCapacityKwh: formData.batteryCapacityKwh
          ? Number(formData.batteryCapacityKwh)
          : undefined,
        estimatedRangeKm: formData.estimatedRangeKm
          ? Number(formData.estimatedRangeKm)
          : undefined,
        dailyAverageDrivingDistance: formData.dailyAverageDrivingDistance,
        chargingFrequency: formData.chargingFrequency,
        chargingTime220v: formData.chargingTime220v,
        chargingTime110v: formData.chargingTime110v,
        preferredChargingTime: formData.preferredChargingTime || undefined,
        agreedToFairUsage: formData.agreedToFairUsage,
      };

      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar el registro');
      }

      setFormData(initialFormData);
      setSuccessMessage('Registro enviado exitosamente. Gracias por completar la información.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al guardar el registro. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F6F8F7' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid #E5E7EB' }}>
          <h1 className="font-semibold mb-2 text-center" style={{ fontSize: '22px', color: '#1F2933' }}>
            Registro de usuario
          </h1>
          <p className="text-center mb-8" style={{ fontSize: '14px', color: '#6B7280' }}>
            Completa tu perfil de uso de carga eléctrica
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {successMessage && (
              <div
                className="p-4 rounded-xl"
                style={{ backgroundColor: '#DCFCE7', color: '#166534', fontSize: '14px' }}
              >
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div
                className="p-4 rounded-xl"
                style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '14px' }}
              >
                {errorMessage}
              </div>
            )}

            <div>
              <label 
                className="block mb-2 font-medium" 
                style={{ fontSize: '14px', color: '#1F2933' }}
              >
                Nombre completo
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                placeholder="Tu nombre completo"
                required
                className="w-full px-4 py-3 rounded-xl transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  minHeight: '44px',
                  backgroundColor: 'white',
                  color: '#1F2933'
                }}
              />
            </div>

            <div>
              <label
                className="block mb-2 font-medium" 
                style={{ fontSize: '14px', color: '#1F2933' }}
              >
                Tipo de vehículo
              </label>
              <select
                value={formData.vehicleType}
                onChange={(e) => updateField('vehicleType', e.target.value as VehicleTypeValue)}
                required
                className="w-full px-4 py-3 rounded-xl transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  minHeight: '44px',
                  backgroundColor: 'white',
                  color: '#1F2933'
                }}
              >
                <option value="">Selecciona una opción</option>
                <option value="BEV">BEV (100% Eléctrico)</option>
                <option value="PHEV">PHEV (Híbrido enchufable)</option>
              </select>
            </div>

            <div>
              <label 
                className="block mb-2 font-medium" 
                style={{ fontSize: '14px', color: '#1F2933' }}
              >
                Marca y modelo del vehículo
              </label>
              <input
                type="text"
                value={formData.vehicleBrandModel}
                onChange={(e) => updateField('vehicleBrandModel', e.target.value)}
                placeholder="Ej: BYD Dolphin, Kia Niro PHEV"
                required
                className="w-full px-4 py-3 rounded-xl transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  minHeight: '44px',
                  backgroundColor: 'white',
                  color: '#1F2933'
                }}
              />
            </div>

            <div>
              <label
                className="block mb-2 font-medium" 
                style={{ fontSize: '14px', color: '#1F2933' }}
              >
                Capacidad de batería (kWh) - Opcional
              </label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                value={formData.batteryCapacityKwh}
                onChange={(e) => updateField('batteryCapacityKwh', e.target.value)}
                placeholder="Ej: 62"
                className="w-full px-4 py-3 rounded-xl transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  minHeight: '44px',
                  backgroundColor: 'white',
                  color: '#1F2933'
                }}
              />
            </div>

            <div>
              <label
                className="block mb-2 font-medium"
                style={{ fontSize: '14px', color: '#1F2933' }}
              >
                Autonomía estimada (km) - Opcional
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={formData.estimatedRangeKm}
                onChange={(e) => updateField('estimatedRangeKm', e.target.value)}
                placeholder="Ej: 380"
                className="w-full px-4 py-3 rounded-xl transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  minHeight: '44px',
                  backgroundColor: 'white',
                  color: '#1F2933'
                }}
              />
            </div>

            <div>
              <label
                className="block mb-2 font-medium"
                style={{ fontSize: '14px', color: '#1F2933' }}
              >
                Distancia promedio diaria de conducción
              </label>
              <select
                value={formData.dailyAverageDrivingDistance}
                onChange={(e) => updateField('dailyAverageDrivingDistance', e.target.value as DailyDistanceValue)}
                required
                className="w-full px-4 py-3 rounded-xl transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  minHeight: '44px',
                  backgroundColor: 'white',
                  color: '#1F2933'
                }}
              >
                <option value="">Selecciona una opción</option>
                <option value="0_20">0-20 km</option>
                <option value="20_40">20-40 km</option>
                <option value="40_60">40-60 km</option>
                <option value="60_100">60-100 km</option>
                <option value="100_plus">100+ km</option>
              </select>
            </div>

            <div>
              <label
                className="block mb-2 font-medium"
                style={{ fontSize: '14px', color: '#1F2933' }}
              >
                Frecuencia de carga
              </label>
              <select
                value={formData.chargingFrequency}
                onChange={(e) => updateField('chargingFrequency', e.target.value as ChargingFrequencyValue)}
                required
                className="w-full px-4 py-3 rounded-xl transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  minHeight: '44px',
                  backgroundColor: 'white',
                  color: '#1F2933'
                }}
              >
                <option value="">Selecciona una opción</option>
                <option value="daily">Diaria</option>
                <option value="every_2_days">Cada 2 días</option>
                <option value="two_to_three_times_week">2-3 veces por semana</option>
                <option value="once_week">Una vez por semana</option>
              </select>
            </div>

            <div>
              <label
                className="block mb-2 font-medium"
                style={{ fontSize: '14px', color: '#1F2933' }}
              >
                Tiempo típico de carga en 220V
              </label>
              <select
                value={formData.chargingTime220v}
                onChange={(e) => updateField('chargingTime220v', e.target.value as ChargingTime220vValue)}
                required
                className="w-full px-4 py-3 rounded-xl transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  minHeight: '44px',
                  backgroundColor: 'white',
                  color: '#1F2933'
                }}
              >
                <option value="">Selecciona una opción</option>
                <option value="1_2">1-2 horas</option>
                <option value="2_4">2-4 horas</option>
                <option value="4_6">4-6 horas</option>
                <option value="6_plus">6+ horas</option>
              </select>
            </div>

            <div>
              <label
                className="block mb-2 font-medium"
                style={{ fontSize: '14px', color: '#1F2933' }}
              >
                Tiempo típico de carga en 110V
              </label>
              <select
                value={formData.chargingTime110v}
                onChange={(e) => updateField('chargingTime110v', e.target.value as ChargingTime110vValue)}
                required
                className="w-full px-4 py-3 rounded-xl transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  minHeight: '44px',
                  backgroundColor: 'white',
                  color: '#1F2933'
                }}
              >
                <option value="">Selecciona una opción</option>
                <option value="2_4">2-4 horas</option>
                <option value="4_6">4-6 horas</option>
                <option value="6_8">6-8 horas</option>
                <option value="8_plus">8+ horas</option>
              </select>
            </div>

            <div>
              <label
                className="block mb-2 font-medium"
                style={{ fontSize: '14px', color: '#1F2933' }}
              >
                Horario preferido para cargar (opcional)
              </label>
              <select
                value={formData.preferredChargingTime}
                onChange={(e) => updateField('preferredChargingTime', e.target.value as PreferredTimeValue)}
                className="w-full px-4 py-3 rounded-xl transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  minHeight: '44px',
                  backgroundColor: 'white',
                  color: '#1F2933'
                }}
              >
                <option value="">Sin seleccionar</option>
                <option value="day">Día</option>
                <option value="night">Noche</option>
                <option value="no_preference">Sin preferencia</option>
              </select>
            </div>

            <div className="flex items-start gap-3">
              <input
                id="fair-usage-agreement"
                type="checkbox"
                checked={formData.agreedToFairUsage}
                onChange={(e) => updateField('agreedToFairUsage', e.target.checked)}
                required
                className="mt-1"
              />
              <label
                htmlFor="fair-usage-agreement"
                className="font-medium"
                style={{ fontSize: '14px', color: '#1F2933' }}
              >
                Acepto las reglas de uso justo para asegurar acceso equitativo para todos los residentes.
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl font-semibold transition-all disabled:opacity-50"
              style={{
                backgroundColor: '#2F9E44',
                color: 'white',
                fontSize: '15px',
                minHeight: '48px',
                border: 'none',
              }}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar registro'}
            </button>

            <div className="text-center flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="font-medium"
                style={{ fontSize: '14px', color: '#2F9E44' }}
              >
                Ir al inicio
              </button>
              <Link
                href="/book"
                className="font-medium"
                style={{ fontSize: '14px', color: '#2F9E44' }}
              >
                Ir a reservas
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
