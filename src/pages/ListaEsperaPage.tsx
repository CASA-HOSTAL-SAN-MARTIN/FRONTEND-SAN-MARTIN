import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { createEntradaListaEspera, getListaEspera, updateEntradaListaEspera } from '../api/client';
import type { EntradaListaEspera, EstadoListaEspera, UserRole } from '../types';

const authorizedRoles: UserRole[] = ['ADMIN_SISTEMA', 'COORDINACION_BIENESTAR', 'ADMIN_FUNDACION'];

const statusLabels: Record<EstadoListaEspera, string> = {
  pendiente: 'En espera',
  asignado: 'Asignado a cama',
  retirado: 'Retirado / Desistió',
};

function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
    if (error.response?.status === 409) {
      return 'El aspirante ya pertenece a la lista de espera.';
    }
    if (!error.response) {
      return 'No fue posible conectar con el servidor. Verifica que la API esté disponible.';
    }
  }
  return 'No fue posible procesar la solicitud. Inténtalo nuevamente.';
}

export function ListaEsperaPage() {
  const [entries, setEntries] = useState<EntradaListaEspera[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [onlyVulnerable, setOnlyVulnerable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // New entry modal/form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAspiranteId, setNewAspiranteId] = useState('');

  // Confirmation modal for status change
  const [confirmModal, setConfirmModal] = useState<{
    entry: EntradaListaEspera;
    nextStatus: EstadoListaEspera;
  } | null>(null);

  const currentRole = localStorage.getItem('userRole') as UserRole | null;
  const canManage = currentRole !== null && authorizedRoles.includes(currentRole);
  const canManageContracts = currentRole === 'ADMIN_SISTEMA' || currentRole === 'ADMIN_FUNDACION';

  const loadListaEspera = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getListaEspera();
      setEntries(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadListaEspera();
  }, [loadListaEspera]);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Filter by status
    if (filterStatus !== 'todos') {
      result = result.filter((e) => e.estado === filterStatus);
    }

    // Filter by vulnerability / beca
    if (onlyVulnerable) {
      result = result.filter(
        (e) => Boolean(e.aspirante?.vulnerabilidad) || Boolean(e.aspirante?.tieneBeca),
      );
    }

    // Filter by search query
    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      result = result.filter((e) => {
        const idMatch = e.id.toLowerCase().includes(query) || e.aspiranteId.toLowerCase().includes(query);
        const nameMatch = e.aspirante?.nombreCompleto?.toLowerCase().includes(query) ?? false;
        const docMatch = canManage && (e.aspirante?.numDoc?.toLowerCase().includes(query) ?? false);
        const progMatch = e.aspirante?.programa?.toLowerCase().includes(query) ?? false;
        return idMatch || nameMatch || docMatch || progMatch;
      });
    }

    // Sort by date (createdAt)
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [entries, filterStatus, onlyVulnerable, searchTerm, sortOrder, canManage]);

  // Pagination calculation
  const totalItems = filteredEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + pageSize);

  // Add aspirante to waitlist
  async function handleAddEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const aspiranteId = newAspiranteId.trim();
    if (!aspiranteId) {
      setError('Debes ingresar un identificador de aspirante válido.');
      return;
    }

    setError('');
    setNotice('');
    setActionLoading(true);
    try {
      const created = await createEntradaListaEspera({ aspiranteId });
      setEntries((current) => [...current, created]);
      setNewAspiranteId('');
      setShowAddForm(false);
      setNotice(`Aspirante (${created.aspiranteId.slice(0, 8)}...) incorporado exitosamente a la lista de espera.`);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setActionLoading(false);
    }
  }

  // Request status change with confirmation
  function handleRequestStatusChange(entry: EntradaListaEspera, nextStatus: EstadoListaEspera) {
    if (entry.estado === nextStatus) return;
    setConfirmModal({ entry, nextStatus });
  }

  // Execute confirmed status change
  async function handleConfirmStatusChange() {
    if (!confirmModal) return;
    const { entry, nextStatus } = confirmModal;

    setError('');
    setNotice('');
    setActionLoading(true);
    try {
      const updated = await updateEntradaListaEspera(entry.id, { estado: nextStatus });
      setEntries((current) =>
        current.map((item) => (item.id === entry.id ? { ...item, estado: updated.estado } : item)),
      );
      setNotice(`Estado del aspirante actualizado a "${statusLabels[nextStatus]}".`);
      setConfirmModal(null);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-seal">SM</span>
          <span className="brand-name">
            CASA ESTUDIANTIL<strong>SAN MARTÍN</strong>
          </span>
        </Link>
        <div className="header-actions">
          <Link className="header-link" to="/">Solicitudes</Link>
          <span className="header-page active">Lista de espera</span>
          <Link className="header-link" to="/camas">Estado de camas</Link>
          {canManageContracts && <Link className="header-link" to="/contratos">Contratos</Link>}
          <span className="topbar-divider" />
          <span className="header-mark">CS</span>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow hero-label"><span aria-hidden="true">▣</span> Admisiones y Bienestar</p>
          <h2>Gestión de lista de espera unificada</h2>
          <p>
            Centraliza los aspirantes en espera de asignación de cupo. Orden oficial de prioridad por
            llegada y criterios de vulnerabilidad de Bienestar Universitario.
          </p>
          <span className="hero-rule" />
        </div>
        <div className="hero-image">
          <img src="/university-building.png" alt="Edificio universitario rodeado de jardines" />
        </div>
      </section>

      {/* Role notice if not authorized */}
      {!canManage && (
        <aside
          className="alert"
          role="status"
          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569' }}
        >
          <strong>Modo consulta pública:</strong> Los datos personales sensibles (como números de documento y notas
          socioeconómicas privadas) y las acciones de cambio de estado están restringidos al personal autorizado
          de Bienestar Universitario y Administración.
        </aside>
      )}

      {(error || notice) && (
        <div className={error ? 'alert error' : 'alert success'} role={error ? 'alert' : 'status'}>
          {error || notice}
        </div>
      )}

      <section className="card" style={{ display: 'block', marginBottom: '24px' }}>
        <div className="section-heading" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p className="eyebrow">Control unificado</p>
            <h3>Aspirantes en espera ({filteredEntries.length})</h3>
            <p className="muted">
              Consulta el orden de prelación, filtra por estado y administra la asignación de camas.
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowAddForm(!showAddForm)}
              style={{ margin: 0 }}
            >
              {showAddForm ? 'Cancelar' : '+ Incorporar aspirante'}
            </button>
          )}
        </div>

        {/* Collapsible form to incorporate aspirante */}
        {showAddForm && canManage && (
          <form
            onSubmit={handleAddEntry}
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              padding: '18px',
              marginBottom: '20px',
            }}
          >
            <h4 style={{ margin: '0 0 10px', color: '#1e3a8a' }}>Incorporar aspirante a la lista de espera</h4>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label style={{ flex: '1 1 300px' }}>
                Identificador del aspirante (UUID) *
                <input
                  required
                  placeholder="Ej. b6f2e7fb-1d9a-4d7d-9bc5-1a15e72f21cb"
                  value={newAspiranteId}
                  onChange={(e) => setNewAspiranteId(e.target.value)}
                />
              </label>
              <button className="primary-button" type="submit" disabled={actionLoading} style={{ margin: 0 }}>
                {actionLoading ? 'Incorporando...' : 'Registrar en espera'}
              </button>
            </div>
          </form>
        )}

        {/* Filters Toolbar */}
        <div
          className="board-toolbar"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
            alignItems: 'flex-end',
            marginBottom: '20px',
            padding: '16px',
          }}
        >
          <label style={{ minWidth: '160px' }}>
            Estado
            <select
              aria-label="Filtro por estado"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">En espera (Pendiente)</option>
              <option value="asignado">Asignados a cama</option>
              <option value="retirado">Retirados</option>
            </select>
          </label>

          <label style={{ minWidth: '160px' }}>
            Orden cronológico
            <select
              aria-label="Orden cronológico"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            >
              <option value="asc">Por orden de llegada (Más antiguos primero)</option>
              <option value="desc">Más recientes primero</option>
            </select>
          </label>

          <label style={{ flex: '1 1 200px' }}>
            Buscar aspirante
            <input
              type="search"
              aria-label="Buscar aspirante"
              placeholder="Buscar por nombre, documento o identificador..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
            <input
              type="checkbox"
              aria-label="Solo casos vulnerables o con beca"
              checked={onlyVulnerable}
              onChange={(e) => {
                setOnlyVulnerable(e.target.checked);
                setCurrentPage(1);
              }}
              style={{ width: 'auto' }}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a8a' }}>
              Solo vulnerables / becas
            </span>
          </label>
        </div>

        {/* Content area: Loading, Empty or Table */}
        {loading ? (
          <div className="empty-state">
            <div className="loader" role="status" aria-label="Cargando lista de espera" />
            <p>Cargando lista de espera unificada...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron aspirantes en la lista de espera con los criterios especificados.</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.82rem' }}>
                    <th style={{ padding: '12px 10px', width: '50px' }}>#</th>
                    <th style={{ padding: '12px 10px' }}>Aspirante</th>
                    <th style={{ padding: '12px 10px' }}>Documento</th>
                    <th style={{ padding: '12px 10px' }}>Programa</th>
                    <th style={{ padding: '12px 10px' }}>Estado</th>
                    <th style={{ padding: '12px 10px' }}>Fecha registro</th>
                    {canManage && <th style={{ padding: '12px 10px', textAlign: 'center' }}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedEntries.map((entry, index) => {
                    const position = startIndex + index + 1;
                    return (
                      <tr
                        key={entry.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          fontSize: '0.88rem',
                          background: entry.estado === 'asignado' ? '#f0fdf4' : entry.estado === 'retirado' ? '#fff7f7' : '#fff',
                        }}
                      >
                        <td style={{ padding: '12px 10px', fontWeight: 800, color: '#1e3a8a' }}>
                          #{position}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <strong>{entry.aspirante?.nombreCompleto ?? 'Aspirante registrado'}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            ID: <code>{entry.aspiranteId.slice(0, 8)}...</code>
                            {entry.aspirante?.vulnerabilidad && (
                              <span
                                style={{
                                  marginLeft: '6px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: '#fee2e2',
                                  color: '#991b1b',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                }}
                              >
                                Vulnerable
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          {canManage ? (
                            entry.aspirante?.numDoc ?? 'Doc. registrado'
                          ) : (
                            <span style={{ color: '#94a3b8' }} title="Dato protegido">*** Protegido ***</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 10px', color: '#334155' }}>
                          {entry.aspirante?.programa ?? 'Pregrado Otún'}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span
                            className={
                              entry.estado === 'asignado'
                                ? 'status status-aprobada'
                                : entry.estado === 'retirado'
                                ? 'status status-rechazada'
                                : 'status status-pendiente'
                            }
                          >
                            {statusLabels[entry.estado]}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', color: '#64748b', fontSize: '0.82rem' }}>
                          {new Date(entry.createdAt).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        {canManage && (
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              {entry.estado !== 'asignado' && (
                                <button
                                  type="button"
                                  className="secondary-button"
                                  style={{ padding: '5px 9px', fontSize: '0.75rem', color: '#166534', background: '#dcfce7' }}
                                  onClick={() => handleRequestStatusChange(entry, 'asignado')}
                                  title="Marcar como asignado a cama"
                                >
                                  Asignar
                                </button>
                              )}
                              {entry.estado !== 'retirado' && (
                                <button
                                  type="button"
                                  className="secondary-button"
                                  style={{ padding: '5px 9px', fontSize: '0.75rem', color: '#991b1b', background: '#fee2e2' }}
                                  onClick={() => handleRequestStatusChange(entry, 'retirado')}
                                  title="Marcar como retirado"
                                >
                                  Retirar
                                </button>
                              )}
                              {entry.estado !== 'pendiente' && (
                                <button
                                  type="button"
                                  className="secondary-button"
                                  style={{ padding: '5px 9px', fontSize: '0.75rem' }}
                                  onClick={() => handleRequestStatusChange(entry, 'pendiente')}
                                  title="Devolver a lista pendiente"
                                >
                                  A espera
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                Mostrando <strong>{startIndex + 1}</strong> a{' '}
                <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> de{' '}
                <strong>{totalItems}</strong> aspirantes
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', margin: 0 }}>
                  Por página:
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    style={{ padding: '4px 8px', minWidth: '70px' }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </label>

                <button
                  type="button"
                  className="secondary-button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  Anterior
                </button>

                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', padding: '0 4px' }}>
                  {safeCurrentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  className="secondary-button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-confirm-title">
          <div className="confirmation-modal">
            <p className="eyebrow">Confirmación requerida</p>
            <h3 id="modal-confirm-title">Confirmar cambio de estado</h3>
            <p>
              ¿Confirmas el cambio de estado de este aspirante a{' '}
              <strong style={{ color: '#1260cf' }}>
                "{statusLabels[confirmModal.nextStatus]}"
              </strong>
              ?
            </p>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                margin: '12px 0',
                fontSize: '0.85rem',
              }}
            >
              <div><strong>Aspirante:</strong> {confirmModal.entry.aspirante?.nombreCompleto ?? confirmModal.entry.aspiranteId}</div>
              <div><strong>Estado actual:</strong> {statusLabels[confirmModal.entry.estado]}</div>
              <div><strong>Nuevo estado:</strong> {statusLabels[confirmModal.nextStatus]}</div>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Esta modificación afectará la prioridad en la lista unificada y notificará la novedad al sistema.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setConfirmModal(null)}
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleConfirmStatusChange}
                disabled={actionLoading}
              >
                {actionLoading ? 'Actualizando...' : 'Confirmar cambio'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="site-footer">
        Casa Estudiantil San Martín <span>•</span> Apoyo, bienestar y educación
      </footer>
    </main>
  );
}
