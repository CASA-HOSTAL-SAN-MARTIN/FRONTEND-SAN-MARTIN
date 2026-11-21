import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCamas } from '../../src/api/client';
import { CamasPage } from '../../src/pages/CamasPage';

vi.mock('../../src/api/client', () => ({
  getCamas: vi.fn(),
}));

const camas = [
  { id: 'bed-1', piso: 1, habitacion: '101', numero: 'A', estado: 'disponible' as const },
  { id: 'bed-2', piso: 1, habitacion: '101', numero: 'B', estado: 'ocupada' as const },
  { id: 'bed-3', piso: 2, habitacion: '201', numero: 'A', estado: 'bloqueada' as const, motivoBloqueo: 'Mantenimiento eléctrico' },
];

function renderPage() {
  return render(<MemoryRouter><CamasPage /></MemoryRouter>);
}

describe('Tablero de estado de camas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCamas).mockResolvedValue(camas);
  });

  it('muestra la leyenda y diferencia los estados de las camas', async () => {
    renderPage();

    expect(await screen.findByText('Habitación 101')).toBeInTheDocument();
    expect(screen.getAllByText('Disponible').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ocupada').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bloqueada').length).toBeGreaterThan(0);
    expect(screen.getByText('Motivo: Mantenimiento eléctrico')).toBeInTheDocument();
  });

  it('filtra las habitaciones por piso', async () => {
    renderPage();
    await screen.findByText('Habitación 101');

    fireEvent.change(screen.getByLabelText('Filtrar por piso'), { target: { value: '2' } });

    expect(screen.queryByText('Habitación 101')).not.toBeInTheDocument();
    expect(screen.getByText('Habitación 201')).toBeInTheDocument();
  });

  it('actualiza los datos sin recargar la aplicación', async () => {
    renderPage();
    await screen.findByText('Habitación 101');

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));

    await waitFor(() => expect(getCamas).toHaveBeenCalledTimes(2));
  });

  it('muestra el estado de carga y los errores de la API', async () => {
    let resolveRequest!: (value: typeof camas) => void;
    vi.mocked(getCamas).mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));
    renderPage();
    expect(screen.getByText('Cargando estado de camas...')).toBeInTheDocument();
    resolveRequest(camas);
    await screen.findByText('Habitación 101');

    vi.mocked(getCamas).mockRejectedValueOnce(new Error('API unavailable'));
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible consultar el estado de las camas');
  });

  it('muestra un mensaje cuando no hay resultados para el filtro', async () => {
    renderPage();
    await screen.findByText('Habitación 101');
    fireEvent.change(screen.getByLabelText('Filtrar por piso'), { target: { value: '3' } });

    expect(screen.getByText('No hay camas para mostrar')).toBeInTheDocument();
  });
});
