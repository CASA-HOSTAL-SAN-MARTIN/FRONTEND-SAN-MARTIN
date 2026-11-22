import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import type { UserRole } from '../types';

export type ProtectedRouteProps = {
  isAuthenticated?: boolean;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  children: ReactNode;
};

export function ProtectedRoute({
  isAuthenticated: propIsAuthenticated,
  allowedRoles,
  redirectTo = '/login',
  children,
}: ProtectedRouteProps) {
  const location = useLocation();

  // Obtener auth de contexto o fallback a localStorage
  let authContextState: { isAuthenticated: boolean; userRole: UserRole | null } = {
    isAuthenticated: false,
    userRole: null,
  };

  try {
    const auth = useAuth();
    authContextState = {
      isAuthenticated: auth.isAuthenticated,
      userRole: auth.user?.rol ?? null,
    };
  } catch {
    // Si se renderiza fuera de AuthProvider (por ejemplo en tests unitarios simples)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      const role = localStorage.getItem('userRole') as UserRole | null;
      authContextState = {
        isAuthenticated: Boolean(token || role),
        userRole: role,
      };
    }
  }

  const authenticated = propIsAuthenticated !== undefined ? propIsAuthenticated : authContextState.isAuthenticated;
  const userRole = authContextState.userRole;

  if (!authenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const isAuthorized = userRole !== null && allowedRoles.includes(userRole);
    if (!isAuthorized) {
      return (
        <main className="app-shell auth-denied-page">
          <header className="topbar">
            <Link className="brand" to="/">
              <span className="brand-seal">SM</span>
              <span className="brand-name">CASA ESTUDIANTIL<strong>SAN MARTÍN</strong></span>
            </Link>
          </header>
          <section className="card narrow auth-denied-card" role="alert">
            <div className="auth-denied-icon">🚫</div>
            <p className="eyebrow text-red-600">Acceso no autorizado</p>
            <h3>Acceso restringido por rol</h3>
            <p className="muted mt-2">
              Tu perfil actual (<strong>{userRole ?? 'Sin rol asignado'}</strong>) no cuenta con los permisos necesarios para acceder a este módulo.
            </p>
            <div className="auth-denied-actions mt-6">
              <Link to="/inicio" className="primary-button">
                Ir al inicio
              </Link>
              <Link to="/" className="secondary-button">
                Solicitudes
              </Link>
            </div>
          </section>
        </main>
      );
    }
  }

  return <>{children}</>;
}
