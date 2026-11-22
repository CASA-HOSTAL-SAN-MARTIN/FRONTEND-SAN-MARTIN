import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="global-footer bg-slate-900 text-slate-300 py-12 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Identidad Institucional */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs">
                SM
              </span>
              <strong className="text-white text-base tracking-tight">
                Casa Estudiantil San Martín
              </strong>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed m-0">
              Residencia universitaria mixta para estudiantes de pregrado foráneos de la Universidad del Otún, operada por la Fundación San Martín de Porres.
            </p>
          </div>

          {/* Ubicación y Capacidad */}
          <div className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Sede Principal
            </span>
            <p className="text-slate-300 m-0">
              📍 Carrera 12 # 21-45, Centro de Pereira, Risaralda
            </p>
            <p className="text-slate-400 m-0 text-xs">
              Edificio de 3 pisos y sótano • 24 habitaciones dobles • 48 camas mixtas
            </p>
            <p className="text-slate-400 m-0 text-xs">
              Convenio de Bienestar Universitario: 3 cupos becados activos
            </p>
          </div>

          {/* Enlaces Rápidos y Soporte */}
          <div className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Módulos del Sistema
            </span>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
              <Link to="/" className="text-slate-300 hover:text-white transition-colors">
                Solicitud de Cupo
              </Link>
              <Link to="/camas" className="text-slate-300 hover:text-white transition-colors">
                Estado de Camas
              </Link>
              <Link to="/contratos" className="text-slate-300 hover:text-white transition-colors">
                Contratos
              </Link>
              <Link to="/pagos" className="text-slate-300 hover:text-white transition-colors">
                Pagos y Depósitos
              </Link>
              <Link to="/estado-cuenta" className="text-slate-300 hover:text-white transition-colors">
                Cartera y Mora
              </Link>
              <Link to="/login" className="text-slate-300 hover:text-white transition-colors">
                Acceso al Sistema
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="m-0">
            © {new Date().getFullYear()} Casa Estudiantil San Martín. Todos los derechos reservados.
          </p>
          <p className="m-0">
            Plataforma Web • Bienestar, Apoyo y Educación
          </p>
        </div>
      </div>
    </footer>
  );
}
