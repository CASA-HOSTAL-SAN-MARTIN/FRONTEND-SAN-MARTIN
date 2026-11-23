import axios from 'axios';
import type { Asignacion, Cama, Solicitud, SolicitudPayload } from '../types';
import type { Contrato, ContratoPayload } from '../types/contratos';

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
