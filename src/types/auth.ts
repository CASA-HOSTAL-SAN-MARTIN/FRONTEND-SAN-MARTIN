import type { UserRole } from './index';

export type User = {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  documento?: string;
  avatarUrl?: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type AuthResponse = {
  token: string;
  user: User;
  expiresIn?: number;
};
