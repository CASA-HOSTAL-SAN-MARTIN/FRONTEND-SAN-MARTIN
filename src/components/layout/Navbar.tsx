import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types';

type NavItem = {
  to: string;
  label: string;
  requiredRoles?: UserRole[];
};

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Solicitudes' },
  {
    to: '/camas',
    label: 'Camas',
    requiredRoles: ['ADMIN_SISTEMA', 'COORDINACION_BIENESTAR', 'ADMIN_FUNDACION', 'MONITORA'],
  },
  {
    to: '/contratos',
    label: 'Contratos',
    requiredRoles: ['ADMIN_SISTEMA', 'ADMIN_FUNDACION'],
  },
  { to: '/pagos', label: 'Pagos' },
  { to: '/estado-cuenta', label: 'Estado de Cuenta' },
  { to: '/inicio', label: 'Inicio' },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="global-navbar bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand / Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 text-decoration-none group"
            onClick={closeMobileMenu}
          >
            <span className="brand-seal w-9 h-9 rounded-xl bg-blue-700 text-white font-extrabold flex items-center justify-center text-sm shadow-xs transition-transform group-hover:scale-105">
              SM
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase leading-none">
                Casa Estudiantil
              </span>
              <strong className="text-base font-extrabold text-blue-950 tracking-tight leading-tight">
                SAN MARTÍN
              </strong>
            </div>
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => {
              if (item.requiredRoles && user && !item.requiredRoles.includes(user.rol)) {
                return null;
              }
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-xs lg:text-sm font-bold transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                        : 'text-slate-600 hover:text-blue-900 hover:bg-slate-50'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Sección de Usuario / Autenticación */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-full">
                <div
                  className="w-7 h-7 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center"
                  aria-hidden="true"
                >
                  {user.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight max-w-[120px] truncate">
                    {user.nombre}
                  </span>
                  <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider leading-none">
                    {user.rol}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="ml-1 text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border-0 px-2 py-1 rounded-full cursor-pointer transition-colors"
                  title="Cerrar sesión"
                >
                  Salir
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-xs lg:text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-xs"
              >
                Iniciar sesión
              </Link>
            )}
          </div>

          {/* Botón Menú Móvil */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-0 cursor-pointer"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
            >
              <span className="text-xl" aria-hidden="true">
                {mobileMenuOpen ? '✕' : '☰'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil Desplegable */}
      {mobileMenuOpen && (
        <nav
          className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 flex flex-col gap-1 shadow-lg"
          aria-label="Menú móvil"
        >
          {NAV_ITEMS.map((item) => {
            if (item.requiredRoles && user && !item.requiredRoles.includes(user.rol)) {
              return null;
            }
            return (
              <NavLink
                key={`mobile-${item.to}`}
                to={item.to}
                end={item.to === '/'}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-bold block ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            );
          })}

          <div className="border-t border-slate-200 mt-3 pt-3">
            {isAuthenticated && user ? (
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">{user.nombre}</span>
                  <span className="text-xs text-blue-700 font-semibold">{user.rol}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 rounded-lg border-0 cursor-pointer"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="w-full text-center py-2 text-sm font-bold text-white bg-blue-700 rounded-lg block"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
