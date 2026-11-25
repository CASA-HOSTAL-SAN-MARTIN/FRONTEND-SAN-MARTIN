import type { UserRole } from '../types';

export type AuthUser = {
  id?: string;
  nombre?: string;
  nombreCompleto?: string;
  correo?: string;
  roles: UserRole[];
  activo: boolean;
};

export type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (numeroDocumento: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};
