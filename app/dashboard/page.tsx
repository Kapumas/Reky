'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatTimeToAMPM } from '@/lib/utils/dateTime';

type StatsRange = '1m' | '6m' | 'all';

const RANGE_OPTIONS: { value: StatsRange; label: string }[] = [
  { value: '1m', label: '1 mes' },
  { value: '6m', label: '6 meses' },
  { value: 'all', label: 'Toda la vida' },
];

const BUCKET_SIZE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

const USER_COUNT_OPTIONS = [3, 5, 10];

interface UserStat {
  apartmentNumber: string;
  fullName: string;
  bookings: number;
  hours: number;
}

interface DayOfWeekStat {
  day: string;
  count: number;
}

interface DashboardStats {
  range: StatsRange;
  generatedAt: string;
  totals: {
    bookings: number;
    activeBookings: number;
    cancelledBookings: number;
    totalHours: number;
    uniqueUsers: number;
  };
  rankedUsers: UserStat[];
  bookingsByHour: number[];
  bookingsByDayOfWeek: DayOfWeekStat[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [range, setRange] = useState<StatsRange>('1m');
  const [bucketHours, setBucketHours] = useState(3);
  const [topUserCount, setTopUserCount] = useState(3);
  const [bottomUserCount, setBottomUserCount] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authPassword, setAuthPassword] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [configState, setConfigState] = useState<'checking' | 'ok' | 'missing'>('checking');

  const fetchStats = useCallback(async (selectedRange: StatsRange, dashboardPassword: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/dashboard/stats?range=${selectedRange}`, {
        headers: { 'x-dashboard-password': dashboardPassword },
      });

      if (response.status === 401) {
        setAuthPassword(null);
        setStats(null);
        setIsLoading(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('load_failed');
      }
    } catch {
      setError('load_failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    async function checkConfig() {
      try {
        const response = await fetch('/api/dashboard/auth');
        setConfigState(response.ok ? 'ok' : 'missing');
      } catch {
        setConfigState('missing');
      }
    }

    checkConfig();
  }, []);

  useEffect(() => {
    if (configState === 'ok' && authPassword) {
      fetchStats(range, authPassword);
    }
  }, [configState, range, fetchStats, authPassword]);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsAuthenticating(true);

    try {
      const response = await fetch('/api/dashboard/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setAuthPassword(password);
      }
    } catch {
      // Silent failure: access is simply not granted
    } finally {
      setPassword('');
      setIsAuthenticating(false);
    }
  }

  if (configState === 'missing') {
    return <div className="min-h-screen" style={{ backgroundColor: 'white' }} />;
  }

  if (configState === 'checking') {
    return <div className="min-h-screen" style={{ backgroundColor: 'white' }} />;
  }

  if (!authPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F6F8F7' }}>
        <div className="bg-white rounded-xl p-6 w-full" style={{ border: '1px solid #E5E7EB', maxWidth: '360px' }}>
          <h1 className="font-semibold mb-1" style={{ fontSize: '20px', color: '#1F2933' }}>
            Dashboard de uso
          </h1>
          <p className="mb-5" style={{ fontSize: '13px', color: '#6B7280' }}>
            Ingresa la contraseña para ver las estadísticas
          </p>
          <form onSubmit={handleAuthSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoFocus
              className="w-full rounded-lg mb-3"
              style={{
                border: '1px solid #E5E7EB',
                fontSize: '15px',
                padding: '12px',
                color: '#1F2933',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isAuthenticating || !password}
              className="w-full rounded-xl font-semibold transition-all"
              style={{
                backgroundColor: '#2F9E44',
                color: 'white',
                fontSize: '15px',
                minHeight: '48px',
                border: 'none',
                opacity: isAuthenticating || !password ? 0.6 : 1,
                cursor: isAuthenticating || !password ? 'default' : 'pointer',
              }}
            >
              {isAuthenticating ? 'Validando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F6F8F7' }}>
        <p style={{ color: '#6B7280', fontSize: '15px' }}>Cargando estadísticas...</p>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen" style={{ backgroundColor: 'white' }} />;
  }

  if (!stats) {
    return <div className="min-h-screen" style={{ backgroundColor: 'white' }} />;
  }

  const maxDayCount = Math.max(...stats.bookingsByDayOfWeek.map((d) => d.count), 1);

  const topUsers = stats.rankedUsers.slice(0, topUserCount);
  const bottomUsers = stats.rankedUsers
    .slice(topUserCount)
    .sort((a, b) => a.bookings - b.bookings || a.hours - b.hours)
    .slice(0, bottomUserCount);

  const maxUserBookings = Math.max(...topUsers.map((u) => u.bookings), 1);
  const maxBottomUserBookings = Math.max(...bottomUsers.map((u) => u.bookings), 1);

  const bucketMap = new Map<number, number>();
  stats.bookingsByHour.forEach((count, hour) => {
    if (count === 0) return;
    const bucketStart = 6 + bucketHours * Math.floor((hour - 6) / bucketHours);
    bucketMap.set(bucketStart, (bucketMap.get(bucketStart) || 0) + count);
  });
  const hourBuckets = Array.from(bucketMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([start, count]) => {
      const end = Math.min(start + bucketHours, 24);
      const startLabel = formatTimeToAMPM(`${String(start).padStart(2, '0')}:00`);
      const endLabel =
        end === 24 ? '12:00 AM' : formatTimeToAMPM(`${String(end).padStart(2, '0')}:00`);
      return { key: start, label: `${startLabel} - ${endLabel}`, count };
    });
  const maxBucketCount = Math.max(...hourBuckets.map((b) => b.count), 1);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F6F8F7' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-semibold" style={{ fontSize: '24px', color: '#1F2933' }}>
            Dashboard de uso
          </h1>
          <p style={{ fontSize: '13px', color: '#6B7280' }}>
            Estadísticas de la plataforma de reservas del punto de carga
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          {RANGE_OPTIONS.map((option) => {
            const isSelected = range === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setRange(option.value)}
                disabled={isLoading}
                className="rounded-lg font-medium transition-all"
                style={{
                  flex: 1,
                  minHeight: '44px',
                  fontSize: '14px',
                  border: isSelected ? 'none' : '1px solid #E5E7EB',
                  backgroundColor: isSelected ? '#2F9E44' : 'white',
                  color: isSelected ? 'white' : '#1F2933',
                  opacity: isLoading ? 0.6 : 1,
                  cursor: isLoading ? 'default' : 'pointer',
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E5E7EB' }}>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>Horas reservadas</p>
            <p className="font-semibold" style={{ fontSize: '28px', color: '#2F9E44' }}>
              {stats.totals.totalHours}h
            </p>
            <p style={{ fontSize: '12px', color: '#9CA3AF' }}>{stats.totals.activeBookings} reservas activas</p>
          </div>
          <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E5E7EB' }}>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>Usuarios únicos</p>
            <p className="font-semibold" style={{ fontSize: '28px', color: '#1F2933' }}>
              {stats.totals.uniqueUsers}
            </p>
            <p style={{ fontSize: '12px', color: '#9CA3AF' }}>activos con al menos una reserva</p>
          </div>
          <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E5E7EB' }}>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>Reservas canceladas</p>
            <p className="font-semibold" style={{ fontSize: '28px', color: '#1F2933' }}>
              {stats.totals.cancelledBookings}
            </p>
            <p style={{ fontSize: '12px', color: '#9CA3AF' }}>de {stats.totals.bookings} reservas totales</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 mb-6" style={{ border: '1px solid #E5E7EB' }}>
          <div className="flex justify-between items-center mb-4 gap-3">
            <h2 className="font-semibold" style={{ fontSize: '16px', color: '#1F2933' }}>
              Usuarios que más agendan
            </h2>
            <select
              value={topUserCount}
              onChange={(e) => setTopUserCount(Number(e.target.value))}
              className="rounded-lg shrink-0"
              style={{
                border: '1px solid #E5E7EB',
                backgroundColor: 'white',
                color: '#1F2933',
                fontSize: '13px',
                padding: '6px 8px',
              }}
            >
              {USER_COUNT_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  Top {count}
                </option>
              ))}
            </select>
          </div>
          {topUsers.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#6B7280' }}>No hay reservas en este período.</p>
          ) : (
            <div className="space-y-3">
              {topUsers.map((user, index) => (
                <div key={user.apartmentNumber} className="flex items-center gap-3">
                  <span
                    className="font-semibold shrink-0 text-center"
                    style={{ fontSize: '14px', color: '#9CA3AF', width: '20px' }}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2 mb-1">
                      <p className="truncate" style={{ fontSize: '14px', color: '#1F2933' }}>
                        {user.fullName}
                        <span style={{ color: '#9CA3AF', fontSize: '12px' }}> · Apto {user.apartmentNumber}</span>
                      </p>
                      <p className="shrink-0 font-medium" style={{ fontSize: '13px', color: '#2F9E44' }}>
                        {user.bookings} reservas · {user.hours}h
                      </p>
                    </div>
                    <div className="rounded-full" style={{ height: '6px', backgroundColor: '#F3F4F6' }}>
                      <div
                        className="rounded-full"
                        style={{
                          height: '6px',
                          backgroundColor: '#2F9E44',
                          width: `${(user.bookings / maxUserBookings) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-6 mb-6 md:grid-cols-2">
          <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E5E7EB' }}>
            <div className="flex justify-between items-center mb-4 gap-3">
              <h2 className="font-semibold" style={{ fontSize: '16px', color: '#1F2933' }}>
                Usuarios que menos agendan
              </h2>
              <select
                value={bottomUserCount}
                onChange={(e) => setBottomUserCount(Number(e.target.value))}
                className="rounded-lg shrink-0"
                style={{
                  border: '1px solid #E5E7EB',
                  backgroundColor: 'white',
                  color: '#1F2933',
                  fontSize: '13px',
                  padding: '6px 8px',
                }}
              >
                {USER_COUNT_OPTIONS.map((count) => (
                  <option key={count} value={count}>
                    Top {count}
                  </option>
                ))}
              </select>
            </div>
            {bottomUsers.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#6B7280' }}>No hay suficientes usuarios en este período.</p>
            ) : (
              <div className="space-y-3">
                {bottomUsers.map((user, index) => (
                  <div key={user.apartmentNumber} className="flex items-center gap-3">
                    <span
                      className="font-semibold shrink-0 text-center"
                      style={{ fontSize: '14px', color: '#9CA3AF', width: '20px' }}
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2 mb-1">
                        <p className="truncate" style={{ fontSize: '14px', color: '#1F2933' }}>
                          {user.fullName}
                          <span style={{ color: '#9CA3AF', fontSize: '12px' }}> · Apto {user.apartmentNumber}</span>
                        </p>
                        <p className="shrink-0 font-medium" style={{ fontSize: '13px', color: '#6B7280' }}>
                          {user.bookings} reservas · {user.hours}h
                        </p>
                      </div>
                      <div className="rounded-full" style={{ height: '6px', backgroundColor: '#F3F4F6' }}>
                        <div
                          className="rounded-full"
                          style={{
                            height: '6px',
                            backgroundColor: '#9CA3AF',
                            width: `${(user.bookings / maxBottomUserBookings) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E5E7EB' }}>
            <h2 className="font-semibold mb-4" style={{ fontSize: '16px', color: '#1F2933' }}>
              Reservas por día de la semana
            </h2>
            <div className="flex items-end justify-between gap-2" style={{ height: '120px' }}>
              {stats.bookingsByDayOfWeek.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center justify-end h-full">
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>{day.count}</span>
                  <div
                    className="w-full rounded-t"
                    style={{
                      backgroundColor: '#2F9E44',
                      height: `${Math.max((day.count / maxDayCount) * 80, day.count > 0 ? 4 : 0)}%`,
                    }}
                  />
                  <span className="mt-2" style={{ fontSize: '11px', color: '#9CA3AF' }}>
                    {day.day.slice(0, 3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 mb-6" style={{ border: '1px solid #E5E7EB' }}>
          <div className="flex justify-between items-center mb-4 gap-3">
            <h2 className="font-semibold" style={{ fontSize: '16px', color: '#1F2933' }}>
              Franjas horarias más reservadas
            </h2>
            <label className="flex items-center gap-2 shrink-0" style={{ fontSize: '13px', color: '#6B7280' }}>
              Rango de horas
              <select
                value={bucketHours}
                onChange={(e) => setBucketHours(Number(e.target.value))}
                className="rounded-lg"
                style={{
                  border: '1px solid #E5E7EB',
                  backgroundColor: 'white',
                  color: '#1F2933',
                  fontSize: '13px',
                  padding: '6px 8px',
                }}
              >
                {BUCKET_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size} hora{size > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {hourBuckets.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#6B7280' }}>No hay reservas en este período.</p>
          ) : (
            <div className="space-y-3">
              {hourBuckets.map((bucket) => (
                <div key={bucket.key} className="flex items-center gap-3">
                  <span className="shrink-0" style={{ fontSize: '13px', color: '#1F2933', width: '150px' }}>
                    {bucket.label}
                  </span>
                  <div className="flex-1 rounded-full" style={{ height: '14px', backgroundColor: '#F3F4F6' }}>
                    <div
                      className="rounded-full"
                      style={{
                        height: '14px',
                        backgroundColor: '#2F9E44',
                        width: `${(bucket.count / maxBucketCount) * 100}%`,
                        minWidth: '14px',
                      }}
                    />
                  </div>
                  <span className="shrink-0 font-medium" style={{ fontSize: '13px', color: '#6B7280', width: '30px', textAlign: 'right' }}>
                    {bucket.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center" style={{ fontSize: '12px', color: '#9CA3AF' }}>
          Generado el {new Date(stats.generatedAt).toLocaleString('es-CO')}
        </p>
      </div>
    </div>
  );
}
