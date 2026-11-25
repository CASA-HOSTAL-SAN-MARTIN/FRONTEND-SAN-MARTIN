import { type FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { defaultPathForRole } from '../auth/roleAccess';

type LoginLocationState = { from?: { pathname?: string } };

export function LoginPage() {
  const [documentNumber, setDocumentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [recoveryRequested, setRecoveryRequested] = useState(false);
  const { isAuthenticated, login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (isAuthenticated && user) return <Navigate to={defaultPathForRole(user.roles)} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setRecoveryRequested(false);
    setSubmitting(true);
    try {
      const user = await login(documentNumber.trim(), password);
      const requestedPath = (location.state as LoginLocationState | null)?.from?.pathname;
      navigate(requestedPath && requestedPath !== '/login' ? requestedPath : defaultPathForRole(user.roles), { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No fue posible iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <aside className="login-visual">
        <Link className="brand login-brand" to="/" aria-label="Volver al inicio">
          <span className="brand-symbol">CS</span>
          <span className="brand-copy"><strong>Casa Estudiantil</strong><small>San Martín · Pereira</small></span>
        </Link>
        <div className="login-visual-copy"><p className="photo-eyebrow">ALOJAMIENTO UNIVERSITARIO · PEREIRA</p><h1>Tu espacio<br />para crecer.</h1><p>Una residencia pensada para acompañarte durante tu vida universitaria.</p></div>
      </aside>
      <section className="login-panel">
        <section className="login-card" aria-labelledby="login-title">
          <p className="public-eyebrow"><span /> ACCESO A LA PLATAFORMA</p>
          <h2 id="login-title">Qué bueno verte.</h2>
          <p className="login-description">Ingresa con las credenciales que te fueron asignadas. Tus permisos dependen de tu cuenta.</p>
          {error && <div className="alert error login-auth-error" role="alert">{error}</div>}
          {recoveryRequested && <div className="alert login-notice" role="status">La recuperación de contraseña todavía no está disponible. Comunícate con el personal administrador.</div>}
          <form onSubmit={handleSubmit}>
            <label>Número de documento<input required inputMode="numeric" autoComplete="username" value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value)} placeholder="Tu número de documento" /></label>
            <label>Contraseña<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ingresa tu contraseña" /></label>
            <button className="apply-button login-submit" disabled={submitting} type="submit">{submitting ? 'Validando...' : 'Iniciar sesión'} <span aria-hidden="true">→</span></button>
          </form>
          <p className="login-help"><span>¿Olvidaste tu contraseña?</span> <button type="button" onClick={() => setRecoveryRequested(true)}>Recuperarla</button></p>
          <Link className="login-back" to="/">← Volver a la página principal</Link>
        </section>
      </section>
    </main>
  );
}
