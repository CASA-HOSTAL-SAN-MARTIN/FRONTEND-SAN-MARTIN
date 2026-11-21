export type ResidenteContrato = {
  id?: string;
  nombres: string;
  apellidos: string;
  tipoDocumento?: string;
  numeroDocumento: string;
  correo?: string;
  telefono?: string;
};

export type Contrato = {
  id: string;
  residente?: ResidenteContrato | null;
  estudiante?: ResidenteContrato | null;
  nombres?: string;
  apellidos?: string;
  numeroDocumento?: string;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  valorDeposito?: number | string | null;
  estado?: string | null;
  documentoUrl?: string | null;
  documentoContratoUrl?: string | null;
};

export type ContratoPayload = {
  residente: ResidenteContrato;
  fechaInicio: string;
  fechaFin?: string;
};
