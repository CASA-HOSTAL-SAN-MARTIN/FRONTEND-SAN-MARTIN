import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { login as apiLogin, logout as apiLogout } from '../api/client';
import type { AuthResponse, LoginCredentials, User, UserRole } from '../types';
import { AuthContext, type AuthContextType } from './authContextDef';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';
const ROLE_KEY = 'userRole';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedUser) return JSON.parse(storedUser) as User;
      const storedRole = localStorage.getItem(ROLE_KEY) as UserRole | null;
      if (storedRole) {
        return {
          id: 'usr-local',
          nombre: 'Usuario Sesión',
          email: 'usuario@casasanmartin.edu.co',
          rol: storedRole,
        };
      }
    } catch {
      return null;
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sincronizar estado si cambian las claves en el storage
  useEffect(() => {
    const handleStorageChange = () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
      } else {
        const storedRole = localStorage.getItem(ROLE_KEY) as UserRole | null;
        if (storedRole) {
          setUser({
            id: 'usr-local',
            nombre: 'Usuario Sesión',
            email: 'usuario@casasanmartin.edu.co',
            rol: storedRole,
          });
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setSession = useCallback((data: AuthResponse) => {
    setToken(data.token);
    setUser(data.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(ROLE_KEY, data.user.rol);
    }
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<User> => {
      setIsLoading(true);
      try {
        const res = await apiLogin(credentials);
        setSession(res);
        return res.user;
      } finally {
        setIsLoading(false);
      }
    },
    [setSession],
  );

  const logout = useCallback(() => {
    void apiLogout();
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ROLE_KEY);
    }
  }, []);

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      const allowed = Array.isArray(roles) ? roles : [roles];
      return allowed.includes(user.rol);
    },
    [user],
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token || user),
      isLoading,
      login,
      logout,
      hasRole,
      setSession,
    }),
    [user, token, isLoading, login, logout, hasRole, setSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
