import type { UserRole } from '../types';

export const roleAccess = {
  admin: ['ADMIN_SISTEMA', 'COORDINACION_BIENESTAR', 'ADMIN_FUNDACION'] satisfies UserRole[],
  reception: ['MONITORA', 'PORTERIA'] satisfies UserRole[],
  residents: ['ASPIRANTE_RESIDENTE', 'ACUDIENTE'] satisfies UserRole[],
  beds: ['ADMIN_SISTEMA', 'COORDINACION_BIENESTAR', 'ADMIN_FUNDACION', 'MONITORA', 'PORTERIA', 'TECNICO_MANTENIMIENTO'] satisfies UserRole[],
  aspirants: ['ADMIN_SISTEMA', 'COORDINACION_BIENESTAR', 'ADMIN_FUNDACION'] satisfies UserRole[],
  waitlist: ['ADMIN_SISTEMA', 'COORDINACION_BIENESTAR', 'ADMIN_FUNDACION', 'MONITORA'] satisfies UserRole[],
  contracts: ['ADMIN_SISTEMA', 'ADMIN_FUNDACION', 'CONTABILIDAD'] satisfies UserRole[],
  solicitudes: ['ADMIN_SISTEMA', 'COORDINACION_BIENESTAR'] satisfies UserRole[],
} as const;

export function defaultPathForRole(roles: UserRole[]) {
  if (roles.includes('ASPIRANTE_RESIDENTE')) return '/mi-solicitud';
  if (roles.some((role) => roleAccess.solicitudes.some((staffRole) => staffRole === role))) return '/solicitudes';
  if (roles.some((role) => roleAccess.admin.some((adminRole) => adminRole === role))) return '/aspirantes';
  if (roles.includes('CONTABILIDAD')) return '/contratos';
  if (roles.some((role) => roleAccess.beds.some((bedRole) => bedRole === role))) return '/camas';
  return '/panel';
}
