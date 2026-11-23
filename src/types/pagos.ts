export type TipoPago = 'mensualidad' | 'deposito';

export type MetodoPago = 'transferencia' | 'consignacion' | 'efectivo' | 'nequi' | 'daviplata';

export type EstadoPago = 'pendiente' | 'verificado' | 'rechazado';

export type PagoPayload = {
  tipoPago: TipoPago;
  residenteNombre: string;
  numeroDocumento: string;
  residenteId?: string;
  contratoId?: string;
  monto: number;
  fechaPago: string; // YYYY-MM-DD
  periodo?: string; // Ej: "Febrero 2026" o "2026-02"
  metodoPago: MetodoPago;
  referencia: string;
  bancoEntidad?: string;
  observaciones?: string;
};

export type Pago = PagoPayload & {
  id: string;
  estado: EstadoPago;
  comprobanteUrl?: string | null;
  comprobanteNombre?: string | null;
  registradoPor?: string | null;
  verificadoPor?: string | null;
  fechaRegistro: string;
  fechaVerificacion?: string | null;
  motivoRechazo?: string | null;
};

export type ResumenPagos = {
  totalRecaudado: number;
  totalDepositos: number;
  totalMensualidades: number;
  pendientesVerificacion: number;
  verificados: number;
  rechazados: number;
};
