import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { roleAccess } from '../auth/roleAccess';
import type { UserRole } from '../types';

const modules: { to: string; title: string; description: string; roles: readonly UserRole[] }[] = [
  { to: '/mi-solicitud', title: 'Mi solicitud', description: 'Consulta el estado y los datos de tu solicitud de cupo.', roles: roleAccess.residents },
  { to: '/solicitudes', title: 'Solicitudes de cupo', description: 'Revisa las solicitudes y actualiza su estado.', roles: roleAccess.solicitudes },
  { to: '/aspirantes', title: 'Aspirantes', description: 'Registrar y revisar información de aspirantes.', roles: roleAccess.aspirants },
  { to: '/lista-espera', title: 'Lista de espera', description: 'Consultar y gestionar aspirantes en espera.', roles: roleAccess.waitlist },
  { to: '/camas', title: 'Camas', description: 'Consultar ocupación y realizar asignaciones permitidas.', roles: roleAccess.beds },
  { to: '/contratos', title: 'Contratos', description: 'Consultar y administrar contratos y residentes.', roles: roleAccess.contracts },
];

export function RoleDashboard() {
  const { user } = useAuth();
  const availableModules = modules.filter((module) => module.roles.some((role) => user?.roles.includes(role)));
  const displayName = user?.nombreCompleto ?? user?.nombre ?? 'Usuario';

  return (
    <main className="app-shell role-dashboard">
      <section className="card" aria-labelledby="dashboard-title">
        <p className="eyebrow">Panel de acceso</p>
        <h1 id="dashboard-title">Hola, {displayName}</h1>
        <p className="muted">Accede a los módulos habilitados para tu cuenta.</p>
      </section>
      {availableModules.length ? (
        <section className="role-module-grid" aria-label="Módulos disponibles">
          {availableModules.map((module) => (
            <Link className="role-module-card" key={module.to} to={module.to}>
              <h2>{module.title}</h2>
              <p>{module.description}</p>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </section>
      ) : (
        <section className="card" role="status">
          <h2>Tu cuenta está activa</h2>
          <p className="muted">Los servicios de residente todavía no están disponibles en esta plataforma.</p>
          <Link className="header-link" to="/solicitar-cupo">Consultar estado de solicitud</Link>
        </section>
      )}
    </main>
  );
}
