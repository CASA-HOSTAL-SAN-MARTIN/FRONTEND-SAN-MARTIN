import axios from 'axios';
import type { Cama, Solicitud, SolicitudPayload } from '../types';

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
