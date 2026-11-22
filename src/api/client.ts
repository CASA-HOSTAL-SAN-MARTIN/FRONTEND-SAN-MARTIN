import axios from 'axios';
import type {
  Asignacion,
  Aspirante,
  AspirantePayload,
  Cama,
  CreateEntradaListaEsperaPayload,
  EntradaListaEspera,
  Solicitud,
  SolicitudPayload,
  UpdateEntradaListaEsperaPayload,
} from '../types';
import type { Contrato, ContratoPayload } from '../types/contratos';
import type { EstadoPago, Pago, PagoPayload, TipoPago } from '../types/pagos';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

export async function createSolicitud(payload: SolicitudPayload) {
  const { data } = await apiClient.post<Solicitud>('/api/solicitudes', payload);
  return data;
}

export async function getSolicitud(id: string) {
  const { data } = await apiClient.get<Solicitud>(`/api/solicitudes/${encodeURIComponent(id)}`);
  return data;
}

export async function getSolicitudes() {
  const { data } = await apiClient.get<Solicitud[]>('/api/solicitudes');
  return data;
}

export async function getCamas() {
  const { data } = await apiClient.get<Cama[]>('/api/camas');
  return data;
}

export async function createAsignacion(payload: { estudianteId: string; camaId: string }) {
  const { data } = await apiClient.post<Asignacion>('/api/asignaciones', payload);
  return data;
}

function contratoRequestBody(payload: ContratoPayload, documento?: File) {
  if (!documento) return payload;

  const formData = new FormData();
  formData.append('residente', JSON.stringify(payload.residente));
  formData.append('fechaInicio', payload.fechaInicio);
  if (payload.fechaFin) formData.append('fechaFin', payload.fechaFin);
  formData.append('documento', documento);
  return formData;
}

export async function getContratos() {
  const { data } = await apiClient.get<Contrato[] | { data?: Contrato[] }>('/api/contratos');
  if (Array.isArray(data)) return data;
  return Array.isArray(data.data) ? data.data : [];
}

export async function getContrato(id: string) {
  const { data } = await apiClient.get<Contrato>(`/api/contratos/${encodeURIComponent(id)}`);
  return data;
}

export async function createContrato(payload: ContratoPayload, documento?: File) {
  const { data } = await apiClient.post<Contrato>(
    '/api/contratos',
    contratoRequestBody(payload, documento),
  );
  return data;
}

export async function updateContrato(id: string, payload: ContratoPayload, documento?: File) {
  const { data } = await apiClient.put<Contrato>(
    `/api/contratos/${encodeURIComponent(id)}`,
    contratoRequestBody(payload, documento),
  );
  return data;
}

function pagoRequestBody(payload: PagoPayload, comprobante?: File) {
  if (!comprobante) return payload;

  const formData = new FormData();
  formData.append('tipoPago', payload.tipoPago);
  formData.append('residenteNombre', payload.residenteNombre);
  formData.append('numeroDocumento', payload.numeroDocumento);
  if (payload.residenteId) formData.append('residenteId', payload.residenteId);
  if (payload.contratoId) formData.append('contratoId', payload.contratoId);
  formData.append('monto', String(payload.monto));
  formData.append('fechaPago', payload.fechaPago);
  if (payload.periodo) formData.append('periodo', payload.periodo);
  formData.append('metodoPago', payload.metodoPago);
  formData.append('referencia', payload.referencia);
  if (payload.bancoEntidad) formData.append('bancoEntidad', payload.bancoEntidad);
  if (payload.observaciones) formData.append('observaciones', payload.observaciones);
  formData.append('comprobante', comprobante);
  return formData;
}

export async function getPagos(params?: { tipoPago?: TipoPago; estado?: EstadoPago; numeroDocumento?: string }) {
  const { data } = await apiClient.get<Pago[] | { data?: Pago[] }>('/api/pagos', { params });
  if (Array.isArray(data)) return data;
  return Array.isArray(data.data) ? data.data : [];
}

export async function getPago(id: string) {
  const { data } = await apiClient.get<Pago>(`/api/pagos/${encodeURIComponent(id)}`);
  return data;
}

export async function createPago(payload: PagoPayload, comprobante?: File) {
  const { data } = await apiClient.post<Pago>(
    '/api/pagos',
    pagoRequestBody(payload, comprobante),
  );
  return data;
}

export async function verificarPago(id: string, verificadoPor?: string) {
  const { data } = await apiClient.patch<Pago>(
    `/api/pagos/${encodeURIComponent(id)}/verificar`,
    { verificadoPor },
  );
  return data;
}

export async function rechazarPago(id: string, motivo: string, verificadoPor?: string) {
  const { data } = await apiClient.patch<Pago>(
    `/api/pagos/${encodeURIComponent(id)}/rechazar`,
    { motivo, verificadoPor },
  );
  return data;
}

export async function getEstadosCuenta(params?: { estadoMora?: import('../types/estado-cuenta').EstadoMora; search?: string }) {
  const { data } = await apiClient.get<import('../types/estado-cuenta').EstadoCuentaResidente[] | { data?: import('../types/estado-cuenta').EstadoCuentaResidente[] }>('/api/estados-cuenta', { params });
  if (Array.isArray(data)) return data;
  return Array.isArray(data.data) ? data.data : [];
}

export async function getEstadoCuentaByDocumento(numeroDocumento: string) {
  const { data } = await apiClient.get<import('../types/estado-cuenta').EstadoCuentaResidente>(`/api/estados-cuenta/documento/${encodeURIComponent(numeroDocumento)}`);
  return data;
}

export async function getEstadoCuenta(id: string) {
  const { data } = await apiClient.get<import('../types/estado-cuenta').EstadoCuentaResidente>(`/api/estados-cuenta/${encodeURIComponent(id)}`);
  return data;
}

export async function registrarAcuerdoPago(
  residenteId: string,
  payload: { fechaCompromiso: string; montoCompromiso: number; observaciones: string; registradoPor?: string }
) {
  const { data } = await apiClient.post<import('../types/estado-cuenta').AcuerdoPago>(
    `/api/estados-cuenta/${encodeURIComponent(residenteId)}/acuerdos-pago`,
    payload
  );
  return data;
}

export async function getResumenCartera() {
  const { data } = await apiClient.get<import('../types/estado-cuenta').ResumenCartera>('/api/estados-cuenta/resumen-cartera');
  return data;
}

export async function getListaEspera() {
  const { data } = await apiClient.get<EntradaListaEspera[]>('/api/lista-espera');
  return data;
}

export async function getEntradaListaEspera(id: string) {
  const { data } = await apiClient.get<EntradaListaEspera>(`/api/lista-espera/${encodeURIComponent(id)}`);
  return data;
}

export async function createEntradaListaEspera(payload: CreateEntradaListaEsperaPayload) {
  const { data } = await apiClient.post<EntradaListaEspera>('/api/lista-espera', payload);
  return data;
}

export async function updateEntradaListaEspera(id: string, payload: UpdateEntradaListaEsperaPayload) {
  const { data } = await apiClient.patch<EntradaListaEspera>(`/api/lista-espera/${encodeURIComponent(id)}`, payload);
  return data;
}

export async function createAspirante(payload: AspirantePayload) {
  const { data } = await apiClient.post<Aspirante>('/api/aspirantes', payload);
  return data;
}

export async function getAspirante(id: string) {
  const { data } = await apiClient.get<Aspirante>(`/api/aspirantes/${encodeURIComponent(id)}`);
  return data;
}

export async function updateAspirante(id: string, payload: AspirantePayload) {
  const { data } = await apiClient.put<Aspirante>(`/api/aspirantes/${encodeURIComponent(id)}`, payload);
  return data;
}