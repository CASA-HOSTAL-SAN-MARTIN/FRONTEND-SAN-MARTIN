import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { checkPublicSolicitudStatus, type PublicSolicitudStatus } from '../api/client';
import type { SolicitudEstado } from '../types';

const labels: Record<SolicitudEstado, string> = {
  pendiente: 'Pendiente de revisión',
  en_revision: 'En revisión',
  aprobada: 'Aprobada',
  rechazada: 'No aprobada',
  cancelada: 'Cancelada',
};

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.status === 404) {
    return 'No encontramos una solicitud con ese radicado y correo. Revísalos e inténtalo de nuevo.';
  }
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return 'No fue posible consultar el estado. Verifica tu conexión e inténtalo de nuevo.';
}

export function ConsultarCupoPage() {
  const [searchParams] = useSearchParams();
  const [radicado, setRadicado] = useState(searchParams.get('radicado') ?? '');
  const [correo, setCorreo] = useState('');
  const [result, setResult] = useState<PublicSolicitudStatus | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      setResult(await checkPublicSolicitudStatus(radicado.trim(), correo.trim()));
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="status-lookup-page">
      <Link className="status-lookup-brand" to="/">Casa Estudiantil <span>SAN MARTÍN · PEREIRA</span></Link>
      <section className="status-lookup-card">
        <p className="eyebrow">Seguimiento de admisiones</p>
        <h1>Consulta tu solicitud</h1>
        <p className="status-lookup-intro">Ingresa el radicado que recibiste y el correo que registraste al solicitar el cupo.</p>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <label>Radicado
            <input required maxLength={36} value={radicado} onChange={(event) => setRadicado(event.target.value)} placeholder="Ej. 8ad12f6e-…" />
          </label>
          <label>Correo electrónico
            <input required type="email" maxLength={150} value={correo} onChange={(event) => setCorreo(event.target.value)} placeholder="correo@ejemplo.com" />
          </label>
          {error && <div className="alert error" role="alert">{error}</div>}
          <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Consultando…' : 'Consultar estado'}</button>
        </form>
        {result && <section className="status-lookup-result" role="status">
          <p className="eyebrow">Estado de la solicitud</p>
          <strong>{labels[result.estado]}</strong>
          <p>Radicado: <b>{result.radicado}</b></p>
          {result.estado === 'aprobada' && <p>Te enviaremos al correo registrado las instrucciones para configurar tu acceso.</p>}
          {result.estado === 'pendiente' && <p>Recibimos tu solicitud. El equipo de la residencia aún no inicia la revisión.</p>}
          {result.estado === 'en_revision' && <p>El equipo autorizado está revisando tu solicitud.</p>}
          {result.estado === 'rechazada' && <p>La revisión de tu solicitud finalizó. Si necesitas más información, contacta a la residencia.</p>}
        </section>}
        <Link className="status-lookup-back" to="/">Volver a la residencia</Link>
      </section>
    </main>
  );
}
