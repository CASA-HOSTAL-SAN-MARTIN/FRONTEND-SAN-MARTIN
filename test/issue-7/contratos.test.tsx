import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createContrato, getContrato, getContratos, updateContrato } from '../../src/api/client';
import { ContratosPage } from '../../src/pages/ContratosPage';
import type { Contrato } from '../../src/types/contratos';

vi.mock('../../src/api/client', () => ({
  createContrato: vi.fn(),
  getContrato: vi.fn(),
  getContratos: vi.fn(),
  updateContrato: vi.fn(),
}));

const contrato: Contrato = {
  id: 'contract-1',
  residente: {
    nombres: 'María',
    apellidos: 'González',
    tipoDocumento: 'CC',
    numeroDocumento: '1020304050',
    correo: 'maria@example.com',
    telefono: '3001234567',
  },
  fechaInicio: '2026-01-15',
  fechaFin: '2026-12-15',
  valorDeposito: 250000,
  estado: 'vigente',
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ContratosPage />
    </MemoryRouter>,
  );
}

describe('Issue 7 - Registro de contratos y residentes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('userRole', 'ADMIN_SISTEMA');
    vi.mocked(getContratos).mockResolvedValue([contrato]);
    vi.mocked(getContrato).mockResolvedValue(contrato);
    vi.mocked(createContrato).mockResolvedValue(contrato);
    vi.mocked(updateContrato).mockResolvedValue(contrato);
  });

  it('lista contratos y permite filtrar por nombre o documento', async () => {
    renderPage();

    expect(await screen.findByText('María González')).toBeInTheDocument();
    expect(screen.getByText('1020304050')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Escribe para filtrar'), {
      target: { value: '1020304050' },
    });
    expect(screen.getByText('María González')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Escribe para filtrar'), {
      target: { value: 'documento inexistente' },
    });
    expect(screen.getByText('No hay resultados')).toBeInTheDocument();
  });

  it('registra un residente y contrato mediante la API', async () => {
    renderPage();
    await screen.findByText('María González');

    fireEvent.change(screen.getByLabelText(/Nombres/i), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByLabelText(/Apellidos/i), { target: { value: 'Pérez' } });
    fireEvent.change(screen.getByLabelText(/Número de documento/i), { target: { value: '123456789' } });
    fireEvent.change(screen.getByLabelText(/Fecha de inicio/i), { target: { value: '2026-02-01' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Registrar contrato' }).closest('form')!);

    await waitFor(() => {
      expect(createContrato).toHaveBeenCalledWith(
        {
          residente: {
            nombres: 'Juan',
            apellidos: 'Pérez',
            tipoDocumento: 'CC',
            numeroDocumento: '123456789',
            correo: '',
            telefono: '',
          },
          fechaInicio: '2026-02-01',
        },
        undefined,
      );
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Contrato registrado correctamente');
  });

  it('valida que la fecha final no sea anterior al inicio', async () => {
    renderPage();
    await screen.findByText('María González');

    fireEvent.change(screen.getByLabelText(/Nombres/i), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByLabelText(/Apellidos/i), { target: { value: 'Pérez' } });
    fireEvent.change(screen.getByLabelText(/Número de documento/i), { target: { value: '123456789' } });
    fireEvent.change(screen.getByLabelText(/Fecha de inicio/i), { target: { value: '2026-12-01' } });
    fireEvent.change(screen.getByLabelText(/Fecha de finalización/i), { target: { value: '2026-11-01' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Registrar contrato' }).closest('form')!);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'La fecha de finalización no puede ser anterior a la fecha de inicio',
    );
    expect(createContrato).not.toHaveBeenCalled();
  });

  it('permite editar un contrato y vuelve a cargar la lista', async () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    renderPage();
    await screen.findByText('María González');

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    await waitFor(() => expect(getContrato).toHaveBeenCalledWith('contract-1'));

    expect(await screen.findByDisplayValue('María')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Nombres/i), { target: { value: 'María Fernanda' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Guardar cambios' }).closest('form')!);

    await waitFor(() => expect(updateContrato).toHaveBeenCalled());
    expect(await screen.findByRole('status')).toHaveTextContent('Contrato actualizado correctamente');
  });

  it('bloquea la gestión a roles no autorizados', () => {
    localStorage.setItem('userRole', 'ASPIRANTE_RESIDENTE');
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Acceso restringido');
    expect(getContratos).not.toHaveBeenCalled();
  });
});
