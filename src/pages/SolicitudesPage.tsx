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

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>;
}

export function SolicitudesPage() {
  const [form, setForm] = useState(initialForm);
  const [receipt, setReceipt] = useState<{ radicado: string; emailSent: boolean } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof SolicitudPayload, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setReceipt(null);
    setLoading(true);
    try {
      const response = await createSolicitud(form);
      setReceipt({ radicado: response.radicado, emailSent: response.confirmationEmailSent });
      setForm(initialForm);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="application-page">
      <section className="application-visual" aria-label="Residencia Casa Estudiantil San Martín">
        <Link className="application-brand" to="/" aria-label="Casa Estudiantil San Martín, inicio">
          <span className="application-brand-mark">CS</span>
          <span><strong>Casa Estudiantil</strong><small>SAN MARTÍN · PEREIRA</small></span>
        </Link>
        <div className="application-visual-copy">
          <p className="application-kicker"><span /> ALOJAMIENTO UNIVERSITARIO · PEREIRA</p>
          <h1>Encuentra tu lugar<br />para vivir y estudiar.</h1>
          <p>Un entorno pensado para acompañarte en tu vida universitaria, con espacios para crecer, compartir y concentrarte.</p>
        </div>
        <Link className="application-back" to="/">← Volver a la residencia</Link>
      </section>

      <section className="application-panel" aria-labelledby="application-title">
        <div className="application-card">
          <h2 id="application-title">Solicitud de cupo</h2>
          <p className="application-description">¡Qué alegría que quieras ser parte de nuestra comunidad! Completa el formulario. Te enviaremos un radicado para que consultes el estado de tu solicitud.</p>
          <p className="application-required"><span>*</span> Campos obligatorios</p>

          {error && <div className="alert error application-alert" role="alert">{error}</div>}
          {receipt && (
            <section className="confirmation application-confirmation" role="status">
              <strong>¡Solicitud recibida!</strong>
              <p>Tu número de radicado es:</p>
              <strong className="application-radicado">{receipt.radicado}</strong>
              {receipt.emailSent
                ? <p>También enviamos el radicado al correo que registraste. Guárdalo para consultar el avance junto con ese correo.</p>
                : <p>Guarda este radicado. No pudimos enviarlo por correo en este momento; puedes consultar el estado con el radicado y el correo registrado.</p>}
              <Link className="application-text-link" to={`/consultar-cupo?radicado=${encodeURIComponent(receipt.radicado)}`}>Consultar estado <ArrowIcon /></Link>
            </section>
          )}

          <form className="application-form" onSubmit={handleCreate}>
            <div className="application-fields">
              <label>Nombres *<input required maxLength={100} autoComplete="given-name" placeholder="Tus nombres completos" value={form.nombres} onChange={(event) => updateField('nombres', event.target.value)} /></label>
              <label>Apellidos *<input required maxLength={100} autoComplete="family-name" placeholder="Tus apellidos completos" value={form.apellidos} onChange={(event) => updateField('apellidos', event.target.value)} /></label>
              <label>Número de documento *<input required minLength={5} maxLength={30} autoComplete="off" placeholder="Tu número de documento" value={form.numeroDocumento} onChange={(event) => updateField('numeroDocumento', event.target.value)} /></label>
              <label>Correo electrónico *<input required type="email" maxLength={150} autoComplete="email" placeholder="correo@ejemplo.com" value={form.correo} onChange={(event) => updateField('correo', event.target.value)} /></label>
              <label>Teléfono *<input required minLength={7} maxLength={30} autoComplete="tel" placeholder="Tu número de contacto" value={form.telefono} onChange={(event) => updateField('telefono', event.target.value)} /></label>
              <label>Programa académico *<input required maxLength={150} autoComplete="organization-title" placeholder="Tu programa académico" value={form.programaAcademico} onChange={(event) => updateField('programaAcademico', event.target.value)} /></label>
              <label className="application-university">Universidad *<input required maxLength={150} autoComplete="organization" placeholder="Nombre de tu universidad" value={form.universidad} onChange={(event) => updateField('universidad', event.target.value)} /></label>
            </div>
            <button className="application-submit" disabled={loading} type="submit">
              {loading ? 'Enviando solicitud…' : 'Enviar solicitud'} <ArrowIcon />
            </button>
          </form>

          <div className="application-followup">
            <p>¿Ya enviaste una solicitud?</p>
            <Link className="application-text-link" to="/consultar-cupo">Consultar estado con mi radicado <ArrowIcon /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
