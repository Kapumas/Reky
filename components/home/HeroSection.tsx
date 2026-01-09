import { APP_NAME } from '@/lib/constants';
import { Zap, Clock, Home as HomeIcon, CheckCircle } from 'lucide-react';

export function HeroSection() {
  return (
    <div className="bg-gradient-to-r from-greige-800 via-greige-700 to-greige-600 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-sage bg-opacity-20 p-6 rounded-3xl backdrop-blur-sm border border-sage border-opacity-30">
              <Zap className="h-16 w-16 text-sage" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            {APP_NAME}
          </h1>
          <p className="text-xl text-greige-200 max-w-2xl mx-auto">
            Sistema de Reservas para Carga de Vehículos Eléctricos
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
            <Clock className="h-8 w-8 text-sage mb-3" />
            <h3 className="font-semibold text-lg mb-2">Horarios Flexibles</h3>
            <p className="text-greige-200 text-sm">
              Reserva entre 6 AM y 10 PM en bloques de 2 horas
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
            <HomeIcon className="h-8 w-8 text-sage mb-3" />
            <h3 className="font-semibold text-lg mb-2">Para Residentes</h3>
            <p className="text-greige-200 text-sm">
              Exclusivo para residentes de Colinas del Mameyal
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
            <CheckCircle className="h-8 w-8 text-sage mb-3" />
            <h3 className="font-semibold text-lg mb-2">Fácil Gestión</h3>
            <p className="text-greige-200 text-sm">
              Reserva, consulta y cancela con tu código de confirmación
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
