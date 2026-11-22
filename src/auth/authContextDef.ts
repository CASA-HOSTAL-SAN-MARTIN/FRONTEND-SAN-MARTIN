import { createContext } from 'react';
import type { AuthResponse, LoginCredentials, User, UserRole } from '../types';

export type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  setSession: (data: AuthResponse) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
