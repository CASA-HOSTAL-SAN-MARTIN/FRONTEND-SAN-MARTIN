import axios from 'axios';
import { expireStoredSession, getStoredToken } from '../auth/authStorage';
import type {
  Aspirante,
  AspirantePayload,
  Asignacion,
  Cama,
  EntradaListaEspera,
  Solicitud,
  SolicitudPayload,
  SolicitudEstado,
} from '../types';
import type { Contrato, ContratoPayload } from '../types/contratos';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && getStoredToken()) {
      expireStoredSession();
    }
    return Promise.reject(error);
  },
);

export async function createSolicitud(payload: SolicitudPayload) {
  const { data } = await apiClient.post<Solicitud & { accountSetupEmailSent: boolean }>('/api/solicitudes', payload);
  return data;
}

export async function getMySolicitud() {
  const { data } = await apiClient.get<Solicitud>('/api/solicitudes/mia');
  return data;
}

export async function getSolicitudes() {
  const { data } = await apiClient.get<Solicitud[]>('/api/solicitudes');
  return data;
}

export async function updateSolicitudEstado(id: string, estado: SolicitudEstado) {
  const { data } = await apiClient.patch<Solicitud>(
    `/api/solicitudes/${encodeURIComponent(id)}/estado`,
    { estado },
  );
  return data;
}

export async function requestPasswordRecovery(identificador: string) {
  const { data } = await apiClient.post<{ message: string }>('/api/auth/password/recovery', { identificador });
  return data;
}

export async function setPassword(token: string, contrasena: string) {
  const { data } = await apiClient.post<{ message: string }>('/api/auth/password/setup', { token, contrasena });
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
  const { data } = await apiClient.post<Contrato>('/api/contratos', contratoRequestBody(payload, documento));
  return data;
}

export async function updateContrato(id: string, payload: ContratoPayload, documento?: File) {
  const { data } = await apiClient.put<Contrato>(
    `/api/contratos/${encodeURIComponent(id)}`,
    contratoRequestBody(payload, documento),
  );
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
  const { data } = await apiClient.patch<Aspirante>(
    `/api/aspirantes/${encodeURIComponent(id)}`,
    payload,
  );
  return data;
}

export async function getListaEspera() {
  const { data } = await apiClient.get<EntradaListaEspera[]>('/api/lista-espera');
  return data;
}

export async function createEntradaListaEspera(payload: Partial<EntradaListaEspera>) {
  const { data } = await apiClient.post<EntradaListaEspera>('/api/lista-espera', payload);
  return data;
}

export async function updateEntradaListaEspera(id: string, payload: Partial<EntradaListaEspera>) {
  const { data } = await apiClient.patch<EntradaListaEspera>(
    `/api/lista-espera/${encodeURIComponent(id)}`,
    payload,
  );
  return data;
}
