import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { createContrato, getContrato, getContratos, updateContrato } from '../api/client';
import type { Contrato, ContratoPayload, ResidenteContrato } from '../types/contratos';
import type { UserRole } from '../types';

type ContractForm = {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  correo: string;
  telefono: string;
  fechaInicio: string;
  fechaFin: string;
};

const initialForm: ContractForm = {
  nombres: '',
  apellidos: '',
  tipoDocumento: 'CC',
  numeroDocumento: '',
  correo: '',
  telefono: '',
  fechaInicio: '',
  fechaFin: '',
};

const authorizedRoles: UserRole[] = ['ADMIN_SISTEMA', 'ADMIN_FUNDACION'];

function getApiError(error: unknown) {
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

function contractResident(contract: Contrato): ResidenteContrato {
  const resident = contract.residente ?? contract.estudiante;
  return {
    nombres: resident?.nombres ?? contract.nombres ?? '',
    apellidos: resident?.apellidos ?? contract.apellidos ?? '',
    tipoDocumento: resident?.tipoDocumento ?? 'CC',
    numeroDocumento: resident?.numeroDocumento ?? contract.numeroDocumento ?? '',
    correo: resident?.correo ?? '',
    telefono: resident?.telefono ?? '',
  };
}

function formatMoney(value: Contrato['valorDeposito']) {
  if (value === null || value === undefined || value === '') return 'Pendiente de respuesta de la API';
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) return String(value);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-CO');
}

function getContractName(contract: Contrato) {
  const resident = contractResident(contract);
  return `${resident.nombres} ${resident.apellidos}`.trim() || 'Residente sin nombre';
}

function getDocumentUrl(contract: Contrato) {
  return contract.documentoUrl ?? contract.documentoContratoUrl ?? null;
}

function statusClass(status?: string | null) {
  const safeStatus = (status ?? 'sin-estado')
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `contract-status-${safeStatus || 'sin-estado'}`;
}

export function ContratosPage() {
  const role = localStorage.getItem('userRole') as UserRole | null;
  const canManage = role !== null && authorizedRoles.includes(role);
  const [contracts, setContracts] = useState<Contrato[]>([]);
  const [form, setForm] = useState(initialForm);
  const [documentFile, setDocumentFile] = useState<File | undefined>();
  const [fileInputKey, setFileInputKey] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');

  const loadContracts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setContracts(await getContratos());
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManage) void loadContracts();
    else setLoading(false);
  }, [canManage, loadContracts]);

  const visibleContracts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es');
    if (!query) return contracts;
    return contracts.filter((contract) => {
      const resident = contractResident(contract);
      return [
        contract.id,
        resident.nombres,
        resident.apellidos,
        resident.numeroDocumento,
        contract.estado,
      ].some((value) => String(value ?? '').toLocaleLowerCase('es').includes(query));
    });
  }, [contracts, search]);

  function updateField(field: keyof ContractForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function startEditing(contract: Contrato) {
    setLoadingEditId(contract.id);
    setNotice('');
    setError('');
    let details = contract;
    try {
      details = await getContrato(contract.id);
    } catch {
      // The list may already contain enough information to edit when detail is unavailable.
    }
    const resident = contractResident(details);
    setEditingId(details.id);
    setForm({
      nombres: resident.nombres,
      apellidos: resident.apellidos,
      tipoDocumento: resident.tipoDocumento ?? 'CC',
      numeroDocumento: resident.numeroDocumento,
      correo: resident.correo ?? '',
      telefono: resident.telefono ?? '',
      fechaInicio: details.fechaInicio?.slice(0, 10) ?? '',
      fechaFin: details.fechaFin?.slice(0, 10) ?? '',
    });
    setDocumentFile(undefined);
    setFileInputKey((current) => current + 1);
    setLoadingEditId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
    setDocumentFile(undefined);
    setFileInputKey((current) => current + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (form.fechaFin && form.fechaFin < form.fechaInicio) {
      setError('La fecha de finalización no puede ser anterior a la fecha de inicio.');
      return;
    }

    const payload: ContratoPayload = {
      residente: {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        tipoDocumento: form.tipoDocumento,
        numeroDocumento: form.numeroDocumento.trim(),
        correo: form.correo.trim(),
        telefono: form.telefono.trim(),
      },
      fechaInicio: form.fechaInicio,
      ...(form.fechaFin ? { fechaFin: form.fechaFin } : {}),
    };

    setSaving(true);
    try {
      if (editingId) await updateContrato(editingId, payload, documentFile);
      else await createContrato(payload, documentFile);

      setNotice(editingId ? 'Contrato actualizado correctamente.' : 'Contrato registrado correctamente.');
      resetForm();
      await loadContracts();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  }

  if (!canManage) {
    return (
      <main className="app-shell">
        <header className="topbar">
          <Link className="brand" to="/">
            <span className="brand-seal">SM</span>
            <span className="brand-name">CASA ESTUDIANTIL<strong>SAN MARTÍN</strong></span>
          </Link>
        </header>
        <section className="locked contract-access-denied" role="alert">
          <strong>Acceso restringido</strong>
          <p>La gestión de contratos está disponible únicamente para personal autorizado.</p>
          <Link className="header-link" to="/">Volver al inicio</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell contract-page">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-seal">SM</span>
          <span className="brand-name">CASA ESTUDIANTIL<strong>SAN MARTÍN</strong></span>
        </Link>
        <div className="header-actions">
          <Link className="header-link" to="/">Solicitudes</Link>
          <Link className="header-link" to="/lista-espera">Lista de espera</Link>
          <Link className="header-link" to="/aspirantes">Aspirantes</Link>
          <Link className="header-link" to="/camas">Estado de camas</Link>
          <span className="header-page active">Contratos</span>
          <Link className="header-link" to="/pagos">Pagos</Link>
          <Link className="header-link" to="/estado-cuenta">Estado de Cuenta</Link>
          <span className="header-mark">CS</span>
        </div>
      </header>

      <section className="contract-hero">
        <p className="eyebrow">Gestión autorizada</p>
        <h1>Contratos y residentes</h1>
        <p>Registra los datos del residente, consulta contratos y actualiza su información.</p>
      </section>

      {(error || notice) && (
        <div className={error ? 'alert error contract-alert' : 'alert success contract-alert'} role={error ? 'alert' : 'status'}>
          {error || notice}
        </div>
      )}

      <section className="card contract-card" aria-labelledby="contract-form-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{editingId ? 'Edición' : 'Nuevo registro'}</p>
            <h2 id="contract-form-title">{editingId ? 'Actualizar contrato' : 'Registrar residente y contrato'}</h2>
          </div>
          {editingId && <button className="secondary-button" type="button" onClick={resetForm}>Cancelar edición</button>}
        </div>

        <form onSubmit={handleSubmit}>
          <fieldset className="contract-fieldset">
            <legend>Datos del residente</legend>
            <div className="form-grid">
              <label>Nombres *<input required maxLength={100} autoComplete="given-name" value={form.nombres} onChange={(event) => updateField('nombres', event.target.value)} /></label>
              <label>Apellidos *<input required maxLength={100} autoComplete="family-name" value={form.apellidos} onChange={(event) => updateField('apellidos', event.target.value)} /></label>
              <label>Tipo de documento *
                <select required value={form.tipoDocumento} onChange={(event) => updateField('tipoDocumento', event.target.value)}>
                  <option value="CC">Cédula de ciudadanía</option>
                  <option value="TI">Tarjeta de identidad</option>
                  <option value="CE">Cédula de extranjería</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </label>
              <label>Número de documento *<input required maxLength={30} autoComplete="off" value={form.numeroDocumento} onChange={(event) => updateField('numeroDocumento', event.target.value)} /></label>
              <label>Correo electrónico<input type="email" maxLength={150} autoComplete="email" value={form.correo} onChange={(event) => updateField('correo', event.target.value)} /></label>
              <label>Teléfono<input type="tel" maxLength={30} autoComplete="tel" value={form.telefono} onChange={(event) => updateField('telefono', event.target.value)} /></label>
            </div>
          </fieldset>

          <fieldset className="contract-fieldset">
            <legend>Información del contrato</legend>
            <div className="form-grid">
              <label>Fecha de inicio *<input required type="date" value={form.fechaInicio} onChange={(event) => updateField('fechaInicio', event.target.value)} /></label>
              <label>Fecha de finalización<input type="date" min={form.fechaInicio || undefined} value={form.fechaFin} onChange={(event) => updateField('fechaFin', event.target.value)} /></label>
              <label className="full-width">Documento del contrato
                <input
                  key={fileInputKey}
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={(event) => setDocumentFile(event.target.files?.[0])}
                  type="file"
                />
                <span className="contract-help">Formatos provisionales: PDF, JPG o PNG. El archivo se envía junto con el registro.</span>
              </label>
            </div>
            <p className="contract-help contract-deposit-note">
              El valor del depósito y el estado del contrato se mostrarán según la respuesta de la API; no se fijan manualmente en este formulario.
            </p>
          </fieldset>

          <div className="contract-form-actions">
            <button className="primary-button" disabled={saving} type="submit">
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Registrar contrato'}
            </button>
          </div>
        </form>
      </section>

      <section className="contract-list-section" aria-labelledby="contract-list-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Consulta</p>
            <h2 id="contract-list-title">Contratos registrados</h2>
          </div>
          <button className="secondary-button" disabled={loading} onClick={() => void loadContracts()} type="button">
            {loading ? 'Actualizando...' : 'Actualizar lista'}
          </button>
        </div>

        <label className="contract-search">Buscar por residente, documento o estado
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Escribe para filtrar" />
        </label>

        {loading && <div className="empty-state"><span className="loader" />Cargando contratos...</div>}
        {!loading && !error && visibleContracts.length === 0 && (
          <div className="empty-state">
            <strong>{contracts.length ? 'No hay resultados' : 'Aún no hay contratos registrados'}</strong>
            <span>{contracts.length ? 'Prueba con otro nombre, documento o estado.' : 'Los contratos aparecerán aquí cuando la API devuelva registros.'}</span>
          </div>
        )}
        {!loading && visibleContracts.length > 0 && (
          <div className="table-wrap contract-table-wrap">
            <table className="contract-table">
              <thead>
                <tr><th>Residente</th><th>Documento</th><th>Vigencia</th><th>Depósito</th><th>Estado</th><th>Archivo</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {visibleContracts.map((contract) => {
                  const resident = contractResident(contract);
                  const documentUrl = getDocumentUrl(contract);
                  return (
                    <tr key={contract.id}>
                      <td>{getContractName(contract)}</td>
                      <td>{resident.numeroDocumento || '—'}</td>
                      <td>{formatDate(contract.fechaInicio)} – {formatDate(contract.fechaFin)}</td>
                      <td>{formatMoney(contract.valorDeposito)}</td>
                      <td><span className={`contract-status ${statusClass(contract.estado)}`}>{contract.estado || 'Sin estado'}</span></td>
                      <td>{documentUrl ? <a href={documentUrl} rel="noreferrer" target="_blank">Ver documento</a> : '—'}</td>
                      <td><button className="contract-edit-button" disabled={loadingEditId !== null} onClick={() => void startEditing(contract)} type="button">{loadingEditId === contract.id ? 'Cargando...' : 'Editar'}</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <footer className="site-footer">Casa Estudiantil San Martín <span>•</span> Gestión de contratos</footer>
    </main>
  );
}
