import axios from 'axios';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import type { UserRole } from '../types';
import { AUTH_EXPIRED_EVENT, AUTH_TOKEN_KEY, clearStoredSession, getStoredToken } from './authStorage';
import { AuthContext } from './context';
import type { AuthUser } from './authTypes';

type LoginResponse = {
  access_token?: string;
  accessToken?: string;
  token?: string;
};

const validRoles = new Set<UserRole>([
  'ADMIN_SISTEMA', 'COORDINACION_BIENESTAR', 'ADMIN_FUNDACION', 'MONITORA',
  'TECNICO_MANTENIMIENTO', 'PORTERIA', 'CONTABILIDAD', 'ASPIRANTE_RESIDENTE', 'ACUDIENTE',
]);

function normalizeUser(value: unknown): AuthUser {
  if (!value || typeof value !== 'object') throw new Error('El servidor devolvió un perfil de usuario inválido.');
  const profile = value as Record<string, unknown>;
  const rawRoles = Array.isArray(profile.roles) ? profile.roles : profile.role ? [profile.role] : [];
  const roles = rawRoles.filter((role): role is UserRole => typeof role === 'string' && validRoles.has(role as UserRole));
  if (!roles.length) throw new Error('Tu cuenta no tiene un rol habilitado. Contacta al administrador.');
  const status = typeof profile.estado === 'string' ? profile.estado.toLocaleLowerCase('es') : '';
  const active = profile.activo !== false && profile.active !== false && status !== 'inactivo';
  if (!active) throw new Error('Tu cuenta está inactiva. Contacta al administrador.');
  return {
    id: typeof profile.id === 'string' ? profile.id : undefined,
    nombre: typeof profile.nombre === 'string' ? profile.nombre : undefined,
    nombreCompleto: typeof profile.nombreCompleto === 'string' ? profile.nombreCompleto : undefined,
    correo: typeof profile.correo === 'string' ? profile.correo : undefined,
    roles,
    activo: active,
  };
}

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data as { message?: unknown } | undefined;
    const message = Array.isArray(body?.message) ? body.message.join('. ') : body?.message;
    // El endpoint de login devuelve el mismo 401 para credenciales incorrectas
    // y cuentas inactivas. No afirmes que la cuenta está inactiva sin confirmarlo.
    if (status === 401) return 'Documento, correo o contraseña incorrectos.';
    if (status === 403) return typeof message === 'string' ? message : 'Tu cuenta no tiene permiso para ingresar.';
    if (!error.response) return 'No fue posible conectar con el servidor. Inténtalo de nuevo.';
    if (typeof message === 'string') return message;
  }
  return error instanceof Error ? error.message : 'No fue posible iniciar sesión. Inténtalo de nuevo.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    clearStoredSession();
    setUser(null);
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await apiClient.get('/api/auth/me');
      const profile = data && typeof data === 'object' && 'user' in data ? data.user : data;
      const currentUser = normalizeUser(profile);
      setUser(currentUser);
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    void loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (numeroDocumento: string, password: string) => {
    try {
      const { data } = await apiClient.post<LoginResponse>('/api/auth/login', {
        identificador: numeroDocumento,
        contrasena: password,
      });
      const token = data.access_token ?? data.accessToken ?? data.token;
      if (!token) throw new Error('El servidor no devolvió un token de acceso.');
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      const { data: profileData } = await apiClient.get('/api/auth/me');
      const profile = profileData && typeof profileData === 'object' && 'user' in profileData
        ? profileData.user
        : profileData;
      const currentUser = normalizeUser(profile);
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      clearSession();
      throw new Error(errorMessage(error));
    }
  }, [clearSession]);

  const logout = useCallback(async () => {
    try {
      if (getStoredToken()) await apiClient.post('/api/auth/logout');
    } catch {
      // A failed logout request must not keep a local session active.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(() => ({ user, isLoading, isAuthenticated: Boolean(user), login, logout }), [user, isLoading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

