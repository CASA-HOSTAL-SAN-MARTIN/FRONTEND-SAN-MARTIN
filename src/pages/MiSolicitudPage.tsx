import { useCallback, useEffect, useState } from 'react';
import { getMySolicitud } from '../api/client';
import type { Solicitud, SolicitudEstado } from '../types';

const estadoLabels: Record<SolicitudEstado, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
};

export function MiSolicitudPage() {
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSolicitud(await getMySolicitud());
    } catch {
      setError('No pudimos cargar tu solicitud. Revisa tu conexión y vuelve a intentarlo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Seguimiento personal</p>
        <h1>Mi solicitud de cupo</h1>
        <p>Consulta de forma segura el estado de tu solicitud.</p>
      </section>
      {loading && <section className="card" role="status">Cargando tu solicitud…</section>}
      {error && <section className="card"><div className="alert error" role="alert">{error}</div><button className="primary-button" onClick={() => void load()}>Reintentar</button></section>}
      {!loading && !error && solicitud && (
        <section className="card narrow" aria-labelledby="my-request-title">
          <div className="section-heading">
            <div><p className="eyebrow">Estado actual</p><h2 id="my-request-title">{solicitud.nombres} {solicitud.apellidos}</h2></div>
            <span className={`status status-${solicitud.estado}`}>{estadoLabels[solicitud.estado]}</span>
          </div>
          <dl className="request-details">
            <div><dt>Radicado</dt><dd>{solicitud.radicado}</dd></div>
            <div><dt>Fecha de solicitud</dt><dd>{new Date(solicitud.createdAt).toLocaleDateString('es-CO')}</dd></div>
            <div><dt>Programa académico</dt><dd>{solicitud.programaAcademico}</dd></div>
            <div><dt>Universidad</dt><dd>{solicitud.universidad}</dd></div>
          </dl>
          <p className="muted">Puedes volver a consultar esta página cuando quieras; solo tu cuenta puede ver esta información.</p>
          <button className="primary-button" onClick={() => void load()}>Actualizar estado</button>
        </section>
      )}
    </main>
  );
}
