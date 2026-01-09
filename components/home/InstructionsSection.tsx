export function InstructionsSection() {
  return (
    <div className="mt-12 bg-white rounded-2xl p-8 shadow-lg border border-greige-200">
      <h3 className="text-2xl font-serif font-bold text-greige-900 mb-6 text-center">
        ¿Cómo funciona?
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-sage bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-sage">1</span>
          </div>
          <h4 className="font-semibold text-greige-900 mb-2">Selecciona una Fecha</h4>
          <p className="text-greige-600 text-sm">
            Haz clic en cualquier día del calendario para ver los horarios disponibles
          </p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 bg-sage bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-sage">2</span>
          </div>
          <h4 className="font-semibold text-greige-900 mb-2">Completa el Formulario</h4>
          <p className="text-greige-600 text-sm">
            Ingresa tu apartamento, nombre y selecciona el horario preferido
          </p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 bg-sage bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-sage">3</span>
          </div>
          <h4 className="font-semibold text-greige-900 mb-2">Recibe tu Código</h4>
          <p className="text-greige-600 text-sm">
            Guarda tu código de confirmación para gestionar tu reserva
          </p>
        </div>
      </div>
    </div>
  );
}
