import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAsignacion, getCamas } from '../../src/api/client';
import { CamasPage } from '../../src/pages/CamasPage';

vi.mock('../../src/api/client', () => ({
  createAsignacion: vi.fn(),
  getCamas: vi.fn(),
}));

const camas = [
  { id: 'bed-available', piso: 1, habitacion: '101', numero: 'A', estado: 'disponible' as const },
  { id: 'bed-occupied', piso: 1, habitacion: '101', numero: 'B', estado: 'ocupada' as const },
];

function renderPage() {
  return render(<MemoryRouter><CamasPage /></MemoryRouter>);
}

describe('Asignación de camas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('userRole', 'ADMIN_SISTEMA');
    vi.mocked(getCamas).mockResolvedValue(camas);
    vi.mocked(createAsignacion).mockResolvedValue({
      id: 'assignment-1',
      estudianteId: 'student-123',
      camaId: 'bed-available',
      realizadoPor: 'Coordinación de bienestar',
    });
  });

  it('ofrece únicamente camas disponibles', async () => {
    renderPage();
    const select = await screen.findByLabelText('Cama disponible *');

    expect(select).toHaveTextContent('Cama A');
    expect(select).not.toHaveTextContent('Cama B');
  });

  it('solicita confirmación antes de enviar la asignación', async () => {
    renderPage();
    await screen.findByLabelText('Cama disponible *');
    fireEvent.change(screen.getByLabelText('Identificador del estudiante *'), { target: { value: 'student-123' } });
    fireEvent.change(screen.getByLabelText('Cama disponible *'), { target: { value: 'bed-available' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar asignación' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(createAsignacion).not.toHaveBeenCalled();
  });

  it('confirma, actualiza la cama y muestra quién realizó la asignación', async () => {
    renderPage();
    await screen.findByLabelText('Cama disponible *');
    fireEvent.change(screen.getByLabelText('Identificador del estudiante *'), { target: { value: 'student-123' } });
    fireEvent.change(screen.getByLabelText('Cama disponible *'), { target: { value: 'bed-available' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar asignación' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar asignación' }));

    await waitFor(() => expect(createAsignacion).toHaveBeenCalledWith({
      estudianteId: 'student-123',
      camaId: 'bed-available',
    }));
    expect(await screen.findByRole('status')).toHaveTextContent('Asignación confirmada');
    expect(screen.getByRole('status')).toHaveTextContent('Coordinación de bienestar');
    expect(screen.getByLabelText('Cama disponible *')).not.toHaveTextContent('Cama A');
  });

  it('muestra el conflicto y no presenta la operación como exitosa', async () => {
    vi.mocked(createAsignacion).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'La cama ya no está disponible' } },
    });
    renderPage();
    await screen.findByLabelText('Cama disponible *');
    fireEvent.change(screen.getByLabelText('Identificador del estudiante *'), { target: { value: 'student-123' } });
    fireEvent.change(screen.getByLabelText('Cama disponible *'), { target: { value: 'bed-available' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar asignación' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar asignación' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La cama ya no está disponible');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
