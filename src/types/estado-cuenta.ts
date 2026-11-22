export type EstadoMora = 'al_dia' | 'pendiente' | 'en_mora' | 'acuerdo_pago' | 'becado';

export type TipoObligacion = 'mensualidad' | 'deposito' | 'danio_inventario' | 'otro';

export type EstadoObligacion = 'pagado' | 'parcial' | 'pendiente' | 'vencido';

export type ObligacionDetalle = {
  id: string;
  concepto: string;
  tipo: TipoObligacion;
  periodo?: string; // Ej: "Febrero 2026"
  fechaEmision: string;
  fechaVencimiento: string;
  montoTotal: number;
  montoPagado: number;
  saldoPendiente: number;
  diasMora: number;
  estado: EstadoObligacion;
  observaciones?: string;
};

export type AbonoRealizado = {
  id: string;
  fecha: string;
  monto: number;
  metodoPago: string;
  referencia: string;
  obligacionId?: string;
  comprobanteUrl?: string | null;
};

export type AcuerdoPago = {
  id: string;
  fechaAcuerdo: string;
  fechaCompromiso: string;
  montoCompromiso: number;
  observaciones: string;
  registradoPor: string;
  cumplido: boolean;
};

export type EstadoCuentaResidente = {
  id: string;
  residenteId: string;
  residenteNombre: string;
  numeroDocumento: string;
  correo?: string;
  telefono?: string;
  habitacion?: string;
  cama?: string;
  esBecado?: boolean;
  estadoMora: EstadoMora;
  totalFacturado: number;
  totalPagado: number;
  saldoTotalPendiente: number;
  montoEnMora: number;
  diasMoraMaximo: number;
  fechaCorte: string;
  obligaciones: ObligacionDetalle[];
  abonosRecientes: AbonoRealizado[];
  acuerdosPago?: AcuerdoPago[];
};

export type ResumenCartera = {
  carteraTotalPendiente: number;
  totalMontoMora: number;
  residentesEnMoraCount: number;
  residentesAlDiaCount: number;
  residentesPendientesCount: number;
  totalResidentes: number;
};
