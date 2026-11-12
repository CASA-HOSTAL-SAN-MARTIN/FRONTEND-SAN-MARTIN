import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSolicitud, getSolicitud, getSolicitudes } from '../../src/api/client';
import { SolicitudesPage } from '../../src/pages/SolicitudesPage';

vi.mock('../../src/api/client', () => ({
  createSolicitud: vi.fn(),
  getSolicitud: vi.fn(),
  getSolicitudes: vi.fn(),
}));

const createdSolicitud = {
  id: 'a7d6c3e1-2db0-4dc5-9cc3-123456789abc',
  nombres: 'María',
  apellidos: 'Gómez',
  numeroDocumento: 'CC-123456789',
  correo: 'maria@example.com',
  telefono: '3001234567',
  programaAcademico: 'Ingeniería de Sistemas',
  universidad: 'Universidad del Otún',
  estado: 'pendiente' as const,
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:00:00.000Z',
};

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('Nombres *'), { target: { value: 'María' } });
  fireEvent.change(screen.getByLabelText('Apellidos *'), { target: { value: 'Gómez' } });
  fireEvent.change(screen.getByLabelText('Número de documento *'), { target: { value: 'CC-123456789' } });
  fireEvent.change(screen.getByLabelText('Correo electrónico *'), { target: { value: 'maria@example.com' } });
  fireEvent.change(screen.getByLabelText('Teléfono *'), { target: { value: '3001234567' } });
  fireEvent.change(screen.getByLabelText('Programa académico *'), { target: { value: 'Ingeniería de Sistemas' } });
  fireEvent.change(screen.getByLabelText('Universidad *'), { target: { value: 'Universidad del Otún' } });
}

describe('Solicitud de cupo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(createSolicitud).mockResolvedValue(createdSolicitud);
  });

  it('marca como obligatorios los campos definidos por la API', () => {
    render(<SolicitudesPage />);

    expect(screen.getByLabelText('Nombres *')).toBeRequired();
    expect(screen.getByLabelText('Apellidos *')).toBeRequired();
    expect(screen.getByLabelText('Número de documento *')).toBeRequired();
    expect(screen.getByLabelText('Correo electrónico *')).toBeRequired();
    expect(screen.getByLabelText('Teléfono *')).toBeRequired();
    expect(screen.getByLabelText('Programa académico *')).toBeRequired();
    expect(screen.getByLabelText('Universidad *')).toBeRequired();
  });

  it('envía la solicitud y muestra el radicado devuelto por la API', async () => {
    render(<SolicitudesPage />);
    fillRequiredFields();
    fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitud' }).closest('form')!);

    await waitFor(() => expect(createSolicitud).toHaveBeenCalledWith({
      nombres: 'María',
      apellidos: 'Gómez',
      numeroDocumento: 'CC-123456789',
      correo: 'maria@example.com',
      telefono: '3001234567',
      programaAcademico: 'Ingeniería de Sistemas',
      universidad: 'Universidad del Otún',
    }));
    expect(await screen.findByText('¡Solicitud recibida!')).toBeInTheDocument();
    expect(screen.getByText(createdSolicitud.id)).toBeInTheDocument();
  });

  it('consulta y muestra el estado mediante el identificador', async () => {
    vi.mocked(getSolicitud).mockResolvedValue(createdSolicitud);
    render(<SolicitudesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Consultar estado' }));
    fireEvent.change(screen.getByLabelText('Identificador de solicitud *'), { target: { value: createdSolicitud.id } });
    fireEvent.submit(screen.getByLabelText('Identificador de solicitud *').closest('form')!);

    await waitFor(() => expect(getSolicitud).toHaveBeenCalledWith(createdSolicitud.id));
    expect(await screen.findByText('Pendiente')).toBeInTheDocument();
  });

  it('muestra errores devueltos por la API', async () => {
    vi.mocked(createSolicitud).mockRejectedValue({
      response: { data: { message: 'Ya existe una solicitud registrada' } },
      isAxiosError: true,
    });
    render(<SolicitudesPage />);
    fillRequiredFields();
    fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitud' }).closest('form')!);

    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe una solicitud registrada');
  });

  it('restringe el listado general a roles autorizados', () => {
    localStorage.setItem('userRole', 'ASPIRANTE_RESIDENTE');
    render(<SolicitudesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Panel autorizado' }));

    expect(screen.getByText('Acceso restringido')).toBeInTheDocument();
    expect(getSolicitudes).not.toHaveBeenCalled();
  });
});
