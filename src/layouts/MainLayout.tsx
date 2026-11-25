import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';

const moduleLinks = [
  { to: '/solicitar-cupo', label: 'Solicitudes' },
  { to: '/aspirantes', label: 'Aspirantes' },
  { to: '/lista-espera', label: 'Lista de espera' },
  { to: '/camas', label: 'Camas' },
  { to: '/contratos', label: 'Contratos' },
];

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="main-layout">
      <header className="module-navigation-wrap">
        <nav className="module-navigation" aria-label="Navegación de módulos">
          <Link className="module-brand" to="/" aria-label="Casa Estudiantil, página principal">
            <span className="brand-seal" aria-hidden="true">SM</span>
            <span>Casa Estudiantil</span>
          </Link>
          <div className="module-navigation-links">
            {moduleLinks.map(({ to, label }) => (
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
        </nav>
      </header>
      <div className="main-layout-content">{children}</div>
    </div>
  );
}
