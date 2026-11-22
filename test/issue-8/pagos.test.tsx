import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPago, getPagos, rechazarPago, verificarPago } from '../../src/api/client';
import { PagosPage } from '../../src/pages/PagosPage';
import type { Pago } from '../../src/types/pagos';

vi.mock('../../src/api/client', () => ({
  getPagos: vi.fn(),
  getPago: vi.fn(),
  createPago: vi.fn(),
  verificarPago: vi.fn(),
  rechazarPago: vi.fn(),
}));

const mockPagos: Pago[] = [
  {
    id: 'PAG-001',
    tipoPago: 'mensualidad',
    residenteNombre: 'Carlos Mario Restrepo',
    numeroDocumento: '1088345678',
    monto: 350000,
    fechaPago: '2026-02-05',
    periodo: 'Febrero 2026',
    metodoPago: 'transferencia',
    referencia: 'TR-998877',
    bancoEntidad: 'Bancolombia',
    estado: 'pendiente',
    fechaRegistro: '2026-02-05T10:00:00Z',
    comprobanteNombre: 'recibo_transferencia.png',
  },
  {
    id: 'PAG-002',
    tipoPago: 'deposito',
    residenteNombre: 'Mariana López Gómez',
    numeroDocumento: '1004567890',
    monto: 400000,
    fechaPago: '2026-02-01',
    metodoPago: 'consignacion',
    referencia: 'CON-112233',
    bancoEntidad: 'Davivienda',
    estado: 'verificado',
    fechaRegistro: '2026-02-01T14:30:00Z',
    comprobanteNombre: 'comprobante_deposito.pdf',
    verificadoPor: 'CONTABILIDAD',
  },
  {
    id: 'PAG-003',
    tipoPago: 'mensualidad',
    residenteNombre: 'Andrés Felipe Morales',
    numeroDocumento: '1099887766',
    monto: 350000,
    fechaPago: '2026-02-03',
    periodo: 'Febrero 2026',
    metodoPago: 'nequi',
    referencia: 'NQ-445566',
    estado: 'rechazado',
    motivoRechazo: 'Comprobante no coincide con el saldo de la cuenta institucional',
    fechaRegistro: '2026-02-03T16:00:00Z',
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <PagosPage />
    </MemoryRouter>,
  );
}

describe('Interfaz de Registro de Pagos Mensuales y Depósitos (Issue-8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('userRole', 'CONTABILIDAD');
    vi.mocked(getPagos).mockResolvedValue(mockPagos);
    vi.mocked(createPago).mockResolvedValue({
      id: 'PAG-999',
      tipoPago: 'mensualidad',
      residenteNombre: 'Valentina Cardona',
      numeroDocumento: '1012345678',
      monto: 350000,
      fechaPago: '2026-02-10',
      periodo: 'Febrero 2026',
      metodoPago: 'daviplata',
      referencia: 'DAV-889900',
      estado: 'pendiente',
      fechaRegistro: '2026-02-10T12:00:00Z',
    });
    vi.mocked(verificarPago).mockResolvedValue({
      ...mockPagos[0],
      estado: 'verificado',
      verificadoPor: 'CONTABILIDAD',
    });
    vi.mocked(rechazarPago).mockResolvedValue({
      ...mockPagos[0],
      estado: 'rechazado',
      motivoRechazo: 'Comprobante adulterado',
    });
  });

  it('renderiza el encabezado institucional, hero y las métricas KPI', async () => {
    renderPage();

    expect(screen.getByText('CASA ESTUDIANTIL')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Registro de Pagos Mensuales y Depósitos' })).toBeInTheDocument();

    // Comprobar KPIs
    expect(screen.getByText('Total Recaudado (Aprobado)')).toBeInTheDocument();
    expect(screen.getByText('Depósitos en Custodia')).toBeInTheDocument();
    expect(screen.getByText('Mensualidades Registradas')).toBeInTheDocument();
    expect(screen.getByText('Pendientes de Verificación')).toBeInTheDocument();

    // Esperar carga de pagos
    await waitFor(() => {
      expect(getPagos).toHaveBeenCalledTimes(1);
    });
  });

  it('permite alternar entre mensualidad y depósito en el formulario de registro', async () => {
    renderPage();

    const radioMensualidad = screen.getByRole('radio', { name: /mensualidad/i });
    const radioDeposito = screen.getByRole('radio', { name: /depósito en garantía/i });

    expect(radioMensualidad).toBeChecked();
    expect(screen.getByLabelText(/período \/ mes que cubre/i)).toBeInTheDocument();

    // Seleccionar depósito
    fireEvent.click(radioDeposito);
    expect(radioDeposito).toBeChecked();
    expect(screen.queryByLabelText(/período \/ mes que cubre/i)).not.toBeInTheDocument();
  });

  it('valida que el monto sea un valor mayor a cero antes de registrar', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/nombre completo del residente/i), {
      target: { value: 'Valentina Cardona' },
    });
    fireEvent.change(screen.getByLabelText(/número de documento/i), {
      target: { value: '1012345678' },
    });
    fireEvent.change(screen.getByLabelText(/valor pagado/i), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByLabelText(/n° de comprobante \/ referencia/i), {
      target: { value: 'DAV-889900' },
    });

    fireEvent.click(screen.getByRole('button', { name: /registrar comprobante de pago/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El valor del pago debe ser un número mayor a cero.');
    expect(createPago).not.toHaveBeenCalled();
  });

  it('registra exitosamente un pago con archivo adjunto y redirige al listado', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/nombre completo del residente/i), {
      target: { value: 'Valentina Cardona' },
    });
    fireEvent.change(screen.getByLabelText(/número de documento/i), {
      target: { value: '1012345678' },
    });
    fireEvent.change(screen.getByLabelText(/valor pagado/i), {
      target: { value: '350000' },
    });
    fireEvent.change(screen.getByLabelText(/n° de comprobante \/ referencia/i), {
      target: { value: 'DAV-889900' },
    });
    fireEvent.change(screen.getByLabelText(/método de pago/i), {
      target: { value: 'daviplata' },
    });

    // Adjuntar archivo ficticio
    const file = new File(['dummy content'], 'soporte_pago.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/seleccionar archivo de soporte/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('soporte_pago.png')).toBeInTheDocument();

    // Enviar formulario
    fireEvent.click(screen.getByRole('button', { name: /registrar comprobante de pago/i }));

    await waitFor(() => {
      expect(createPago).toHaveBeenCalledWith(
        expect.objectContaining({
          tipoPago: 'mensualidad',
          residenteNombre: 'Valentina Cardona',
          numeroDocumento: '1012345678',
          monto: 350000,
          metodoPago: 'daviplata',
          referencia: 'DAV-889900',
        }),
        file,
      );
    });

    // Mensaje de éxito
    expect(await screen.findByRole('status')).toHaveTextContent(/pago registrado exitosamente/i);
  });

  it('muestra la lista de pagos registrados y permite filtrar por tipo de pago', async () => {
    renderPage();

    // Ir a pestaña de listado
    fireEvent.click(screen.getByRole('button', { name: /listado general/i }));

    expect(await screen.findByText('Carlos Mario Restrepo')).toBeInTheDocument();
    expect(screen.getByText('Mariana López Gómez')).toBeInTheDocument();
    expect(screen.getByText('Andrés Felipe Morales')).toBeInTheDocument();

    // Filtrar por depósitos
    fireEvent.change(screen.getByLabelText(/tipo de pago:/i), {
      target: { value: 'deposito' },
    });

    expect(screen.getByText('Mariana López Gómez')).toBeInTheDocument();
    expect(screen.queryByText('Carlos Mario Restrepo')).not.toBeInTheDocument();
  });

  it('filtra los pagos por estado (pendientes, verificados, rechazados)', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /listado general/i }));
    await screen.findByText('Carlos Mario Restrepo');

    // Filtrar por estado pendiente
    fireEvent.change(screen.getByLabelText(/estado:/i), {
      target: { value: 'pendiente' },
    });

    expect(screen.getByText('Carlos Mario Restrepo')).toBeInTheDocument();
    expect(screen.queryByText('Mariana López Gómez')).not.toBeInTheDocument();
  });

  it('permite buscar por nombre o número de documento', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /listado general/i }));
    await screen.findByText('Carlos Mario Restrepo');

    const searchInput = screen.getByLabelText(/buscar residente o referencia:/i);
    fireEvent.change(searchInput, { target: { value: '1088345678' } });

    expect(screen.getByText('Carlos Mario Restrepo')).toBeInTheDocument();
    expect(screen.queryByText('Mariana López Gómez')).not.toBeInTheDocument();
  });

  it('abre el modal de detalle del comprobante al hacer clic en Detalle', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /listado general/i }));
    await screen.findByText('Carlos Mario Restrepo');

    const detailButtons = screen.getAllByRole('button', { name: 'Detalle' });
    fireEvent.click(detailButtons[0]);

    // Modal abierto
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Radicado #PAG-001')).toBeInTheDocument();
    expect(screen.getByText('recibo_transferencia.png')).toBeInTheDocument();

    // Cerrar modal
    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('permite al rol autorizado de CONTABILIDAD verificar y aprobar un pago pendiente', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /listado general/i }));
    await screen.findByText('Carlos Mario Restrepo');

    const verifyButton = screen.getByRole('button', { name: /✓ verificar/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(verificarPago).toHaveBeenCalledWith('PAG-001', 'CONTABILIDAD');
    });

    expect(await screen.findByRole('status')).toHaveTextContent(/pago verificado y aprobado exitosamente/i);
  });

  it('permite al rol autorizado rechazar un pago ingresando el motivo', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /listado general/i }));
    await screen.findByText('Carlos Mario Restrepo');

    const rejectButton = screen.getByRole('button', { name: /✕ rechazar/i });
    fireEvent.click(rejectButton);

    // Diálogo de confirmación de rechazo
    expect(screen.getByText('Motivo de Rechazo del Pago')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/detalle del motivo/i), {
      target: { value: 'Comprobante no coincide con extracto' },
    });

    fireEvent.click(screen.getByRole('button', { name: /confirmar rechazo/i }));

    await waitFor(() => {
      expect(rechazarPago).toHaveBeenCalledWith(
        'PAG-001',
        'Comprobante no coincide con extracto',
        'CONTABILIDAD',
      );
    });

    expect(await screen.findByRole('status')).toHaveTextContent(/ha sido marcado como rechazado/i);
  });

  it('permite consultar pagos por número de documento en la pestaña de consulta', async () => {
    renderPage();
    await waitFor(() => expect(getPagos).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /consultar por documento/i }));

    const docInput = screen.getByLabelText(/número de documento de identidad \*/i);
    fireEvent.change(docInput, { target: { value: '1088345678' } });

    fireEvent.click(screen.getByRole('button', { name: /consultar historial/i }));

    expect(await screen.findByText('Historial de pagos para documento: 1088345678')).toBeInTheDocument();
    expect(screen.getByText('TR-998877')).toBeInTheDocument();
  });
});
