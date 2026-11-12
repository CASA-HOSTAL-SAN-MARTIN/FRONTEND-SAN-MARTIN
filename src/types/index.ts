export type UserRole =
  | 'ADMIN_SISTEMA'
  | 'COORDINACION_BIENESTAR'
  | 'ADMIN_FUNDACION'
  | 'MONITORA'
  | 'TECNICO_MANTENIMIENTO'
  | 'PORTERIA'
  | 'CONTABILIDAD'
  | 'ASPIRANTE_RESIDENTE'
  | 'ACUDIENTE';

export type SolicitudEstado = 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada' | 'cancelada';

export type SolicitudPayload = {
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  correo: string;
  telefono: string;
  programaAcademico: string;
  universidad: string;
};

export type Solicitud = SolicitudPayload & {
  id: string;
  estado: SolicitudEstado;
  createdAt: string;
  updatedAt: string;
};
