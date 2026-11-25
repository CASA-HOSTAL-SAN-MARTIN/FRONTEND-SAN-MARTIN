import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

export function LoginPage() {
  const [submitted, setSubmitted] = useState(false);
  const [recoveryRequested, setRecoveryRequested] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
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
        <section className="login-card">
          <p className="public-eyebrow"><span /> ACCESO A LA PLATAFORMA</p>
          <h2>Qué bueno verte.</h2>
          <p className="login-description">Ingresa con las credenciales que te fueron asignadas. Tus permisos dependen de tu cuenta.</p>
          {submitted && <div className="alert login-notice" role="status">La autenticación aún no está conectada. Esta pantalla es la interfaz inicial del acceso.</div>}
          {recoveryRequested && <div className="alert login-notice" role="status">La recuperaci&oacute;n a&uacute;n no est&aacute; habilitada. Comun&iacute;cate con el personal administrador.</div>}
          <form onSubmit={handleSubmit}>
            <label>Número de documento<input required inputMode="numeric" autoComplete="username" placeholder="Tu número de documento" /></label>
            <label>Contraseña<input required type="password" autoComplete="current-password" placeholder="Ingresa tu contraseña" /></label>
            <button className="apply-button login-submit" type="submit">Iniciar sesión <span aria-hidden="true">→</span></button>
          </form>
          <p className="login-help"><span>&iquest;Olvidaste tu contrase&ntilde;a?</span> <button type="button" onClick={() => setRecoveryRequested(true)}>Recuperarla</button></p>
          <Link className="login-back" to="/">← Volver a la página principal</Link>
        </section>
      </section>
    </main>
  );
}
