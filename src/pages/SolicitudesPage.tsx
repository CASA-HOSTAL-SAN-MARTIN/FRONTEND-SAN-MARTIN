import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { createSolicitud } from '../api/client';
import type { SolicitudPayload } from '../types';

const initialForm: SolicitudPayload = {
  nombres: '',
  apellidos: '',
  numeroDocumento: '',
  correo: '',
  telefono: '',
  programaAcademico: '',
  universidad: '',
};

function getApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
  }
  return 'No fue posible enviar la solicitud. Verifica tu conexión e inténtalo nuevamente.';
}

export function SolicitudesPage() {
  const [form, setForm] = useState(initialForm);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof SolicitudPayload, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setEmailSent(null);
    setLoading(true);
    try {
      const response = await createSolicitud(form);
      setEmailSent(response.accountSetupEmailSent);
      setForm(initialForm);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div><p className="eyebrow">Casa Estudiantil San Martín</p><h1>Solicitud de cupo</h1></div>
        <Link className="header-link" to="/">Volver a la residencia</Link>
      </header>
      <section className="hero">
        <p className="eyebrow">Admisiones</p>
        <h2>Encuentra tu lugar para vivir y estudiar</h2>
        <p>Envía tu solicitud y consulta su estado de forma privada cuando configures tu acceso.</p>
      </section>
      {error && <div className="alert error" role="alert">{error}</div>}
      {emailSent !== null && (
        <section className="confirmation" role="status">
          <strong>¡Solicitud recibida!</strong>
          {emailSent
            ? <p>Te enviamos un enlace de un solo uso a tu correo para configurar la contraseña y consultar el estado de tu solicitud.</p>
            : <p>La solicitud quedó registrada, pero no pudimos enviar el correo de acceso. Comunícate con la administración para recibir ayuda.</p>}
          <Link className="header-link" to="/login">Ir a iniciar sesión</Link>
        </section>
      )}
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
            <label>Correo electrónico *<input required type="email" maxLength={150} value={form.correo} onChange={(event) => updateField('correo', event.target.value)} /></label>
            <label>Teléfono *<input required minLength={7} maxLength={30} value={form.telefono} onChange={(event) => updateField('telefono', event.target.value)} /></label>
            <label>Programa académico *<input required maxLength={150} value={form.programaAcademico} onChange={(event) => updateField('programaAcademico', event.target.value)} /></label>
            <label className="full-width">Universidad *<input required maxLength={150} value={form.universidad} onChange={(event) => updateField('universidad', event.target.value)} /></label>
          </div>
          <button className="primary-button" disabled={loading} type="submit">{loading ? 'Enviando…' : 'Enviar solicitud'}</button>
        </form>
      </section>
    </main>
  );
}
