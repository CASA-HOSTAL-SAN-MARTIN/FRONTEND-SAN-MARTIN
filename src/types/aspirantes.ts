export type AspirantePayload = {
  nombreCompleto: string;
  numDoc: string;
  programa: string;
  promedio: number;
  edad: number;
};

export type AspiranteSocioeconomico = {
  estrato?: number | string;
  ciudadOrigen?: string;
  ingresosFamiliares?: string;
  tieneBeca?: boolean;
  observaciones?: string;
};

export type Aspirante = AspirantePayload & {
  id: string;
  esMenorDeEdad: boolean;
  socioeconomico?: AspiranteSocioeconomico;
  createdAt?: string;
  updatedAt?: string;
};

export type AspiranteAuditEntry = {
  id: string;
  timestamp: string;
  usuario?: string;
  campo: string;
  valorAnterior: string | number;
  valorNuevo: string | number;
};
