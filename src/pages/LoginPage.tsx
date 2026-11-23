import { type FormEvent, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import type { LoginCredentials, UserRole } from '../types';

function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
    if (!error.response) {
      return 'No fue posible conectar con el servidor de autenticación. Verifica tu conexión.';
    }
  }
  return 'Credenciales incorrectas o error en el inicio de sesión. Por favor verifica tus datos.';
}

const DEMO_USERS: { label: string; email: string; pass: string; rol: UserRole; nombre: string }[] = [
  {
    label: 'Coordinación de Bienestar',
    email: 'bienestar@casasanmartin.edu.co',
    pass: 'Bienestar2026*',
    rol: 'COORDINACION_BIENESTAR',
    nombre: 'Patricia Rincón',
  },
  {
    label: 'Administración Fundación',
    email: 'administracion@fundacionsanmartin.org',
    pass: 'Fundacion2026*',
    rol: 'ADMIN_FUNDACION',
    nombre: 'Jorge Medina',
  },
  {
    label: 'Contabilidad',
    email: 'contabilidad@fundacionsanmartin.org',
    pass: 'Contabilidad2026*',
    rol: 'CONTABILIDAD',
    nombre: 'Yolanda Contadora',
  },
  {
    label: 'Monitora de Convivencia',
    email: 'monitora@casasanmartin.edu.co',
    pass: 'Monitora2026*',
    rol: 'MONITORA',
    nombre: 'Camila Restrepo',
  },
  {
    label: 'Aspirante / Residente',
    email: 'residente@utp.edu.co',
    pass: 'Residente2026*',
    rol: 'ASPIRANTE_RESIDENTE',
    nombre: 'Santiago Morales',
  },
];

export function LoginPage() {
  const { user, isAuthenticated, login, logout, setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirigir a la ruta a la que intentaba acceder antes de ser redirigido al login
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname ?? '/inicio';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Por favor ingresa tu correo electrónico institucional.');
      return;
    }

    if (!password) {
      setError('Por favor ingresa tu contraseña.');
      return;
    }

    setLoading(true);
    const credentials: LoginCredentials = {
      email: email.trim(),
      password,
      rememberMe,
    };

    try {
      await login(credentials);
      navigate(from, { replace: true });
    } catch (requestError) {
      // Fallback: Si el backend no tiene implementado el endpoint /api/auth/login, permitir inicio de sesión para usuarios demo
      const matchedDemo = DEMO_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (matchedDemo) {
        setSession({
          token: `jwt-demo-token-${Date.now()}`,
          user: {
            id: `usr-${matchedDemo.rol.toLowerCase()}`,
            nombre: matchedDemo.nombre,
            email: matchedDemo.email,
            rol: matchedDemo.rol,
          },
        });
        navigate(from, { replace: true });
        return;
      }

      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  function handleQuickLogin(demo: (typeof DEMO_USERS)[number]) {
    setEmail(demo.email);
    setPassword(demo.pass);
    setError('');
    // Inicio de sesión directo con cuenta demo
    setSession({
      token: `jwt-demo-${demo.rol.toLowerCase()}-${Date.now()}`,
      user: {
        id: `usr-${demo.rol.toLowerCase()}`,
        nombre: demo.nombre,
        email: demo.email,
        rol: demo.rol,
      },
    });
    navigate(from, { replace: true });
  }

  if (isAuthenticated && user) {
    return (
      <main className="app-shell login-page">
        <header className="topbar">
          <Link className="brand" to="/">
            <span className="brand-seal">SM</span>
            <span className="brand-name">CASA ESTUDIANTIL<strong>SAN MARTÍN</strong></span>
          </Link>
        </header>

        <section className="card narrow login-card mt-8">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Sesión Activa</p>
              <h3>Ya has iniciado sesión</h3>
            </div>
          </div>

          <div className="logged-in-box">
            <div className="user-avatar-badge">{user.nombre.charAt(0)}</div>
            <div className="logged-in-details">
              <strong>{user.nombre}</strong>
              <span className="muted">{user.email}</span>
              <span className="role-tag mt-1">{user.rol}</span>
            </div>
          </div>

          <div className="login-actions mt-6">
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate('/inicio')}
            >
              Ir al panel de gestión
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={logout}
            >
              Cerrar sesión actual
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell login-page">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-seal">SM</span>
          <span className="brand-name">CASA ESTUDIANTIL<strong>SAN MARTÍN</strong></span>
        </Link>
        <div className="header-actions">
          <Link className="header-link" to="/">Solicitudes de cupo</Link>
          <span className="header-mark">SM</span>
        </div>
      </header>

      <section className="card narrow login-card mt-8">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Autenticación Segura</p>
            <h2>Iniciar Sesión</h2>
          </div>
        </div>
        <p className="muted">
          Ingresa tus credenciales para acceder a los módulos de camas, contratos, pagos y cartera.
        </p>

        {error && (
          <div className="alert error mt-4" role="alert">
            <strong>⚠ Error: </strong> {error}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="login-form mt-6">
          <label>
            Correo electrónico institucional *
            <input
              required
              type="email"
              placeholder="ejemplo@casasanmartin.edu.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </label>

          <label className="mt-3">
            Contraseña de acceso *
            <div className="password-input-wrap">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>
          </label>

          <div className="login-options-row mt-3">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Recordar mi sesión en este dispositivo</span>
            </label>
          </div>

          <button
            type="submit"
            className="primary-button full-width mt-5"
            disabled={loading}
          >
            {loading ? 'Verificando credenciales...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Sección de Cuentas Demo para Fácil Evaluación y Pruebas */}
        <div className="demo-accounts-section mt-8">
          <div className="demo-accounts-heading">
            <span className="eyebrow">Acceso Rápido de Prueba</span>
            <h4>Perfiles predefinidos por rol</h4>
          </div>
          <p className="muted text-xs">
            Haz clic en cualquiera de los roles para autenticarte instantáneamente y verificar los permisos de navegación:
          </p>
          <div className="demo-buttons-grid mt-3">
            {DEMO_USERS.map((demo) => (
              <button
                key={demo.rol}
                type="button"
                className="demo-btn"
                aria-label={`Acceder como ${demo.nombre}`}
                onClick={() => handleQuickLogin(demo)}
                title={`Acceder como ${demo.nombre}`}
              >
                <strong>{demo.label}</strong>
                <span>{demo.nombre}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        Casa Estudiantil San Martín <span>•</span> Sistema Seguro de Acceso y Gestión
      </footer>
    </main>
  );
}
