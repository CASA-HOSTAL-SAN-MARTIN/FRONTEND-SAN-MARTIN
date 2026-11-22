import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="app-shell flex items-center justify-center min-h-[70vh] p-6">
      <section className="card narrow text-center p-10 bg-white border border-slate-200 rounded-3xl shadow-lg max-w-lg">
        <div className="text-6xl mb-4" aria-hidden="true">
          🔎
        </div>
        <p className="eyebrow text-blue-700">Error 404</p>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-2">
          Página no encontrada
        </h1>
        <p className="text-slate-600 mt-3 text-sm leading-relaxed">
          La ruta que estás buscando no existe en el sistema de la Casa Estudiantil San Martín, o fue reubicada en otra sección.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
          <Link to="/" className="secondary-button text-center">
            ← Ver Solicitudes
          </Link>
          <Link to="/inicio" className="primary-button text-center">
            Ir al Panel Principal
          </Link>
        </div>
      </section>
    </main>
  );
}
