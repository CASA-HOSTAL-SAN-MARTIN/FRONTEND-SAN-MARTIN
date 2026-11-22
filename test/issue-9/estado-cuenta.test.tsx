import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getEstadosCuenta, registrarAcuerdoPago } from '../../src/api/client';
import { EstadoCuentaPage } from '../../src/pages/EstadoCuentaPage';
import type { EstadoCuentaResidente } from '../../src/types/estado-cuenta';

vi.mock('../../src/api/client', () => ({
  getEstadosCuenta: vi.fn(),
  getEstadoCuentaByDocumento: vi.fn(),
  getEstadoCuenta: vi.fn(),
  registrarAcuerdoPago: vi.fn(),
  getResumenCartera: vi.fn(),
}));

const mockEstadosCuenta: EstadoCuentaResidente[] = [
  {
    id: 'EC-001',
    residenteId: 'RES-001',
    residenteNombre: 'Santiago Morales Pardo',
    numeroDocumento: '1088456123',
    correo: 'santiago.morales@utp.edu.co',
    habitacion: '201',
    cama: 'A',
    esBecado: false,
    estadoMora: 'en_mora',
    totalFacturado: 700000,
    totalPagado: 350000,
    saldoTotalPendiente: 350000,
    montoEnMora: 350000,
    diasMoraMaximo: 15,
    fechaCorte: '2026-02-21',
    obligaciones: [
      {
        id: 'OBL-101',
        concepto: 'Mensualidad Enero 2026',
        tipo: 'mensualidad',
        periodo: 'Enero 2026',
        fechaEmision: '2026-01-01',
        fechaVencimiento: '2026-01-05',
        montoTotal: 350000,
        montoPagado: 350000,
        saldoPendiente: 0,
        diasMora: 0,
        estado: 'pagado',
      },
      {
        id: 'OBL-102',
        concepto: 'Mensualidad Febrero 2026',
        tipo: 'mensualidad',
        periodo: 'Febrero 2026',
        fechaEmision: '2026-02-01',
        fechaVencimiento: '2026-02-05',
        montoTotal: 350000,
        montoPagado: 0,
        saldoPendiente: 350000,
        diasMora: 15,
        estado: 'vencido',
      },
    ],
    abonosRecientes: [
      {
        id: 'AB-01',
        fecha: '2026-01-04',
        monto: 350000,
        metodoPago: 'Transferencia Bancolombia',
        referencia: 'TR-102938',
      },
    ],
    acuerdosPago: [],
  },
  {
    id: 'EC-002',
    residenteId: 'RES-002',
    residenteNombre: 'Valeria Castro Benítez',
    numeroDocumento: '1004123987',
    correo: 'valeria.castro@utp.edu.co',
    habitacion: '102',
    cama: 'B',
    esBecado: false,
    estadoMora: 'al_dia',
    totalFacturado: 750000,
    totalPagado: 750000,
    saldoTotalPendiente: 0,
    montoEnMora: 0,
    diasMoraMaximo: 0,
    fechaCorte: '2026-02-21',
    obligaciones: [
      {
        id: 'OBL-201',
        concepto: 'Depósito en Garantía',
        tipo: 'deposito',
        fechaEmision: '2026-01-10',
        fechaVencimiento: '2026-01-15',
        montoTotal: 400000,
        montoPagado: 400000,
        saldoPendiente: 0,
        diasMora: 0,
        estado: 'pagado',
      },
      {
        id: 'OBL-202',
        concepto: 'Mensualidad Febrero 2026',
        tipo: 'mensualidad',
        periodo: 'Febrero 2026',
        fechaEmision: '2026-02-01',
        fechaVencimiento: '2026-02-05',
        montoTotal: 350000,
        montoPagado: 350000,
        saldoPendiente: 0,
        diasMora: 0,
        estado: 'pagado',
      },
    ],
    abonosRecientes: [
      {
        id: 'AB-02',
        fecha: '2026-02-02',
        monto: 350000,
        metodoPago: 'Nequi',
        referencia: 'NQ-778899',
      },
    ],
    acuerdosPago: [],
  },
  {
    id: 'EC-003',
    residenteId: 'RES-003',
    residenteNombre: 'Nicolás Andrade Ríos',
    numeroDocumento: '1098765432',
    correo: 'nicolas.andrade@utp.edu.co',
    habitacion: '301',
    cama: 'A',
    esBecado: true,
    estadoMora: 'becado',
    totalFacturado: 0,
    totalPagado: 0,
    saldoTotalPendiente: 0,
    montoEnMora: 0,
    diasMoraMaximo: 0,
    fechaCorte: '2026-02-21',
    obligaciones: [],
    abonosRecientes: [],
    acuerdosPago: [],
  },
  {
    id: 'EC-004',
    residenteId: 'RES-004',
    residenteNombre: 'Camila Andrea Varela',
    numeroDocumento: '1011223344',
    correo: 'camila.varela@utp.edu.co',
    habitacion: '105',
    cama: 'A',
    esBecado: false,
    estadoMora: 'acuerdo_pago',
    totalFacturado: 700000,
    totalPagado: 400000,
    saldoTotalPendiente: 300000,
    montoEnMora: 300000,
    diasMoraMaximo: 10,
    fechaCorte: '2026-02-21',
    obligaciones: [
      {
        id: 'OBL-401',
        concepto: 'Mensualidad Febrero 2026',
        tipo: 'mensualidad',
        periodo: 'Febrero 2026',
        fechaEmision: '2026-02-01',
        fechaVencimiento: '2026-02-05',
        montoTotal: 350000,
        montoPagado: 50000,
        saldoPendiente: 300000,
        diasMora: 10,
        estado: 'parcial',
      },
    ],
    abonosRecientes: [],
    acuerdosPago: [
      {
        id: 'ACU-01',
        fechaAcuerdo: '2026-02-10',
        fechaCompromiso: '2026-02-28',
        montoCompromiso: 300000,
        observaciones: 'Pago autorizado a fin de mes por demora en subsidio.',
        registradoPor: 'CONTABILIDAD',
        cumplido: false,
      },
    ],
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <EstadoCuentaPage />
    </MemoryRouter>,
  );
}

describe('Vista de Estado de Cuenta, Saldos Pendientes y Mora (Issue-9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('userRole', 'CONTABILIDAD');
    vi.mocked(getEstadosCuenta).mockResolvedValue(mockEstadosCuenta);
    vi.mocked(registrarAcuerdoPago).mockResolvedValue({
      id: 'ACU-99',
      fechaAcuerdo: '2026-02-21',
      fechaCompromiso: '2026-02-28',
      montoCompromiso: 350000,
      observaciones: 'Pago con prima familiar',
      registradoPor: 'CONTABILIDAD',
      cumplido: false,
    });
  });

  it('renderiza título institucional, hero y tarjetas de indicadores de cartera (KPIs)', async () => {
    renderPage();

    expect(screen.getByText('CASA ESTUDIANTIL')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Estado de Cuenta, Saldos Pendientes y Mora' }),
    ).toBeInTheDocument();

    // KPIs
    expect(screen.getByText('Cartera Total Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Monto Total en Mora')).toBeInTheDocument();
    expect(screen.getByText('Residentes en Mora')).toBeInTheDocument();
    expect(screen.getByText('Residentes al Día / Becados')).toBeInTheDocument();

    await waitFor(() => {
      expect(getEstadosCuenta).toHaveBeenCalledTimes(1);
    });
  });

  it('muestra el listado de residentes con sus saldos y días de mora', async () => {
    renderPage();

    expect(await screen.findByText('Santiago Morales Pardo')).toBeInTheDocument();
    expect(screen.getByText('Valeria Castro Benítez')).toBeInTheDocument();
    expect(screen.getByText('Nicolás Andrade Ríos')).toBeInTheDocument();

    // Indicadores de mora
    expect(screen.getByText(/15 días/i)).toBeInTheDocument();
  });

  it('permite filtrar el tablero general por estado de cartera (en mora, al día, becados)', async () => {
    renderPage();
    await screen.findByText('Santiago Morales Pardo');

    const filterSelect = screen.getByLabelText(/estado de cartera:/i);
    fireEvent.change(filterSelect, { target: { value: 'en_mora' } });

    expect(screen.getByText('Santiago Morales Pardo')).toBeInTheDocument();
    expect(screen.queryByText('Valeria Castro Benítez')).not.toBeInTheDocument();
  });

  it('permite buscar residentes por nombre, documento o número de habitación', async () => {
    renderPage();
    await screen.findByText('Santiago Morales Pardo');

    const searchInput = screen.getByLabelText(/buscar por nombre, documento o habitación:/i);
    fireEvent.change(searchInput, { target: { value: '1004123987' } });

    expect(screen.getByText('Valeria Castro Benítez')).toBeInTheDocument();
    expect(screen.queryByText('Santiago Morales Pardo')).not.toBeInTheDocument();
  });

  it('abre el modal de extracto detallado al pulsar "Ver extracto"', async () => {
    renderPage();
    await screen.findByText('Santiago Morales Pardo');

    const extractoBtns = screen.getAllByRole('button', { name: /ver extracto/i });
    fireEvent.click(extractoBtns[0]);

    // Modal visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Estado de Cuenta de Santiago Morales Pardo/i)).toBeInTheDocument();
    expect(screen.getByText('Mensualidad Enero 2026')).toBeInTheDocument();
    expect(screen.getByText('Mensualidad Febrero 2026')).toBeInTheDocument();
    expect(screen.getByText('TR-102938')).toBeInTheDocument();

    // Cerrar modal
    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('permite abrir el modal y registrar un acuerdo de pago para un residente con saldo pendiente', async () => {
    renderPage();
    await screen.findByText('Santiago Morales Pardo');

    const acuerdoBtns = screen.getAllByRole('button', { name: 'Acuerdo' });
    fireEvent.click(acuerdoBtns[0]);

    // Diálogo de acuerdo abierto
    expect(screen.getByRole('heading', { name: 'Compromiso / Acuerdo de Pago' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/condiciones o justificación/i), {
      target: { value: 'Compromiso formal de pago quincenal' },
    });

    fireEvent.click(screen.getByRole('button', { name: /registrar acuerdo formal/i }));

    await waitFor(() => {
      expect(registrarAcuerdoPago).toHaveBeenCalledWith(
        'RES-001',
        expect.objectContaining({
          montoCompromiso: 350000,
          observaciones: 'Compromiso formal de pago quincenal',
          registradoPor: 'CONTABILIDAD',
        }),
      );
    });

    expect(await screen.findByRole('status')).toHaveTextContent(/acuerdo de pago registrado exitosamente/i);
  });

  it('valida que el monto del acuerdo sea mayor a cero', async () => {
    renderPage();
    await screen.findByText('Santiago Morales Pardo');

    const acuerdoBtns = screen.getAllByRole('button', { name: 'Acuerdo' });
    fireEvent.click(acuerdoBtns[0]);

    fireEvent.change(screen.getByLabelText(/monto acordado a pagar/i), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByLabelText(/condiciones o justificación/i), {
      target: { value: 'Prueba de error' },
    });

    fireEvent.click(screen.getByRole('button', { name: /registrar acuerdo formal/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El monto del compromiso debe ser un valor mayor a cero.',
    );
    expect(registrarAcuerdoPago).not.toHaveBeenCalled();
  });

  it('permite consultar el estado de cuenta por cédula en la pestaña de consulta individual', async () => {
    renderPage();
    await waitFor(() => expect(getEstadosCuenta).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /consulta individual de estado de cuenta/i }));

    const docInput = screen.getByLabelText(/número de documento de identidad \*/i);
    fireEvent.change(docInput, { target: { value: '1088456123' } });

    fireEvent.click(screen.getByRole('button', { name: /consultar estado de cuenta/i }));

    expect(await screen.findByText('Extracto de Cuenta Oficial')).toBeInTheDocument();
    expect(screen.getByText('Desglose de Obligaciones Causadas')).toBeInTheDocument();
    expect(screen.getByText('Mensualidad Febrero 2026')).toBeInTheDocument();
    expect(screen.getByText(/15 días en mora/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /registrar soporte de pago/i })).toHaveAttribute(
      'href',
      '/pagos',
    );
  });

  it('muestra la lista de acuerdos de pago registrados en la pestaña de acuerdos', async () => {
    renderPage();
    await waitFor(() => expect(getEstadosCuenta).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /acuerdos y compromisos de pago/i }));

    expect(await screen.findByText('Camila Andrea Varela')).toBeInTheDocument();
    expect(screen.getByText(/Pago autorizado a fin de mes por demora en subsidio/i)).toBeInTheDocument();
    expect(screen.getByText('En seguimiento')).toBeInTheDocument();
  });
});
