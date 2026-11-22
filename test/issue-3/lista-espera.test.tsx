import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEntradaListaEspera, getListaEspera, updateEntradaListaEspera } from '../../src/api/client';
import { ListaEsperaPage } from '../../src/pages/ListaEsperaPage';
import type { EntradaListaEspera } from '../../src/types';

vi.mock('../../src/api/client', () => ({
  getListaEspera: vi.fn(),
  getEntradaListaEspera: vi.fn(),
  createEntradaListaEspera: vi.fn(),
  updateEntradaListaEspera: vi.fn(),
}));

const mockEntries: EntradaListaEspera[] = [
  {
    id: 'entry-1',
    aspiranteId: 'asp-1111-uuid',
    estado: 'pendiente',
    createdAt: '2026-02-01T08:00:00.000Z',
    updatedAt: '2026-02-01T08:00:00.000Z',
    aspirante: {
      nombreCompleto: 'Ana María Gómez',
      numDoc: 'CC-100200300',
      programa: 'Medicina',
      vulnerabilidad: 'Foránea con bajos recursos',
    },
  },
  {
    id: 'entry-2',
    aspiranteId: 'asp-2222-uuid',
    estado: 'pendiente',
    createdAt: '2026-02-02T09:30:00.000Z',
    updatedAt: '2026-02-02T09:30:00.000Z',
    aspirante: {
      nombreCompleto: 'Carlos Eduardo Restrepo',
      numDoc: 'CC-400500600',
      programa: 'Ingeniería de Sistemas',
      tieneBeca: true,
    },
  },
  {
    id: 'entry-3',
    aspiranteId: 'asp-3333-uuid',
    estado: 'asignado',
    createdAt: '2026-02-03T11:00:00.000Z',
    updatedAt: '2026-02-04T12:00:00.000Z',
    aspirante: {
      nombreCompleto: 'Daniela Morales',
      numDoc: 'CC-700800900',
      programa: 'Derecho',
    },
  },
  {
    id: 'entry-4',
    aspiranteId: 'asp-4444-uuid',
    estado: 'retirado',
    createdAt: '2026-02-04T14:15:00.000Z',
    updatedAt: '2026-02-05T10:00:00.000Z',
    aspirante: {
      nombreCompleto: 'Esteban Valencia',
      numDoc: 'CC-111222333',
      programa: 'Psicología',
    },
  },
  {
    id: 'entry-5',
    aspiranteId: 'asp-5555-uuid',
    estado: 'pendiente',
    createdAt: '2026-02-05T16:00:00.000Z',
    updatedAt: '2026-02-05T16:00:00.000Z',
    aspirante: {
      nombreCompleto: 'Felipe Henao',
      numDoc: 'CC-444555666',
      programa: 'Agronomía',
    },
  },
  {
    id: 'entry-6',
    aspiranteId: 'asp-6666-uuid',
    estado: 'pendiente',
    createdAt: '2026-02-06T18:00:00.000Z',
    updatedAt: '2026-02-06T18:00:00.000Z',
    aspirante: {
      nombreCompleto: 'Gloria Rendón',
      numDoc: 'CC-777888999',
      programa: 'Contaduría',
    },
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ListaEsperaPage />
    </MemoryRouter>,
  );
}

describe('Issue 3 - Interfaz de Gestión de Lista de Espera Unificada', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('userRole', 'COORDINACION_BIENESTAR');
    vi.mocked(getListaEspera).mockResolvedValue(mockEntries);
    vi.mocked(updateEntradaListaEspera).mockImplementation(async (id, payload) => {
      const match = mockEntries.find((m) => m.id === id);
      return {
        id,
        aspiranteId: match?.aspiranteId ?? 'mock-asp',
        estado: payload.estado,
        createdAt: match?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        aspirante: match?.aspirante,
      };
    });
    vi.mocked(createEntradaListaEspera).mockResolvedValue({
      id: 'entry-new',
      aspiranteId: 'asp-7777-uuid',
      estado: 'pendiente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('consulta y muestra la lista de espera unificada en orden cronológico', async () => {
    renderPage();

    await waitFor(() => expect(getListaEspera).toHaveBeenCalled());
    expect(await screen.findByText('Ana María Gómez')).toBeInTheDocument();
    expect(screen.getByText('Carlos Eduardo Restrepo')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('permite filtrar por estado (pendiente, asignado, retirado)', async () => {
    renderPage();
    await screen.findByText('Ana María Gómez');

    const selectStatus = screen.getByLabelText(/Filtro por estado/i);

    // Filtrar solo asignados
    fireEvent.change(selectStatus, { target: { value: 'asignado' } });
    expect(screen.getByText('Daniela Morales')).toBeInTheDocument();
    expect(screen.queryByText('Ana María Gómez')).not.toBeInTheDocument();

    // Filtrar solo retirados
    fireEvent.change(selectStatus, { target: { value: 'retirado' } });
    expect(screen.getByText('Esteban Valencia')).toBeInTheDocument();
    expect(screen.queryByText('Daniela Morales')).not.toBeInTheDocument();
  });

  it('filtra por casos vulnerables o con beca', async () => {
    renderPage();
    await screen.findByText('Ana María Gómez');

    const checkboxVulnerable = screen.getByLabelText(/Solo casos vulnerables o con beca/i);
    fireEvent.click(checkboxVulnerable);

    expect(screen.getByText('Ana María Gómez')).toBeInTheDocument(); // Tiene vulnerabilidad
    expect(screen.getByText('Carlos Eduardo Restrepo')).toBeInTheDocument(); // Tiene beca
    expect(screen.queryByText('Felipe Henao')).not.toBeInTheDocument(); // No tiene marca
  });

  it('soporta paginación de resultados cuando se supera el tamaño de página', async () => {
    renderPage();
    await screen.findByText('Ana María Gómez');

    // Con 6 entradas y pageSize=5, deben haber 2 páginas
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('Ana María Gómez')).toBeInTheDocument();
    expect(screen.queryByText('Gloria Rendón')).not.toBeInTheDocument(); // Está en página 2

    // Avanzar a la siguiente página
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(screen.getByText('Gloria Rendón')).toBeInTheDocument();
    expect(screen.queryByText('Ana María Gómez')).not.toBeInTheDocument();
  });

  it('solicita confirmación modal antes de cambiar el estado de un aspirante', async () => {
    renderPage();
    await screen.findByText('Ana María Gómez');

    // Intentar marcar a Ana María como "Asignar"
    const assignButtons = screen.getAllByRole('button', { name: 'Asignar' });
    fireEvent.click(assignButtons[0]);

    // Verifica que se abre el modal de confirmación
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Confirmar cambio de estado')).toBeInTheDocument();
    expect(updateEntradaListaEspera).not.toHaveBeenCalled();

    // Si cancela, el modal se cierra y no llama a la API
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(updateEntradaListaEspera).not.toHaveBeenCalled();
  });

  it('confirma y actualiza el estado mediante PATCH /api/lista-espera/:id', async () => {
    renderPage();
    await screen.findByText('Ana María Gómez');

    const assignButtons = screen.getAllByRole('button', { name: 'Asignar' });
    fireEvent.click(assignButtons[0]);

    // Confirmar en el modal
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cambio' }));

    await waitFor(() => {
      expect(updateEntradaListaEspera).toHaveBeenCalledWith('entry-1', {
        estado: 'asignado',
      });
    });

    expect(await screen.findByText(/Estado del aspirante actualizado/i)).toBeInTheDocument();
  });

  it('permite incorporar un nuevo aspirante a la lista mediante POST', async () => {
    renderPage();
    await screen.findByText('Ana María Gómez');

    fireEvent.click(screen.getByRole('button', { name: /\+ Incorporar aspirante/i }));
    fireEvent.change(screen.getByLabelText(/Identificador del aspirante \(UUID\) \*/i), {
      target: { value: 'asp-7777-uuid' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar en espera' }));

    await waitFor(() => {
      expect(createEntradaListaEspera).toHaveBeenCalledWith({
        aspiranteId: 'asp-7777-uuid',
      });
    });

    expect(await screen.findByText(/incorporado exitosamente a la lista de espera/i)).toBeInTheDocument();
  });

  it('protege los datos sensibles y restringe acciones de gestión a roles no autorizados', async () => {
    localStorage.setItem('userRole', 'ASPIRANTE_RESIDENTE');
    renderPage();
    await screen.findByText('Ana María Gómez');

    // No debe mostrar números de documento sensibles
    expect(screen.queryByText('CC-100200300')).not.toBeInTheDocument();
    expect(screen.getAllByText('*** Protegido ***').length).toBeGreaterThan(0);

    // No debe mostrar botones de gestión ni de cambio de estado
    expect(screen.queryByRole('button', { name: /\+ Incorporar aspirante/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Asignar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retirar' })).not.toBeInTheDocument();
  });

  it('muestra errores de la API claramente, como cuando el aspirante ya pertenece a la lista', async () => {
    vi.mocked(createEntradaListaEspera).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: { message: 'El aspirante ya pertenece a la lista de espera' },
      },
    });

    renderPage();
    await screen.findByText('Ana María Gómez');

    fireEvent.click(screen.getByRole('button', { name: /\+ Incorporar aspirante/i }));
    fireEvent.change(screen.getByLabelText(/Identificador del aspirante \(UUID\) \*/i), {
      target: { value: 'asp-1111-uuid' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar en espera' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El aspirante ya pertenece a la lista de espera',
    );
  });
});
