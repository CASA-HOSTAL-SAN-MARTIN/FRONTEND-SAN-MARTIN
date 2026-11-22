import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { createPago, getPagos, rechazarPago, verificarPago } from '../api/client';
import type { EstadoPago, MetodoPago, Pago, PagoPayload, TipoPago, UserRole } from '../types';

type PaymentForm = {
  tipoPago: TipoPago;
  residenteNombre: string;
  numeroDocumento: string;
  monto: string;
  fechaPago: string;
  periodo: string;
  metodoPago: MetodoPago;
  referencia: string;
  bancoEntidad: string;
  observaciones: string;
};

const initialForm: PaymentForm = {
  tipoPago: 'mensualidad',
  residenteNombre: '',
  numeroDocumento: '',
  monto: '',
  fechaPago: new Date().toISOString().slice(0, 10),
  periodo: 'Febrero 2026',
  metodoPago: 'transferencia',
  referencia: '',
  bancoEntidad: '',
  observaciones: '',
};

const authorizedStaffRoles: UserRole[] = [
  'ADMIN_SISTEMA',
  'ADMIN_FUNDACION',
  'CONTABILIDAD',
  'COORDINACION_BIENESTAR',
];

const METODO_LABELS: Record<MetodoPago, string> = {
  transferencia: 'Transferencia Bancaria',
  consignacion: 'Consignación Bancaria',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  efectivo: 'Efectivo',
};

const TIPO_LABELS: Record<TipoPago, string> = {
  mensualidad: 'Mensualidad (Alojamiento)',
  deposito: 'Depósito en Garantía',
};

const ESTADO_LABELS: Record<EstadoPago, string> = {
  pendiente: 'Pendiente de verificación',
  verificado: 'Verificado / Aprobado',
  rechazado: 'Rechazado',
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

export function PagosPage() {
  const [activeTab, setActiveTab] = useState<'registro' | 'listado' | 'consulta'>('registro');
  const [form, setForm] = useState<PaymentForm>(initialForm);
  const [comprobanteFile, setComprobanteFile] = useState<File | undefined>();
  const [fileInputKey, setFileInputKey] = useState(0);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Filtros de listado
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Consulta individual
  const [documentoConsulta, setDocumentoConsulta] = useState('');
  const [pagosConsulta, setPagosConsulta] = useState<Pago[] | null>(null);

  // Modal de detalle y comprobante
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);

  // Modal de rechazo
  const [rejectingPagoId, setRejectingPagoId] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Rol del usuario actual
  const currentRole = (typeof window !== 'undefined' ? localStorage.getItem('userRole') : null) as UserRole | null;
  const canVerify = currentRole !== null && authorizedStaffRoles.includes(currentRole);

  const loadPagos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPagos();
      setPagos(data);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPagos();
  }, [loadPagos]);

  // KPIs y Estadísticas calculadas
  const stats = useMemo(() => {
    const totalRecaudado = pagos
      .filter((p) => p.estado === 'verificado')
      .reduce((acc, p) => acc + (Number(p.monto) || 0), 0);

    const totalDepositos = pagos
      .filter((p) => p.tipoPago === 'deposito' && p.estado === 'verificado')
      .reduce((acc, p) => acc + (Number(p.monto) || 0), 0);

    const mensualidadesCount = pagos.filter((p) => p.tipoPago === 'mensualidad').length;
    const pendientesCount = pagos.filter((p) => p.estado === 'pendiente').length;

    return { totalRecaudado, totalDepositos, mensualidadesCount, pendientesCount };
  }, [pagos]);

  // Filtrado de la tabla general
  const filteredPagos = useMemo(() => {
    return pagos.filter((pago) => {
      if (filterTipo !== 'todos' && pago.tipoPago !== filterTipo) return false;
      if (filterEstado !== 'todos' && pago.estado !== filterEstado) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = pago.residenteNombre.toLowerCase().includes(query);
        const matchesDoc = pago.numeroDocumento.toLowerCase().includes(query);
        const matchesRef = pago.referencia.toLowerCase().includes(query);
        const matchesPeriodo = pago.periodo?.toLowerCase().includes(query);
        if (!matchesName && !matchesDoc && !matchesRef && !matchesPeriodo) return false;
      }

      return true;
    });
  }, [pagos, filterTipo, filterEstado, searchQuery]);

  function updateField<K extends keyof PaymentForm>(field: K, value: PaymentForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setComprobanteFile(file);
    }
  }

  function handleRemoveFile() {
    setComprobanteFile(undefined);
    setFileInputKey((prev) => prev + 1);
  }

  function resetForm() {
    setForm(initialForm);
    setComprobanteFile(undefined);
    setFileInputKey((prev) => prev + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    const parsedMonto = Number(form.monto);
    if (!Number.isFinite(parsedMonto) || parsedMonto <= 0) {
      setError('El valor del pago debe ser un número mayor a cero.');
      return;
    }

    if (!form.residenteNombre.trim()) {
      setError('El nombre del residente es obligatorio.');
      return;
    }

    if (!form.numeroDocumento.trim()) {
      setError('El número de documento es obligatorio.');
      return;
    }

    if (!form.referencia.trim()) {
      setError('El número de referencia o comprobante es obligatorio.');
      return;
    }

    const payload: PagoPayload = {
      tipoPago: form.tipoPago,
      residenteNombre: form.residenteNombre.trim(),
      numeroDocumento: form.numeroDocumento.trim(),
      monto: parsedMonto,
      fechaPago: form.fechaPago,
      periodo: form.tipoPago === 'mensualidad' ? form.periodo.trim() : undefined,
      metodoPago: form.metodoPago,
      referencia: form.referencia.trim(),
      bancoEntidad: form.bancoEntidad.trim() || undefined,
      observaciones: form.observaciones.trim() || undefined,
    };

    setSaving(true);
    try {
      const nuevoPago = await createPago(payload, comprobanteFile);
      setNotice(`Pago registrado exitosamente con radicado ${nuevoPago.id ?? 'SM-PAG'}.`);
      resetForm();
      await loadPagos();
      setActiveTab('listado');
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function handleVerificar(pagoId: string) {
    setActionLoading(true);
    setError('');
    setNotice('');
    try {
      await verificarPago(pagoId, currentRole ?? 'PERSONAL_AUTORIZADO');
      setNotice('Pago verificado y aprobado exitosamente.');
      if (selectedPago && selectedPago.id === pagoId) {
        setSelectedPago((prev) => (prev ? { ...prev, estado: 'verificado' } : null));
      }
      await loadPagos();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRechazarConfirm() {
    if (!rejectingPagoId) return;
    if (!motivoRechazo.trim()) {
      setError('Debes especificar un motivo para el rechazo del pago.');
      return;
    }

    setActionLoading(true);
    setError('');
    setNotice('');
    try {
      await rechazarPago(rejectingPagoId, motivoRechazo.trim(), currentRole ?? 'PERSONAL_AUTORIZADO');
      setNotice('El pago ha sido marcado como rechazado.');
      setRejectingPagoId(null);
      setMotivoRechazo('');
      if (selectedPago && selectedPago.id === rejectingPagoId) {
        setSelectedPago((prev) => (prev ? { ...prev, estado: 'rechazado', motivoRechazo: motivoRechazo.trim() } : null));
      }
      await loadPagos();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setActionLoading(false);
    }
  }

  function handleConsultarDocumento(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!documentoConsulta.trim()) {
      setPagosConsulta(null);
      return;
    }
    const docQuery = documentoConsulta.trim().toLowerCase();
    const resultados = pagos.filter((p) => p.numeroDocumento.toLowerCase() === docQuery);
    setPagosConsulta(resultados);
  }

  return (
    <main className="app-shell payment-page">
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
          <span className="header-page active">Pagos y Depósitos</span>
          <span className="header-mark">PG</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="payment-hero">
        <p className="eyebrow">Gestión Financiera y Contable</p>
        <h2>Registro de Pagos Mensuales y Depósitos</h2>
        <p>
          Administra de manera transparente las mensualidades de alojamiento, los depósitos en garantía y los comprobantes bancarios de los residentes de la Casa Estudiantil San Martín.
        </p>
      </section>

      {/* Indicadores / KPIs */}
      <section className="payment-kpis-grid" aria-label="Indicadores de pagos">
        <div className="payment-kpi-card">
          <span className="kpi-label">Total Recaudado (Aprobado)</span>
          <strong className="kpi-value text-emerald-700">{formatCOP(stats.totalRecaudado)}</strong>
          <span className="kpi-subtext">Cánones y depósitos verificados</span>
        </div>
        <div className="payment-kpi-card">
          <span className="kpi-label">Depósitos en Custodia</span>
          <strong className="kpi-value text-blue-700">{formatCOP(stats.totalDepositos)}</strong>
          <span className="kpi-subtext">Fondos de garantía vigentes</span>
        </div>
        <div className="payment-kpi-card">
          <span className="kpi-label">Mensualidades Registradas</span>
          <strong className="kpi-value text-slate-800">{stats.mensualidadesCount}</strong>
          <span className="kpi-subtext">Registros en el sistema</span>
        </div>
        <div className="payment-kpi-card">
          <span className="kpi-label">Pendientes de Verificación</span>
          <strong className={`kpi-value ${stats.pendientesCount > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
            {stats.pendientesCount}
          </strong>
          <span className="kpi-subtext">Requieren revisión contable</span>
        </div>
      </section>

      {/* Notificaciones globales */}
      {notice && (
        <div className="alert success payment-alert" role="status">
          <strong>✓ Operación exitosa: </strong> {notice}
        </div>
      )}
      {error && (
        <div className="alert error payment-alert" role="alert">
          <strong>⚠ Atención: </strong> {error}
        </div>
      )}

      {/* Navegación por pestañas */}
      <nav className="tabs payment-tabs" aria-label="Secciones de pagos">
        <button
          className={`tab ${activeTab === 'registro' ? 'active' : ''}`}
          type="button"
          onClick={() => { setActiveTab('registro'); setNotice(''); setError(''); }}
        >
          ➕ Registrar Pago o Depósito
        </button>
        <button
          className={`tab ${activeTab === 'listado' ? 'active' : ''}`}
          type="button"
          onClick={() => { setActiveTab('listado'); setNotice(''); setError(''); }}
        >
          📋 Listado General ({pagos.length})
        </button>
        <button
          className={`tab ${activeTab === 'consulta' ? 'active' : ''}`}
          type="button"
          onClick={() => { setActiveTab('consulta'); setNotice(''); setError(''); }}
        >
          🔍 Consultar por Documento
        </button>
      </nav>

      {/* PESTAÑA 1: FORMULARIO DE REGISTRO */}
      {activeTab === 'registro' && (
        <section className="card payment-card narrow">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Nuevo comprobante</p>
              <h3>Registro de Pago o Depósito</h3>
            </div>
            <span className="required-note">* Campos obligatorios</span>
          </div>

          <form noValidate onSubmit={handleSubmit} className="payment-form">
            {/* Selección de Tipo de Pago */}
            <fieldset className="payment-fieldset">
              <legend>1. Tipo de Transacción</legend>
              <div className="tipo-pago-selector">
                <label className={`tipo-pago-option ${form.tipoPago === 'mensualidad' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="tipoPago"
                    value="mensualidad"
                    checked={form.tipoPago === 'mensualidad'}
                    onChange={() => updateField('tipoPago', 'mensualidad')}
                  />
                  <div>
                    <strong>Mensualidad</strong>
                    <span>Canon mensual de estadía en la casa</span>
                  </div>
                </label>
                <label className={`tipo-pago-option ${form.tipoPago === 'deposito' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="tipoPago"
                    value="deposito"
                    checked={form.tipoPago === 'deposito'}
                    onChange={() => updateField('tipoPago', 'deposito')}
                  />
                  <div>
                    <strong>Depósito en Garantía</strong>
                    <span>Fondo reembolsable de respaldo</span>
                  </div>
                </label>
              </div>
            </fieldset>

            {/* Datos del Residente */}
            <fieldset className="payment-fieldset">
              <legend>2. Identificación del Residente</legend>
              <div className="form-grid">
                <label>
                  Nombre completo del residente *
                  <input
                    required
                    type="text"
                    placeholder="Ej. Juan Andrés Pérez Gómez"
                    value={form.residenteNombre}
                    onChange={(e) => updateField('residenteNombre', e.target.value)}
                  />
                </label>
                <label>
                  Número de documento (C.C. / T.I.) *
                  <input
                    required
                    type="text"
                    placeholder="Ej. 1088234567"
                    value={form.numeroDocumento}
                    onChange={(e) => updateField('numeroDocumento', e.target.value)}
                  />
                </label>
              </div>
            </fieldset>

            {/* Datos Financieros del Pago */}
            <fieldset className="payment-fieldset">
              <legend>3. Información del Pago</legend>
              <div className="form-grid">
                <label>
                  Valor pagado (COP) *
                  <input
                    required
                    type="number"
                    min="1"
                    step="100"
                    placeholder="Ej. 350000"
                    value={form.monto}
                    onChange={(e) => updateField('monto', e.target.value)}
                  />
                  {form.monto && (
                    <span className="payment-formatted-hint">
                      Equivalente: <strong>{formatCOP(form.monto)}</strong>
                    </span>
                  )}
                </label>

                <label>
                  Fecha de la transacción *
                  <input
                    required
                    type="date"
                    value={form.fechaPago}
                    onChange={(e) => updateField('fechaPago', e.target.value)}
                  />
                </label>

                {form.tipoPago === 'mensualidad' && (
                  <label>
                    Período / Mes que cubre *
                    <input
                      required
                      type="text"
                      placeholder="Ej. Febrero 2026"
                      value={form.periodo}
                      onChange={(e) => updateField('periodo', e.target.value)}
                    />
                  </label>
                )}

                <label>
                  Método de pago *
                  <select
                    value={form.metodoPago}
                    onChange={(e) => updateField('metodoPago', e.target.value as MetodoPago)}
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="nequi">Nequi</option>
                    <option value="daviplata">Daviplata</option>
                    <option value="consignacion">Consignación Bancaria</option>
                    <option value="efectivo">Efectivo en Oficina</option>
                  </select>
                </label>

                <label>
                  Banco o Entidad emisora
                  <input
                    type="text"
                    placeholder="Ej. Bancolombia, Davivienda, etc."
                    value={form.bancoEntidad}
                    onChange={(e) => updateField('bancoEntidad', e.target.value)}
                  />
                </label>

                <label>
                  N° de comprobante / Referencia bancaria *
                  <input
                    required
                    type="text"
                    placeholder="Ej. REF-984712 / TX-5541"
                    value={form.referencia}
                    onChange={(e) => updateField('referencia', e.target.value)}
                  />
                </label>
              </div>
            </fieldset>

            {/* Soporte de Pago / Archivo */}
            <fieldset className="payment-fieldset">
              <legend>4. Comprobante / Soporte Digital</legend>
              <div className="payment-upload-zone">
                <label className="file-input-label" htmlFor="comprobante-input">
                  <span>Seleccionar archivo de soporte (Imagen o PDF)</span>
                  <input
                    id="comprobante-input"
                    key={fileInputKey}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="file-input-hidden"
                  />
                </label>

                {comprobanteFile ? (
                  <div className="file-preview-card">
                    <span className="file-icon">📄</span>
                    <div className="file-info">
                      <strong>{comprobanteFile.name}</strong>
                      <span>{(comprobanteFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button
                      type="button"
                      className="remove-file-button"
                      onClick={handleRemoveFile}
                      title="Quitar archivo"
                    >
                      ✕ Quitar
                    </button>
                  </div>
                ) : (
                  <p className="payment-upload-hint">
                    Formatos recomendados: JPG, PNG o PDF con legible número de transacción.
                  </p>
                )}
              </div>

              <label className="full-width mt-3">
                Observaciones adicionales
                <textarea
                  rows={2}
                  placeholder="Detalles adicionales sobre el pago (opcional)..."
                  value={form.observaciones}
                  onChange={(e) => updateField('observaciones', e.target.value)}
                />
              </label>
            </fieldset>

            <div className="payment-form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={resetForm}
                disabled={saving}
              >
                Limpiar formulario
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving ? 'Registrando pago...' : 'Registrar comprobante de pago'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* PESTAÑA 2: LISTADO GENERAL Y AUDITORÍA */}
      {activeTab === 'listado' && (
        <section className="payment-list-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Control de caja y conciliación</p>
              <h3>Comprobantes y Pagos Registrados</h3>
            </div>
            <button
              className="secondary-button"
              type="button"
              onClick={loadPagos}
              disabled={loading}
            >
              {loading ? 'Cargando...' : '🔄 Actualizar listado'}
            </button>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="payment-filters-bar">
            <label className="payment-search-field">
              <span>Buscar residente o referencia:</span>
              <input
                type="search"
                placeholder="Nombre, documento, n° de referencia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>

            <div className="payment-filter-group">
              <label>
                <span>Tipo de pago:</span>
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                >
                  <option value="todos">Todos los tipos</option>
                  <option value="mensualidad">Solo Mensualidades</option>
                  <option value="deposito">Solo Depósitos</option>
                </select>
              </label>

              <label>
                <span>Estado:</span>
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="verificado">Verificados</option>
                  <option value="rechazado">Rechazados</option>
                </select>
              </label>
            </div>
          </div>

          {/* Tabla de Pagos */}
          <div className="payment-table-container">
            {filteredPagos.length === 0 ? (
              <div className="empty-state">
                <strong>No se encontraron registros de pagos.</strong>
                <p>Prueba ajustando los filtros de búsqueda o registra un nuevo pago.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="payment-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Residente</th>
                      <th>Monto</th>
                      <th>Método / Ref</th>
                      <th>Comprobante</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPagos.map((pago) => (
                      <tr key={pago.id}>
                        <td>
                          <strong>{formatDate(pago.fechaPago)}</strong>
                          {pago.periodo && <span className="table-subinfo">{pago.periodo}</span>}
                        </td>
                        <td>
                          <span className={`payment-type-badge ${pago.tipoPago}`}>
                            {pago.tipoPago === 'mensualidad' ? 'Mensualidad' : 'Depósito'}
                          </span>
                        </td>
                        <td>
                          <div className="resident-table-cell">
                            <strong>{pago.residenteNombre}</strong>
                            <span className="table-subinfo">C.C. {pago.numeroDocumento}</span>
                          </div>
                        </td>
                        <td>
                          <strong className="payment-amount">{formatCOP(pago.monto)}</strong>
                        </td>
                        <td>
                          <div className="method-cell">
                            <span>{METODO_LABELS[pago.metodoPago] ?? pago.metodoPago}</span>
                            <code className="ref-code">{pago.referencia}</code>
                          </div>
                        </td>
                        <td>
                          {pago.comprobanteUrl || pago.comprobanteNombre ? (
                            <button
                              type="button"
                              className="view-receipt-link"
                              onClick={() => setSelectedPago(pago)}
                            >
                              📎 {pago.comprobanteNombre ?? 'Ver soporte'}
                            </button>
                          ) : (
                            <span className="muted">Sin adjunto</span>
                          )}
                        </td>
                        <td>
                          <span className={`payment-status-badge status-${pago.estado}`}>
                            {ESTADO_LABELS[pago.estado] ?? pago.estado}
                          </span>
                        </td>
                        <td>
                          <div className="payment-table-actions">
                            <button
                              type="button"
                              className="action-btn-detail"
                              onClick={() => setSelectedPago(pago)}
                            >
                              Detalle
                            </button>

                            {canVerify && pago.estado === 'pendiente' && (
                              <>
                                <button
                                  type="button"
                                  className="action-btn-verify"
                                  onClick={() => handleVerificar(pago.id)}
                                  disabled={actionLoading}
                                  title="Aprobar y verificar pago"
                                >
                                  ✓ Verificar
                                </button>
                                <button
                                  type="button"
                                  className="action-btn-reject"
                                  onClick={() => setRejectingPagoId(pago.id)}
                                  disabled={actionLoading}
                                  title="Rechazar pago"
                                >
                                  ✕ Rechazar
                                </button>
                              </>
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

      {/* PESTAÑA 3: CONSULTA POR DOCUMENTO */}
      {activeTab === 'consulta' && (
        <section className="card payment-card narrow">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Portal de residentes y acudientes</p>
              <h3>Consulta de Pagos y Depósitos</h3>
            </div>
          </div>
          <p className="muted">
            Ingresa el número de documento de identidad del estudiante o aspirante para ver el historial y estado de sus pagos.
          </p>

          <form onSubmit={handleConsultarDocumento} className="lookup-form mt-4">
            <label className="full-width">
              Número de documento de identidad *
              <input
                required
                type="text"
                placeholder="Ej. 1088234567"
                value={documentoConsulta}
                onChange={(e) => setDocumentoConsulta(e.target.value)}
              />
            </label>
            <button className="primary-button" type="submit">
              Consultar historial
            </button>
          </form>

          {pagosConsulta !== null && (
            <div className="mt-6">
              <h4>Historial de pagos para documento: {documentoConsulta}</h4>
              {pagosConsulta.length === 0 ? (
                <div className="empty-state mt-3">
                  <strong>No hay pagos registrados para este documento.</strong>
                  <p>Si acabas de realizar una consignación, puedes registrar el comprobante en la pestaña "Registrar Pago".</p>
                </div>
              ) : (
                <div className="table-wrap mt-3">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Concepto</th>
                        <th>Monto</th>
                        <th>Referencia</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagosConsulta.map((p) => (
                        <tr key={p.id}>
                          <td>{formatDate(p.fechaPago)}</td>
                          <td>
                            <strong>{p.tipoPago === 'mensualidad' ? `Mensualidad (${p.periodo ?? 'Estadía'})` : 'Depósito en Garantía'}</strong>
                          </td>
                          <td>{formatCOP(p.monto)}</td>
                          <td><code>{p.referencia}</code></td>
                          <td>
                            <span className={`payment-status-badge status-${p.estado}`}>
                              {ESTADO_LABELS[p.estado]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* MODAL DE DETALLE Y COMPROBANTE */}
      {selectedPago && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-pago-title">
          <div className="modal-content payment-modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Detalle de Comprobante</span>
                <h3 id="modal-pago-title">Radicado #{selectedPago.id}</h3>
              </div>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setSelectedPago(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="payment-detail-grid">
                <div>
                  <span className="detail-label">Residente:</span>
                  <strong>{selectedPago.residenteNombre}</strong>
                </div>
                <div>
                  <span className="detail-label">Documento:</span>
                  <span>{selectedPago.numeroDocumento}</span>
                </div>
                <div>
                  <span className="detail-label">Concepto:</span>
                  <span className={`payment-type-badge ${selectedPago.tipoPago}`}>
                    {TIPO_LABELS[selectedPago.tipoPago]}
                  </span>
                </div>
                <div>
                  <span className="detail-label">Monto cancelado:</span>
                  <strong className="text-emerald-700 text-lg">{formatCOP(selectedPago.monto)}</strong>
                </div>
                <div>
                  <span className="detail-label">Fecha del pago:</span>
                  <span>{formatDate(selectedPago.fechaPago)}</span>
                </div>
                <div>
                  <span className="detail-label">Período cubierto:</span>
                  <span>{selectedPago.periodo ?? 'N/A'}</span>
                </div>
                <div>
                  <span className="detail-label">Método y Entidad:</span>
                  <span>{METODO_LABELS[selectedPago.metodoPago]} {selectedPago.bancoEntidad ? `(${selectedPago.bancoEntidad})` : ''}</span>
                </div>
                <div>
                  <span className="detail-label">Referencia / Transacción:</span>
                  <code>{selectedPago.referencia}</code>
                </div>
                <div>
                  <span className="detail-label">Estado actual:</span>
                  <span className={`payment-status-badge status-${selectedPago.estado}`}>
                    {ESTADO_LABELS[selectedPago.estado]}
                  </span>
                </div>
                <div>
                  <span className="detail-label">Fecha de registro:</span>
                  <span>{formatDate(selectedPago.fechaRegistro)}</span>
                </div>
              </div>

              {selectedPago.observaciones && (
                <div className="payment-observations-box">
                  <span className="detail-label">Observaciones:</span>
                  <p>{selectedPago.observaciones}</p>
                </div>
              )}

              {selectedPago.motivoRechazo && (
                <div className="payment-rejection-box">
                  <span className="detail-label text-red-700 font-bold">Motivo del rechazo:</span>
                  <p>{selectedPago.motivoRechazo}</p>
                </div>
              )}

              {/* Sección de comprobante adjunto */}
              <div className="payment-receipt-preview-zone">
                <span className="detail-label font-bold">Soporte bancario adjunto:</span>
                {selectedPago.comprobanteUrl ? (
                  <div className="receipt-container">
                    <img
                      src={selectedPago.comprobanteUrl}
                      alt="Comprobante de pago"
                      className="receipt-image-preview"
                    />
                  </div>
                ) : selectedPago.comprobanteNombre ? (
                  <div className="file-preview-card mt-2">
                    <span className="file-icon">📄</span>
                    <div className="file-info">
                      <strong>{selectedPago.comprobanteNombre}</strong>
                      <span>Documento cargado en el sistema</span>
                    </div>
                  </div>
                ) : (
                  <p className="muted">No se adjuntó archivo fotográfico en el momento del registro.</p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {canVerify && selectedPago.estado === 'pendiente' && (
                <>
                  <button
                    type="button"
                    className="action-btn-reject"
                    onClick={() => {
                      setRejectingPagoId(selectedPago.id);
                      setSelectedPago(null);
                    }}
                    disabled={actionLoading}
                  >
                    Rechazar pago
                  </button>
                  <button
                    type="button"
                    className="action-btn-verify"
                    onClick={() => handleVerificar(selectedPago.id)}
                    disabled={actionLoading}
                  >
                    ✓ Aprobar y verificar
                  </button>
                </>
              )}
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedPago(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIÁLOGO / MODAL DE RECHAZO */}
      {rejectingPagoId && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-reject-title">
          <div className="modal-content payment-reject-modal">
            <h3 id="modal-reject-title">Motivo de Rechazo del Pago</h3>
            <p className="muted">
              Por favor indica la razón por la cual no es válido este pago (por ejemplo: comprobante ilegible, referencia no encontrada en extracto bancario, monto incorrecto).
            </p>

            <label className="full-width mt-3">
              Detalle del motivo *
              <textarea
                required
                rows={3}
                placeholder="Escribe el motivo del rechazo..."
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
              />
            </label>

            <div className="modal-footer mt-4">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setRejectingPagoId(null);
                  setMotivoRechazo('');
                }}
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="action-btn-reject"
                onClick={handleRechazarConfirm}
                disabled={actionLoading || !motivoRechazo.trim()}
              >
                {actionLoading ? 'Procesando...' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="site-footer">
        Casa Estudiantil San Martín <span>•</span> Sistema de Gestión de Pagos y Cartera
      </footer>
    </main>
  );
}
