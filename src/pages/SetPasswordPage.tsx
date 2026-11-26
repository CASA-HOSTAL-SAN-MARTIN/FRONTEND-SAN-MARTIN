import { type FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { setPassword } from '../api/client';

export function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPasswordValue] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');
    if (!token) { setError('El enlace no contiene un token válido. Solicita uno nuevo.'); return; }
    if (password !== confirmation) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true);
    try {
      const response = await setPassword(token, password);
      setMessage(response.message);
      setPasswordValue('');
      setConfirmation('');
    } catch (requestError) {
      const apiMessage = axios.isAxiosError(requestError) ? requestError.response?.data?.message : undefined;
      setError(typeof apiMessage === 'string' ? apiMessage : 'No se pudo configurar la contraseña. El enlace pudo vencer o ya fue usado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page set-password-page">
      <section className="login-panel">
        <section className="login-card" aria-labelledby="set-password-title">
          <p className="public-eyebrow"><span /> ACCESO A LA PLATAFORMA</p>
          <h1 id="set-password-title">Configura tu contraseña</h1>
          <p className="login-description">Usa una contraseña de al menos 9 caracteres. Este enlace solo se puede usar una vez.</p>
          {error && <div className="alert error" role="alert">{error}</div>}
          {message && <div className="alert success" role="status">{message}</div>}
          {!message && <form onSubmit={handleSubmit}>
            <label>Nueva contraseña<input required minLength={9} maxLength={72} type="password" autoComplete="new-password" value={password} onChange={(event) => setPasswordValue(event.target.value)} /></label>
            <label>Repite la contraseña<input required minLength={9} maxLength={72} type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
            <button className="apply-button login-submit" disabled={loading} type="submit">{loading ? 'Guardando…' : 'Guardar contraseña'}</button>
          </form>}
          {message ? <Link className="login-back" to="/login">Ir a iniciar sesión</Link> : <Link className="login-back" to="/login">Volver al inicio de sesión</Link>}
        </section>
      </section>
    </main>
  );
}
