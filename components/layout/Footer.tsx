import { APP_NAME } from '@/lib/constants';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t mt-auto" style={{ borderColor: '#E5E7EB' }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center space-y-2">
          <p className="font-medium" style={{ fontSize: '14px', color: '#1F2933' }}>
            {APP_NAME}
          </p>
          <p style={{ fontSize: '12px', color: '#6B7280' }}>
            Sistema de Reservas para Carga de Vehículos Eléctricos
          </p>
          <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
            © {currentYear} Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}
