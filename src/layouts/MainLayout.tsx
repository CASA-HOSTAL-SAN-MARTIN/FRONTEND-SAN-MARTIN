import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { roleAccess } from '../auth/roleAccess';

const moduleLinks = [
  { to: '/solicitar-cupo', label: 'Solicitudes' },
  { to: '/aspirantes', label: 'Aspirantes', roles: roleAccess.aspirants },
  { to: '/lista-espera', label: 'Lista de espera', roles: roleAccess.waitlist },
  { to: '/camas', label: 'Camas', roles: roleAccess.beds },
  { to: '/contratos', label: 'Contratos', roles: roleAccess.contracts },
];

export function MainLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const visibleLinks = moduleLinks.filter((item) => !item.roles || item.roles.some((role) => user?.roles.includes(role)));

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="main-layout">
      <header className="module-navigation-wrap">
        <nav className="module-navigation" aria-label="Navegación de módulos">
          <Link className="module-brand" to="/" aria-label="Casa Estudiantil, página principal">
            <span className="brand-seal" aria-hidden="true">SM</span>
            <span>Casa Estudiantil</span>
          </Link>
          <div className="module-navigation-links">
            {visibleLinks.map(({ to, label }) => (
              <NavLink
                className={({ isActive }) => isActive ? 'module-link active' : 'module-link'}
                end
                key={to}
                to={to}
              >
                {label}
              </NavLink>
            ))}
          </div>
          <button className="module-logout" disabled={loggingOut} onClick={() => void handleLogout()} type="button">
            {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
          </button>
        </nav>
      </header>
      <div className="main-layout-content">{children}</div>
    </div>
  );
}
