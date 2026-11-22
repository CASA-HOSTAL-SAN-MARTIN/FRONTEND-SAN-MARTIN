export type EstadoListaEspera = 'pendiente' | 'asignado' | 'retirado';

export type DetalleAspiranteEnEspera = {
  nombreCompleto?: string;
  numDoc?: string;
  programa?: string;
  promedio?: number;
  edad?: number;
  esMenorDeEdad?: boolean;
  ciudadOrigen?: string;
  vulnerabilidad?: string;
  tieneBeca?: boolean;
};

export type EntradaListaEspera = {
  id: string;
  aspiranteId: string;
  estado: EstadoListaEspera;
  createdAt: string;
  updatedAt: string;
  aspirante?: DetalleAspiranteEnEspera;
};

export type CreateEntradaListaEsperaPayload = {
  aspiranteId: string;
};

export type UpdateEntradaListaEsperaPayload = {
  estado: EstadoListaEspera;
};
