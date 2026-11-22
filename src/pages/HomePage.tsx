import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import type { UserRole } from '../types';

type ModuleCard = {
  title: string;
  description: string;
  path: string;
  icon: string;
  roles: UserRole[];
};

const MODULES: ModuleCard[] = [
  {
    title: 'Solicitudes de Cupo',
    description: 'Registro de aspirantes foráneos y consulta de estado de radicado.',
    path: '/',
    icon: '📝',
    roles: ['ADMIN_SISTEMA', 'COORDINACION_BIENESTAR', 'ADMIN_FUNDACION', 'ASPIRANTE_RESIDENTE'],
  },
  {
    title: 'Control de Camas y Habitaciones',
    description: 'Visualización de pisos, inventario de camas y asignación de cupos.',
    path: '/camas',
    icon: '🛏️',
    roles: ['ADMIN_SISTEMA', 'COORDINACION_BIENESTAR', 'ADMIN_FUNDACION', 'MONITORA'],
  },
  {
    title: 'Gestión de Contratos',
    description: 'Contratos de alojamiento, verificación documental y datos del residente.',
    path: '/contratos',
    icon: '📄',
    roles: ['ADMIN_SISTEMA', 'ADMIN_FUNDACION'],
  },
  {
    title: 'Pagos y Depósitos',
    description: 'Registro de mensualidades, fondos de garantía y soportes bancarios.',
    path: '/pagos',
    icon: '💳',
    roles: ['ADMIN_SISTEMA', 'ADMIN_FUNDACION', 'CONTABILIDAD', 'ASPIRANTE_RESIDENTE', 'ACUDIENTE'],
  },
  {
    title: 'Estado de Cuenta y Mora',
    description: 'Control de cartera, obligaciones causadas, semáforo de mora y acuerdos de pago.',
    path: '/estado-cuenta',
    icon: '📊',
    roles: ['ADMIN_SISTEMA', 'ADMIN_FUNDACION', 'CONTABILIDAD', 'COORDINACION_BIENESTAR', 'ASPIRANTE_RESIDENTE', 'ACUDIENTE'],
  },
];

export function HomePage() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <main className="app-shell home-page">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-seal">SM</span>
          <span className="brand-name">CASA ESTUDIANTIL<strong>SAN MARTÍN</strong></span>
        </Link>
        <div className="header-actions">
          {isAuthenticated && user ? (
            <div className="user-nav-chip">
              <span className="user-nav-name">{user.nombre}</span>
              <span className="role-tag">{user.rol}</span>
              <button
                type="button"
                className="logout-nav-btn"
                onClick={logout}
                title="Cerrar sesión"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <Link className="header-link" to="/login">Iniciar sesión</Link>
          )}
          <span className="header-mark">SM</span>
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow">Bienvenido al Sistema de Gestión</p>
        <h2>Casa Estudiantil San Martín</h2>
        <p>
          {isAuthenticated && user
            ? `Hola, ${user.nombre}. Selecciona uno de los módulos a continuación según tus responsabilidades de ${user.rol}.`
            : 'Plataforma integral para administración, bienestar, monitoría, finanzas y residentes.'}
        </p>
      </section>

      <section className="home-modules-grid">
        {MODULES.map((mod) => {
          const isAllowed = !user || mod.roles.includes(user.rol);
          return (
            <div
              key={mod.path}
              className={`home-module-card ${!isAllowed ? 'module-restricted' : ''}`}
            >
              <div className="module-icon">{mod.icon}</div>
              <h3>{mod.title}</h3>
              <p>{mod.description}</p>
              <div className="module-card-footer">
                {isAllowed ? (
                  <Link to={mod.path} className="primary-button module-link-btn">
                    Acceder al módulo →
                  </Link>
                ) : (
                  <span className="restricted-badge">Acceso restringido a tu rol</span>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <footer className="site-footer">
        Casa Estudiantil San Martín <span>•</span> Pereira, Risaralda <span>•</span> Vinculada a Bienestar Universitario
      </footer>
    </main>
  );
}
