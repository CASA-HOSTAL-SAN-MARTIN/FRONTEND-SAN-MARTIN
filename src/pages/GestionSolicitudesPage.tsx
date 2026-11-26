import { useCallback, useEffect, useState } from 'react';
import { getSolicitudes, updateSolicitudEstado } from '../api/client';
import type { Solicitud, SolicitudEstado } from '../types';

const estadoLabels: Record<SolicitudEstado, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
};

export function GestionSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSolicitudes(await getSolicitudes());
    } catch {
      setError('No fue posible cargar las solicitudes. Verifica tus permisos o conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function changeStatus(solicitud: Solicitud, estado: SolicitudEstado) {
    setUpdatingId(solicitud.id);
    setError('');
    setNotice('');
    try {
      const updated = await updateSolicitudEstado(solicitud.id, estado);
      setSolicitudes((current) => current.map((item) => item.id === updated.id ? updated : item));
      if (estado === 'aprobada') {
        setNotice(updated.accountSetupEmailSent
          ? `Solicitud aprobada. Enviamos las instrucciones de acceso a ${solicitud.correo}.`
          : 'Solicitud aprobada, pero no fue posible enviar las instrucciones. Verifica la configuración de correo y usa recuperación de contraseña para reenviar el enlace.');
      }
    } catch {
      setError('No se pudo actualizar el estado. La solicitud pudo cambiar desde otra sesión; recarga e inténtalo de nuevo.');
    } finally {
      setUpdatingId('');
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Admisiones</p>
        <h1>Revisión de solicitudes</h1>
        <p>Revisa cada aspirante y actualiza el avance de su proceso.</p>
      </section>
      {error && <div className="alert error" role="alert">{error}</div>}
      {notice && <div className="alert success" role="status">{notice}</div>}
      {loading ? <section className="card" role="status">Cargando solicitudes…</section> : (
        <section className="request-list" aria-label="Solicitudes recibidas">
          {solicitudes.length === 0 && <div className="card"><p>No hay solicitudes registradas.</p></div>}
          {solicitudes.map((solicitud) => (
            <article className="card request-card" key={solicitud.id}>
              <div className="request-card-heading">
                <div><p className="eyebrow">{solicitud.numeroDocumento}</p><h2>{solicitud.nombres} {solicitud.apellidos}</h2></div>
                <span className={`status status-${solicitud.estado}`}>{estadoLabels[solicitud.estado]}</span>
              </div>
              <p>{solicitud.correo} · {solicitud.telefono}</p>
              <p className="muted">{solicitud.programaAcademico} · {solicitud.universidad}</p>
              <div className="request-actions">
                {solicitud.estado === 'pendiente' && <button className="primary-button" disabled={updatingId === solicitud.id} onClick={() => void changeStatus(solicitud, 'en_revision')}>Iniciar revisión</button>}
                {solicitud.estado === 'en_revision' && <>
                  <button className="primary-button" disabled={updatingId === solicitud.id} onClick={() => void changeStatus(solicitud, 'aprobada')}>Aprobar solicitud</button>
                  <button className="secondary-button" disabled={updatingId === solicitud.id} onClick={() => void changeStatus(solicitud, 'rechazada')}>Rechazar</button>
                </>}
              </div>
            </article>
          ))}
        </section>
      )}
      {!loading && <button className="secondary-button" onClick={() => void load()}>Actualizar lista</button>}
    </main>
  );
}
