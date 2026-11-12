import { type FormEvent, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { createSolicitud, getSolicitud, getSolicitudes } from '../api/client';
import type { Solicitud, SolicitudPayload, SolicitudEstado, UserRole } from '../types';

const initialForm: SolicitudPayload = {
  nombres: '',
  apellidos: '',
  numeroDocumento: '',
  correo: '',
  telefono: '',
  programaAcademico: '',
  universidad: '',
};

const authorizedRoles: UserRole[] = ['ADMIN_SISTEMA', 'COORDINACION_BIENESTAR', 'ADMIN_FUNDACION'];
const roleLabels: Record<SolicitudEstado, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
};

function getApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
  }
  return 'No fue posible completar la operación. Verifica tu conexión e inténtalo nuevamente.';
}

function StatusBadge({ status }: { status: SolicitudEstado }) {
  return <span className={`status status-${status}`}>{roleLabels[status]}</span>;
}

export function SolicitudesPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'lookup' | 'admin'>('create');
  const [form, setForm] = useState(initialForm);
  const [created, setCreated] = useState<Solicitud | null>(null);
  const [result, setResult] = useState<Solicitud | null>(null);
  const [requests, setRequests] = useState<Solicitud[]>([]);
  const [lookupId, setLookupId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const currentRole = localStorage.getItem('userRole') as UserRole | null;
  const canViewAll = currentRole !== null && authorizedRoles.includes(currentRole);

  function updateField(field: keyof SolicitudPayload, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setCreated(null);
    setLoading(true);
    try {
      const solicitud = await createSolicitud(form);
      setCreated(solicitud);
      setForm(initialForm);
      setNotice('Solicitud registrada correctamente.');
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setResult(null);
    setLoading(true);
    try {
      setResult(await getSolicitud(lookupId.trim()));
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadRequests() {
    setError('');
    setLoading(true);
    try {
      setRequests(await getSolicitudes());
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Casa Estudiantil San Martín</p>
          <h1>Solicitud de cupo</h1>
        </div>
        <div className="header-actions">
          <Link className="header-link" to="/camas">Estado de camas</Link>
          <span className="header-mark">CS</span>
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow">Admisiones</p>
        <h2>Encuentra tu lugar para vivir y estudiar</h2>
        <p>Registra tu solicitud de cupo o consulta el estado de una solicitud existente.</p>
      </section>

      <nav className="tabs" aria-label="Secciones de solicitudes">
        <button className={activeTab === 'create' ? 'tab active' : 'tab'} onClick={() => setActiveTab('create')}>
          Solicitar cupo
        </button>
        <button className={activeTab === 'lookup' ? 'tab active' : 'tab'} onClick={() => setActiveTab('lookup')}>
          Consultar estado
        </button>
        <button className={activeTab === 'admin' ? 'tab active' : 'tab'} onClick={() => setActiveTab('admin')}>
          Panel autorizado
        </button>
      </nav>

      {(error || notice) && (
        <div className={error ? 'alert error' : 'alert success'} role="alert">
          {error || notice}
        </div>
      )}

      {activeTab === 'create' && (
        <section className="card">
          <div className="section-heading">
            <div><p className="eyebrow">Paso 1 de 1</p><h3>Cuéntanos sobre ti</h3></div>
            <span className="required-note">* Obligatorio</span>
          </div>
          <form onSubmit={handleCreate}>
            <div className="form-grid">
              <label>Nombres *<input required maxLength={100} value={form.nombres} onChange={(event) => updateField('nombres', event.target.value)} /></label>
              <label>Apellidos *<input required maxLength={100} value={form.apellidos} onChange={(event) => updateField('apellidos', event.target.value)} /></label>
              <label>Número de documento *<input required minLength={5} maxLength={30} value={form.numeroDocumento} onChange={(event) => updateField('numeroDocumento', event.target.value)} /></label>
              <label>Correo electrónico *<input required type="email" value={form.correo} onChange={(event) => updateField('correo', event.target.value)} /></label>
              <label>Teléfono *<input required minLength={7} maxLength={30} value={form.telefono} onChange={(event) => updateField('telefono', event.target.value)} /></label>
              <label>Programa académico *<input required maxLength={150} value={form.programaAcademico} onChange={(event) => updateField('programaAcademico', event.target.value)} /></label>
              <label className="full-width">Universidad *<input required maxLength={150} value={form.universidad} onChange={(event) => updateField('universidad', event.target.value)} /></label>
            </div>
            <button className="primary-button" disabled={loading} type="submit">{loading ? 'Enviando...' : 'Enviar solicitud'}</button>
          </form>
          {created && <div className="confirmation"><strong>¡Solicitud recibida!</strong><p>Guarda tu radicado para consultar el estado:</p><code>{created.id}</code><button className="link-button" onClick={() => { setLookupId(created.id); setActiveTab('lookup'); }}>Consultar esta solicitud</button></div>}
        </section>
      )}

      {activeTab === 'lookup' && (
        <section className="card narrow">
          <div className="section-heading"><div><p className="eyebrow">Seguimiento</p><h3>Consulta tu solicitud</h3></div></div>
          <p className="muted">Ingresa el radicado que recibiste al completar el registro.</p>
          <form className="lookup-form" onSubmit={handleLookup}>
            <label className="full-width">Identificador de solicitud *<input required value={lookupId} onChange={(event) => setLookupId(event.target.value)} placeholder="Ej. 4f0c..." /></label>
            <button className="primary-button" disabled={loading} type="submit">{loading ? 'Consultando...' : 'Consultar estado'}</button>
          </form>
          {result && <div className="result-box"><div><span className="muted">Radicado</span><strong>{result.id}</strong></div><div><span className="muted">Aspirante</span><strong>{result.nombres} {result.apellidos}</strong></div><div><span className="muted">Estado</span><StatusBadge status={result.estado} /></div></div>}
        </section>
      )}

      {activeTab === 'admin' && (
        <section className="card">
          <div className="section-heading"><div><p className="eyebrow">Gestión interna</p><h3>Solicitudes registradas</h3></div>{canViewAll && <button className="secondary-button" disabled={loading} onClick={handleLoadRequests}>{loading ? 'Cargando...' : 'Actualizar listado'}</button>}</div>
          {!canViewAll ? <div className="locked"><strong>Acceso restringido</strong><p>Esta vista está disponible únicamente para personal autorizado de coordinación, administración del sistema o administración de la fundación.</p></div> : requests.length === 0 ? <p className="muted">Selecciona “Actualizar listado” para consultar las solicitudes.</p> : <div className="table-wrap"><table><thead><tr><th>Aspirante</th><th>Documento</th><th>Universidad</th><th>Estado</th><th>Radicado</th></tr></thead><tbody>{requests.map((request) => <tr key={request.id}><td>{request.nombres} {request.apellidos}</td><td>{request.numeroDocumento}</td><td>{request.universidad}</td><td><StatusBadge status={request.estado} /></td><td><code>{request.id.slice(0, 8)}...</code></td></tr>)}</tbody></table></div>}
        </section>
      )}
    </main>
  );
}
