import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { getEstadosCuenta, registrarAcuerdoPago } from '../api/client';
import type {
  AcuerdoPago,
  EstadoCuentaResidente,
  EstadoMora,
  EstadoObligacion,
  ObligacionDetalle,
  UserRole,
} from '../types';

const authorizedStaffRoles: UserRole[] = [
  'ADMIN_SISTEMA',
  'ADMIN_FUNDACION',
  'CONTABILIDAD',
  'COORDINACION_BIENESTAR',
];

const ESTADO_MORA_LABELS: Record<EstadoMora, string> = {
  al_dia: 'Al día',
  pendiente: 'Próximo a vencer',
  en_mora: 'En mora',
  acuerdo_pago: 'Acuerdo de pago',
  becado: 'Beca completa',
};

const ESTADO_OBLIGACION_LABELS: Record<EstadoObligacion, string> = {
  pagado: 'Pagado',
  parcial: 'Abono parcial',
  pendiente: 'Pendiente',
  vencido: 'Vencido (Mora)',
};

function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
    if (!error.response) {
      return 'No fue posible conectar con el servidor. Verifica que la API esté disponible.';
    }
  }
  return 'No fue posible completar la operación. Inténtalo nuevamente.';
}

function formatCOP(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '$ 0';
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) return String(value);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const clean = value.slice(0, 10);
  const date = new Date(`${clean}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-CO');
}

export function EstadoCuentaPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'consulta' | 'acuerdos'>('general');
  const [estadosCuenta, setEstadosCuenta] = useState<EstadoCuentaResidente[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingAcuerdo, setSavingAcuerdo] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Filtros tabla general
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal de extracto completo
  const [selectedEstadoCuenta, setSelectedEstadoCuenta] = useState<EstadoCuentaResidente | null>(null);

  // Consulta por documento
  const [docConsulta, setDocConsulta] = useState('');
  const [resultadoConsulta, setResultadoConsulta] = useState<EstadoCuentaResidente | null>(null);
  const [consultado, setConsultado] = useState(false);

  // Modal / Formulario de Acuerdo de pago
  const [acuerdoModalResidente, setAcuerdoModalResidente] = useState<EstadoCuentaResidente | null>(null);
  const [acuerdoFechaCompromiso, setAcuerdoFechaCompromiso] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const [acuerdoMonto, setAcuerdoMonto] = useState('');
  const [acuerdoObservaciones, setAcuerdoObservaciones] = useState('');

  // Rol del usuario actual
  const currentRole = (typeof window !== 'undefined' ? localStorage.getItem('userRole') : null) as UserRole | null;
  const canManageCartera = currentRole !== null && authorizedStaffRoles.includes(currentRole);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getEstadosCuenta();
      setEstadosCuenta(data);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Cálculo de KPIs de cartera
  const stats = useMemo(() => {
    let carteraTotal = 0;
    let totalMora = 0;
    let enMoraCount = 0;
    let alDiaCount = 0;
    let pendientesCount = 0;

    estadosCuenta.forEach((ec) => {
      carteraTotal += ec.saldoTotalPendiente || 0;
      totalMora += ec.montoEnMora || 0;
      if (ec.estadoMora === 'en_mora') enMoraCount++;
      else if (ec.estadoMora === 'al_dia' || ec.estadoMora === 'becado') alDiaCount++;
      else pendientesCount++;
    });

    return {
      carteraTotal,
      totalMora,
      enMoraCount,
      alDiaCount,
      pendientesCount,
      totalResidentes: estadosCuenta.length,
    };
  }, [estadosCuenta]);

  // Filtrado de la tabla general
  const filteredResidentes = useMemo(() => {
    return estadosCuenta.filter((ec) => {
      if (filterEstado !== 'todos' && ec.estadoMora !== filterEstado) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = ec.residenteNombre.toLowerCase().includes(q);
        const matchDoc = ec.numeroDocumento.toLowerCase().includes(q);
        const matchHab = ec.habitacion?.toLowerCase().includes(q) || false;
        if (!matchName && !matchDoc && !matchHab) return false;
      }

      return true;
    });
  }, [estadosCuenta, filterEstado, searchQuery]);

  // Lista consolidada de acuerdos de pago
  const todosLosAcuerdos = useMemo(() => {
    const list: { residente: EstadoCuentaResidente; acuerdo: AcuerdoPago }[] = [];
    estadosCuenta.forEach((ec) => {
      ec.acuerdosPago?.forEach((acuerdo) => {
        list.push({ residente: ec, acuerdo });
      });
    });
    return list;
  }, [estadosCuenta]);

  function handleConsultarDocumento(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConsultado(true);
    if (!docConsulta.trim()) {
      setResultadoConsulta(null);
      return;
    }
    const cleanDoc = docConsulta.trim().toLowerCase();
    const found = estadosCuenta.find((ec) => ec.numeroDocumento.toLowerCase() === cleanDoc);
    setResultadoConsulta(found ?? null);
  }

  async function handleGuardarAcuerdo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acuerdoModalResidente) return;

    const montoNum = Number(acuerdoMonto);
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      setError('El monto del compromiso debe ser un valor mayor a cero.');
      return;
    }

    if (!acuerdoFechaCompromiso) {
      setError('Debes especificar la fecha límite del compromiso de pago.');
      return;
    }

    setSavingAcuerdo(true);
    setError('');
    setNotice('');
    try {
      await registrarAcuerdoPago(acuerdoModalResidente.residenteId, {
        fechaCompromiso: acuerdoFechaCompromiso,
        montoCompromiso: montoNum,
        observaciones: acuerdoObservaciones.trim(),
        registradoPor: currentRole ?? 'PERSONAL_AUTORIZADO',
      });

      setNotice(`Acuerdo de pago registrado exitosamente para ${acuerdoModalResidente.residenteNombre}.`);
      setAcuerdoModalResidente(null);
      setAcuerdoMonto('');
      setAcuerdoObservaciones('');
      await loadData();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSavingAcuerdo(false);
    }
  }

  function handleImprimir() {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  }

  return (
    <main className="app-shell cartera-page">
      {/* Header Institucional */}
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-seal">SM</span>
          <span className="brand-name">CASA ESTUDIANTIL<strong>SAN MARTÍN</strong></span>
        </Link>
        <div className="header-actions">
          <Link className="header-link" to="/">Solicitudes</Link>
          <Link className="header-link" to="/camas">Estado de camas</Link>
          <Link className="header-link" to="/contratos">Contratos</Link>
          <Link className="header-link" to="/pagos">Pagos</Link>
          <span className="header-page active">Estado de Cuenta y Mora</span>
          <span className="header-mark">EC</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="cartera-hero">
        <p className="eyebrow">Control de Cartera y Facturación</p>
        <h2>Estado de Cuenta, Saldos Pendientes y Mora</h2>
        <p>
          Seguimiento exhaustivo de cánones de alojamiento facturados, verificación de saldos pendientes, cálculo de días de mora y registro de acuerdos de pago de la Casa Estudiantil San Martín.
        </p>
      </section>

      {/* Tarjetas de Indicadores / KPIs */}
      <section className="cartera-kpis-grid" aria-label="Indicadores de cartera y mora">
        <div className="cartera-kpi-card">
          <span className="kpi-label">Cartera Total Pendiente</span>
          <strong className="kpi-value text-slate-800">{formatCOP(stats.carteraTotal)}</strong>
          <span className="kpi-subtext">Saldo acumulado por cobrar</span>
        </div>
        <div className="cartera-kpi-card">
          <span className="kpi-label">Monto Total en Mora</span>
          <strong className={`kpi-value ${stats.totalMora > 0 ? 'text-red-700' : 'text-slate-700'}`}>
            {formatCOP(stats.totalMora)}
          </strong>
          <span className="kpi-subtext">Obligaciones vencidas impagas</span>
        </div>
        <div className="cartera-kpi-card">
          <span className="kpi-label">Residentes en Mora</span>
          <strong className={`kpi-value ${stats.enMoraCount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
            {stats.enMoraCount}
          </strong>
          <span className="kpi-subtext">Estudiantes con cartera vencida</span>
        </div>
        <div className="cartera-kpi-card">
          <span className="kpi-label">Residentes al Día / Becados</span>
          <strong className="kpi-value text-emerald-700">{stats.alDiaCount}</strong>
          <span className="kpi-subtext">De {stats.totalResidentes} registrados</span>
        </div>
      </section>

      {/* Notificaciones globales */}
      {notice && (
        <div className="alert success cartera-alert" role="status">
          <strong>✓ Operación exitosa: </strong> {notice}
        </div>
      )}
      {error && (
        <div className="alert error cartera-alert" role="alert">
          <strong>⚠ Atención: </strong> {error}
        </div>
      )}

      {/* Navegación por pestañas */}
      <nav className="tabs cartera-tabs" aria-label="Secciones de estado de cuenta">
        <button
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          type="button"
          onClick={() => { setActiveTab('general'); setNotice(''); setError(''); }}
        >
          📊 Tablero General de Cartera ({estadosCuenta.length})
        </button>
        <button
          className={`tab ${activeTab === 'consulta' ? 'active' : ''}`}
          type="button"
          onClick={() => { setActiveTab('consulta'); setNotice(''); setError(''); }}
        >
          🔍 Consulta Individual de Estado de Cuenta
        </button>
        <button
          className={`tab ${activeTab === 'acuerdos' ? 'active' : ''}`}
          type="button"
          onClick={() => { setActiveTab('acuerdos'); setNotice(''); setError(''); }}
        >
          🤝 Acuerdos y Compromisos de Pago ({todosLosAcuerdos.length})
        </button>
      </nav>

      {/* PESTAÑA 1: TABLERO GENERAL DE CARTERA */}
      {activeTab === 'general' && (
        <section className="cartera-list-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Gestión de cartera institucional</p>
              <h3>Consolidado de Saldos y Morosidad por Residente</h3>
            </div>
            <button
              className="secondary-button"
              type="button"
              onClick={loadData}
              disabled={loading}
            >
              {loading ? 'Cargando...' : '🔄 Actualizar cartera'}
            </button>
          </div>

          {/* Barra de Filtros */}
          <div className="cartera-filters-bar">
            <label className="cartera-search-field">
              <span>Buscar por nombre, documento o habitación:</span>
              <input
                type="search"
                placeholder="Nombre, cédula, hab. 201..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>

            <div className="cartera-filter-group">
              <label>
                <span>Estado de cartera:</span>
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="en_mora">En mora</option>
                  <option value="pendiente">Próximo a vencer</option>
                  <option value="al_dia">Al día</option>
                  <option value="acuerdo_pago">Con acuerdo de pago</option>
                  <option value="becado">Becados</option>
                </select>
              </label>
            </div>
          </div>

          {/* Tabla General */}
          <div className="cartera-table-container">
            {filteredResidentes.length === 0 ? (
              <div className="empty-state">
                <strong>No se encontraron registros con los criterios seleccionados.</strong>
                <p>Modifica los filtros o actualiza la información de cartera.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="cartera-table">
                  <thead>
                    <tr>
                      <th>Residente</th>
                      <th>Ubicación</th>
                      <th>Facturado</th>
                      <th>Pagado</th>
                      <th>Saldo Pendiente</th>
                      <th>Días Mora</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResidentes.map((ec) => (
                      <tr key={ec.id}>
                        <td>
                          <div className="resident-cell">
                            <strong>{ec.residenteNombre}</strong>
                            <span className="table-subinfo">C.C. {ec.numeroDocumento}</span>
                          </div>
                        </td>
                        <td>
                          <span className="room-badge">
                            {ec.habitacion ? `Hab. ${ec.habitacion}` : 'Sin asignar'}
                            {ec.cama ? ` - Cama ${ec.cama}` : ''}
                          </span>
                        </td>
                        <td>{formatCOP(ec.totalFacturado)}</td>
                        <td>
                          <span className="text-emerald-700 font-bold">{formatCOP(ec.totalPagado)}</span>
                        </td>
                        <td>
                          <strong className={ec.saldoTotalPendiente > 0 ? 'text-red-700' : 'text-slate-600'}>
                            {formatCOP(ec.saldoTotalPendiente)}
                          </strong>
                        </td>
                        <td>
                          {ec.diasMoraMaximo > 0 ? (
                            <span className="mora-days-badge mora-danger">
                              ⚠️ {ec.diasMoraMaximo} días
                            </span>
                          ) : (
                            <span className="mora-days-badge mora-ok">0 días</span>
                          )}
                        </td>
                        <td>
                          <span className={`estado-mora-badge status-${ec.estadoMora}`}>
                            {ESTADO_MORA_LABELS[ec.estadoMora]}
                          </span>
                        </td>
                        <td>
                          <div className="cartera-actions-cell">
                            <button
                              type="button"
                              className="action-btn-statement"
                              onClick={() => setSelectedEstadoCuenta(ec)}
                            >
                              Ver extracto
                            </button>

                            {canManageCartera && ec.saldoTotalPendiente > 0 && (
                              <button
                                type="button"
                                className="action-btn-agreement"
                                onClick={() => {
                                  setAcuerdoModalResidente(ec);
                                  setAcuerdoMonto(String(ec.saldoTotalPendiente));
                                }}
                                title="Crear compromiso de pago"
                              >
                                Acuerdo
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* PESTAÑA 2: CONSULTA INDIVIDUAL POR DOCUMENTO */}
      {activeTab === 'consulta' && (
        <section className="card cartera-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Autoconsulta para Residentes y Acudientes</p>
              <h3>Consulta tu Estado de Cuenta</h3>
            </div>
          </div>
          <p className="muted">
            Ingresa el documento de identidad del residente para visualizar en tiempo real su extracto detallado, cánones causados, abonos aplicados y saldos pendientes.
          </p>

          <form noValidate onSubmit={handleConsultarDocumento} className="lookup-form mt-4">
            <label className="full-width">
              Número de documento de identidad *
              <input
                required
                type="text"
                placeholder="Ej. 1088234567"
                value={docConsulta}
                onChange={(e) => setDocConsulta(e.target.value)}
              />
            </label>
            <button className="primary-button" type="submit">
              Consultar estado de cuenta
            </button>
          </form>

          {consultado && (
            <div className="mt-8">
              {!resultadoConsulta ? (
                <div className="empty-state">
                  <strong>No se encontró ningún estado de cuenta para el documento {docConsulta}.</strong>
                  <p>Verifica que el número digitado sea correcto o comunícate con Bienestar y Contabilidad.</p>
                </div>
              ) : (
                <div className="extracto-individual-box">
                  <div className="extracto-header-banner">
                    <div>
                      <span className="eyebrow">Extracto de Cuenta Oficial</span>
                      <h4>{resultadoConsulta.residenteNombre}</h4>
                      <p className="muted">
                        Documento: C.C. {resultadoConsulta.numeroDocumento} • Habitación: {resultadoConsulta.habitacion ?? 'No asignada'}
                      </p>
                    </div>
                    <div className="extracto-status-box">
                      <span className={`estado-mora-badge large status-${resultadoConsulta.estadoMora}`}>
                        {ESTADO_MORA_LABELS[resultadoConsulta.estadoMora]}
                      </span>
                      {resultadoConsulta.diasMoraMaximo > 0 && (
                        <span className="mora-warning-text">
                          {resultadoConsulta.diasMoraMaximo} días en mora
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Resumen financiero rápido */}
                  <div className="extracto-metrics-grid">
                    <div className="extracto-metric">
                      <span>Total Facturado:</span>
                      <strong>{formatCOP(resultadoConsulta.totalFacturado)}</strong>
                    </div>
                    <div className="extracto-metric">
                      <span>Total Pagado:</span>
                      <strong className="text-emerald-700">{formatCOP(resultadoConsulta.totalPagado)}</strong>
                    </div>
                    <div className="extracto-metric">
                      <span>Saldo Total Pendiente:</span>
                      <strong className={resultadoConsulta.saldoTotalPendiente > 0 ? 'text-red-700' : 'text-emerald-700'}>
                        {formatCOP(resultadoConsulta.saldoTotalPendiente)}
                      </strong>
                    </div>
                    <div className="extracto-metric">
                      <span>Monto en Mora:</span>
                      <strong className={resultadoConsulta.montoEnMora > 0 ? 'text-red-700' : 'text-slate-600'}>
                        {formatCOP(resultadoConsulta.montoEnMora)}
                      </strong>
                    </div>
                  </div>

                  {/* Tabla de Obligaciones */}
                  <div className="mt-6">
                    <h5 className="section-subtitle">Desglose de Obligaciones Causadas</h5>
                    <div className="table-wrap mt-2">
                      <table className="obligaciones-table">
                        <thead>
                          <tr>
                            <th>Concepto</th>
                            <th>Período</th>
                            <th>Vencimiento</th>
                            <th>Monto</th>
                            <th>Abonado</th>
                            <th>Saldo</th>
                            <th>Mora</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultadoConsulta.obligaciones.map((ob: ObligacionDetalle) => (
                            <tr key={ob.id}>
                              <td><strong>{ob.concepto}</strong></td>
                              <td>{ob.periodo ?? '—'}</td>
                              <td>{formatDate(ob.fechaVencimiento)}</td>
                              <td>{formatCOP(ob.montoTotal)}</td>
                              <td className="text-emerald-700">{formatCOP(ob.montoPagado)}</td>
                              <td>
                                <strong className={ob.saldoPendiente > 0 ? 'text-red-700' : 'text-slate-600'}>
                                  {formatCOP(ob.saldoPendiente)}
                                </strong>
                              </td>
                              <td>
                                {ob.diasMora > 0 ? (
                                  <span className="text-red-700 font-bold">{ob.diasMora} d</span>
                                ) : (
                                  <span className="text-slate-400">0</span>
                                )}
                              </td>
                              <td>
                                <span className={`obligacion-badge status-${ob.estado}`}>
                                  {ESTADO_OBLIGACION_LABELS[ob.estado]}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Abonos y pagos aplicados */}
                  {resultadoConsulta.abonosRecientes && resultadoConsulta.abonosRecientes.length > 0 && (
                    <div className="mt-6">
                      <h5 className="section-subtitle">Historial de Abonos y Pagos Aplicados</h5>
                      <div className="table-wrap mt-2">
                        <table>
                          <thead>
                            <tr>
                              <th>Fecha</th>
                              <th>Método</th>
                              <th>Referencia</th>
                              <th>Valor del Abono</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resultadoConsulta.abonosRecientes.map((abono) => (
                              <tr key={abono.id}>
                                <td>{formatDate(abono.fecha)}</td>
                                <td>{abono.metodoPago}</td>
                                <td><code>{abono.referencia}</code></td>
                                <td className="text-emerald-700 font-bold">{formatCOP(abono.monto)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Acciones del extracto */}
                  <div className="extracto-footer-actions mt-6">
                    <button type="button" className="secondary-button" onClick={handleImprimir}>
                      🖨️ Imprimir Estado de Cuenta
                    </button>
                    {resultadoConsulta.saldoTotalPendiente > 0 && (
                      <Link to="/pagos" className="primary-button payment-redirect-button">
                        💳 Registrar Soporte de Pago
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* PESTAÑA 3: ACUERDOS Y COMPROMISOS DE PAGO */}
      {activeTab === 'acuerdos' && (
        <section className="cartera-list-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Gestión de Cobro y Convivencia</p>
              <h3>Acuerdos y Compromisos de Pago</h3>
            </div>
          </div>
          <p className="muted">
            Registro formal de convenios de pago pactados con residentes en mora autorizados por la Dirección de la Fundación y Bienestar.
          </p>

          <div className="cartera-table-container mt-4">
            {todosLosAcuerdos.length === 0 ? (
              <div className="empty-state">
                <strong>No hay acuerdos de pago vigentes registrados.</strong>
                <p>Puedes crear un compromiso desde la columna de acciones en el Tablero General para residentes con saldo pendiente.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="cartera-table">
                  <thead>
                    <tr>
                      <th>Residente</th>
                      <th>Fecha del Acuerdo</th>
                      <th>Fecha Compromiso</th>
                      <th>Monto Comprometido</th>
                      <th>Registrado Por</th>
                      <th>Condiciones / Observaciones</th>
                      <th>Cumplimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todosLosAcuerdos.map(({ residente, acuerdo }) => (
                      <tr key={acuerdo.id}>
                        <td>
                          <strong>{residente.residenteNombre}</strong>
                          <span className="table-subinfo">C.C. {residente.numeroDocumento}</span>
                        </td>
                        <td>{formatDate(acuerdo.fechaAcuerdo)}</td>
                        <td>
                          <strong className="text-blue-700">{formatDate(acuerdo.fechaCompromiso)}</strong>
                        </td>
                        <td>
                          <strong className="text-emerald-700">{formatCOP(acuerdo.montoCompromiso)}</strong>
                        </td>
                        <td>{acuerdo.registradoPor}</td>
                        <td>
                          <p className="agreement-notes">{acuerdo.observaciones || 'Sin observaciones'}</p>
                        </td>
                        <td>
                          <span className={`obligacion-badge ${acuerdo.cumplido ? 'status-pagado' : 'status-pendiente'}`}>
                            {acuerdo.cumplido ? 'Cumplido' : 'En seguimiento'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* MODAL DETALLE / EXTRACTO OFICIAL */}
      {selectedEstadoCuenta && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-extracto-title">
          <div className="modal-content extracto-modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Casa Estudiantil San Martín • Cartera</span>
                <h3 id="modal-extracto-title">Estado de Cuenta de {selectedEstadoCuenta.residenteNombre}</h3>
              </div>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setSelectedEstadoCuenta(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body printable-extracto">
              {/* Encabezado del extracto */}
              <div className="extracto-modal-summary">
                <div>
                  <span className="detail-label">Cédula / Documento:</span>
                  <strong>{selectedEstadoCuenta.numeroDocumento}</strong>
                </div>
                <div>
                  <span className="detail-label">Habitación Asignada:</span>
                  <span>{selectedEstadoCuenta.habitacion ? `Hab. ${selectedEstadoCuenta.habitacion} - Cama ${selectedEstadoCuenta.cama ?? 'A'}` : 'No asignada'}</span>
                </div>
                <div>
                  <span className="detail-label">Condición:</span>
                  <span>{selectedEstadoCuenta.esBecado ? 'Becado por Bienestar' : 'Residente Regular'}</span>
                </div>
                <div>
                  <span className="detail-label">Semáforo de Cartera:</span>
                  <span className={`estado-mora-badge status-${selectedEstadoCuenta.estadoMora}`}>
                    {ESTADO_MORA_LABELS[selectedEstadoCuenta.estadoMora]}
                  </span>
                </div>
              </div>

              {/* Métricas destacadas */}
              <div className="extracto-metrics-grid mt-4">
                <div className="extracto-metric">
                  <span>Total Facturado</span>
                  <strong>{formatCOP(selectedEstadoCuenta.totalFacturado)}</strong>
                </div>
                <div className="extracto-metric">
                  <span>Total Pagado</span>
                  <strong className="text-emerald-700">{formatCOP(selectedEstadoCuenta.totalPagado)}</strong>
                </div>
                <div className="extracto-metric">
                  <span>Saldo Pendiente</span>
                  <strong className={selectedEstadoCuenta.saldoTotalPendiente > 0 ? 'text-red-700' : 'text-slate-700'}>
                    {formatCOP(selectedEstadoCuenta.saldoTotalPendiente)}
                  </strong>
                </div>
                <div className="extracto-metric">
                  <span>Días de Mora</span>
                  <strong className={selectedEstadoCuenta.diasMoraMaximo > 0 ? 'text-red-700' : 'text-emerald-700'}>
                    {selectedEstadoCuenta.diasMoraMaximo} días
                  </strong>
                </div>
              </div>

              {/* Tabla de Obligaciones Causadas */}
              <h5 className="section-subtitle mt-6">Cánones y Cargos Causados</h5>
              <div className="table-wrap mt-2">
                <table className="obligaciones-table">
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th>Período</th>
                      <th>Vencimiento</th>
                      <th>Monto</th>
                      <th>Pagado</th>
                      <th>Saldo</th>
                      <th>Días Mora</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEstadoCuenta.obligaciones.map((ob: ObligacionDetalle) => (
                      <tr key={ob.id}>
                        <td><strong>{ob.concepto}</strong></td>
                        <td>{ob.periodo ?? '—'}</td>
                        <td>{formatDate(ob.fechaVencimiento)}</td>
                        <td>{formatCOP(ob.montoTotal)}</td>
                        <td className="text-emerald-700">{formatCOP(ob.montoPagado)}</td>
                        <td>
                          <strong className={ob.saldoPendiente > 0 ? 'text-red-700' : 'text-slate-600'}>
                            {formatCOP(ob.saldoPendiente)}
                          </strong>
                        </td>
                        <td>
                          {ob.diasMora > 0 ? (
                            <span className="text-red-700 font-bold">{ob.diasMora} d</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td>
                          <span className={`obligacion-badge status-${ob.estado}`}>
                            {ESTADO_OBLIGACION_LABELS[ob.estado]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Historial de Abonos */}
              {selectedEstadoCuenta.abonosRecientes && selectedEstadoCuenta.abonosRecientes.length > 0 && (
                <div className="mt-6">
                  <h5 className="section-subtitle">Abonos y Comprobantes Verificados</h5>
                  <div className="table-wrap mt-2">
                    <table>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Método</th>
                          <th>Referencia</th>
                          <th>Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEstadoCuenta.abonosRecientes.map((abono) => (
                          <tr key={abono.id}>
                            <td>{formatDate(abono.fecha)}</td>
                            <td>{abono.metodoPago}</td>
                            <td><code>{abono.referencia}</code></td>
                            <td className="text-emerald-700 font-bold">{formatCOP(abono.monto)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={handleImprimir}>
                🖨️ Imprimir extracto
              </button>
              {canManageCartera && selectedEstadoCuenta.saldoTotalPendiente > 0 && (
                <button
                  type="button"
                  className="action-btn-agreement"
                  onClick={() => {
                    setAcuerdoModalResidente(selectedEstadoCuenta);
                    setAcuerdoMonto(String(selectedEstadoCuenta.saldoTotalPendiente));
                    setSelectedEstadoCuenta(null);
                  }}
                >
                  Registrar acuerdo de pago
                </button>
              )}
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedEstadoCuenta(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR ACUERDO DE PAGO */}
      {acuerdoModalResidente && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-acuerdo-title">
          <div className="modal-content acuerdo-modal">
            <h3 id="modal-acuerdo-title">Compromiso / Acuerdo de Pago</h3>
            <p className="muted">
              Establecer fecha y condiciones para sanear la mora de <strong>{acuerdoModalResidente.residenteNombre}</strong> (Saldo actual: {formatCOP(acuerdoModalResidente.saldoTotalPendiente)}).
            </p>

            <form noValidate onSubmit={handleGuardarAcuerdo} className="mt-4">
              <div className="form-grid">
                <label>
                  Monto acordado a pagar (COP) *
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="Ej. 350000"
                    value={acuerdoMonto}
                    onChange={(e) => setAcuerdoMonto(e.target.value)}
                  />
                  {acuerdoMonto && (
                    <span className="payment-formatted-hint">
                      Equivalente: <strong>{formatCOP(acuerdoMonto)}</strong>
                    </span>
                  )}
                </label>

                <label>
                  Fecha límite del compromiso *
                  <input
                    required
                    type="date"
                    value={acuerdoFechaCompromiso}
                    onChange={(e) => setAcuerdoFechaCompromiso(e.target.value)}
                  />
                </label>
              </div>

              <label className="full-width mt-3">
                Condiciones o justificación del acuerdo *
                <textarea
                  required
                  rows={3}
                  placeholder="Ej. El estudiante pagará el 50% el 15 del mes y el 50% restante a fin de mes por motivo de retraso en giro familiar."
                  value={acuerdoObservaciones}
                  onChange={(e) => setAcuerdoObservaciones(e.target.value)}
                />
              </label>

              <div className="modal-footer mt-4">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setAcuerdoModalResidente(null);
                    setAcuerdoMonto('');
                    setAcuerdoObservaciones('');
                  }}
                  disabled={savingAcuerdo}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingAcuerdo || !acuerdoMonto}
                >
                  {savingAcuerdo ? 'Guardando acuerdo...' : 'Registrar acuerdo formal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="site-footer">
        Casa Estudiantil San Martín <span>•</span> Sistema de Cartera, Estado de Cuenta y Mora
      </footer>
    </main>
  );
}
