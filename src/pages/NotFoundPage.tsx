import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <p className="eyebrow">Casa Estudiantil San Martín</p>
      <p className="not-found-code" aria-hidden="true">404</p>
      <h1>No encontramos esta página</h1>
      <p>La dirección puede haber cambiado o no existir.</p>
      <div className="not-found-actions">
        <Link className="primary-button" to="/">Volver al inicio</Link>
        <Link className="header-link" to="/solicitar-cupo">Ir a solicitudes</Link>
      </div>
    </main>
  );
}
