import { type FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { createAspirante, getAspirante, updateAspirante } from '../api/client';
import type { Aspirante, AspiranteAuditEntry, AspirantePayload, UserRole } from '../types';

type AspiranteFormState = {
  nombreCompleto: string;
  numDoc: string;
  edad: string;
  programa: string;
  promedio: string;
  universidad: string;
  estrato: string;
  ciudadOrigen: string;
  ingresosFamiliares: string;
  observaciones: string;
};

const initialForm: AspiranteFormState = {
  nombreCompleto: '',
  numDoc: '',
  edad: '',
  programa: '',
  promedio: '',
  universidad: 'Universidad del Otún',
  estrato: '1',
  ciudadOrigen: '',
  ingresosFamiliares: '',
  observaciones: '',
};

const DRAFT_STORAGE_KEY = 'aspirante_form_draft';
const HISTORY_STORAGE_PREFIX = 'aspirante_audit_history_';

function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
    if (!error.response) {
      return 'No fue posible conectar con el servidor. Verifica que la API esté disponible.';
    }
  }
  return 'No fue posible procesar la solicitud. Inténtalo nuevamente.';
}

export function AspirantesPage() {
  const [activeTab, setActiveTab] = useState<'form' | 'lookup' | 'history'>('form');
  const [form, setForm] = useState<AspiranteFormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalAspirante, setOriginalAspirante] = useState<Aspirante | null>(null);
  const [createdAspirante, setCreatedAspirante] = useState<Aspirante | null>(null);
  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState<Aspirante | null>(null);
  const [auditHistory, setAuditHistory] = useState<AspiranteAuditEntry[]>([]);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const currentRole = localStorage.getItem('userRole') as UserRole | null;
  const canManageContracts = currentRole === 'ADMIN_SISTEMA' || currentRole === 'ADMIN_FUNDACION';

  // Check draft on mount
  useEffect(() => {
    try {
      const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft);
        if (parsed.form) {
          setHasDraft(true);
          setDraftSavedAt(parsed.savedAt ?? null);
        }
      }
    } catch {
      // Ignore invalid draft
    }
  }, []);

  // Real-time minor detection
  const parsedEdad = form.edad.trim() !== '' ? parseInt(form.edad, 10) : null;
  const isMinor = parsedEdad !== null && !isNaN(parsedEdad) && parsedEdad < 18;
  const isAdult = parsedEdad !== null && !isNaN(parsedEdad) && parsedEdad >= 18;

  function updateField(field: keyof AspiranteFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSaveDraft() {
    try {
      const timestamp = new Date().toLocaleString('es-CO');
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ form, savedAt: timestamp }),
      );
      setHasDraft(true);
      setDraftSavedAt(timestamp);
      setNotice(`Borrador guardado localmente (${timestamp}).`);
      setError('');
    } catch {
      setError('No fue posible guardar el borrador en el almacenamiento local.');
    }
  }

  function handleLoadDraft() {
    try {
      const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft);
        if (parsed.form) {
          setForm(parsed.form);
          setNotice('Borrador cargado correctamente en el formulario.');
          setError('');
        }
      }
    } catch {
      setError('No se pudo cargar el borrador.');
    }
  }

  function handleDiscardDraft() {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraft(false);
    setDraftSavedAt(null);
    setNotice('Borrador descartado.');
  }

  function loadAuditHistory(id: string) {
    try {
      const raw = localStorage.getItem(`${HISTORY_STORAGE_PREFIX}${id}`);
      if (raw) {
        setAuditHistory(JSON.parse(raw));
      } else {
        setAuditHistory([]);
      }
    } catch {
      setAuditHistory([]);
    }
  }

  function recordAuditHistory(id: string, original: Aspirante, updated: AspirantePayload) {
    const changes: AspiranteAuditEntry[] = [];
    const now = new Date().toLocaleString('es-CO');
    const user = currentRole ?? 'Aspirante/Usuario';

    if (original.nombreCompleto !== updated.nombreCompleto) {
      changes.push({
        id: `${Date.now()}-1`,
        timestamp: now,
        usuario: user,
        campo: 'Nombre completo',
        valorAnterior: original.nombreCompleto,
        valorNuevo: updated.nombreCompleto,
      });
    }
    if (original.numDoc !== updated.numDoc) {
      changes.push({
        id: `${Date.now()}-2`,
        timestamp: now,
        usuario: user,
        campo: 'Número de documento',
        valorAnterior: original.numDoc,
        valorNuevo: updated.numDoc,
      });
    }
    if (original.edad !== updated.edad) {
      changes.push({
        id: `${Date.now()}-3`,
        timestamp: now,
        usuario: user,
        campo: 'Edad',
        valorAnterior: original.edad,
        valorNuevo: updated.edad,
      });
    }
    if (original.programa !== updated.programa) {
      changes.push({
        id: `${Date.now()}-4`,
        timestamp: now,
        usuario: user,
        campo: 'Programa académico',
        valorAnterior: original.programa,
        valorNuevo: updated.programa,
      });
    }
    if (original.promedio !== updated.promedio) {
      changes.push({
        id: `${Date.now()}-5`,
        timestamp: now,
        usuario: user,
        campo: 'Promedio académico',
        valorAnterior: original.promedio,
        valorNuevo: updated.promedio,
      });
    }

    if (changes.length > 0) {
      try {
        const raw = localStorage.getItem(`${HISTORY_STORAGE_PREFIX}${id}`);
        const existing: AspiranteAuditEntry[] = raw ? JSON.parse(raw) : [];
        const next = [...changes, ...existing];
        localStorage.setItem(`${HISTORY_STORAGE_PREFIX}${id}`, JSON.stringify(next));
        setAuditHistory(next);
      } catch {
        // ignore storage error
      }
    }
  }

  function handleStartEditing(aspirante: Aspirante) {
    setEditingId(aspirante.id);
    setOriginalAspirante(aspirante);
    setForm({
      nombreCompleto: aspirante.nombreCompleto,
      numDoc: aspirante.numDoc,
      edad: String(aspirante.edad),
      programa: aspirante.programa,
      promedio: String(aspirante.promedio),
      universidad: 'Universidad del Otún',
      estrato: aspirante.socioeconomico?.estrato ? String(aspirante.socioeconomico.estrato) : '1',
      ciudadOrigen: aspirante.socioeconomico?.ciudadOrigen ?? '',
      ingresosFamiliares: aspirante.socioeconomico?.ingresosFamiliares ?? '',
      observaciones: aspirante.socioeconomico?.observaciones ?? '',
    });
    loadAuditHistory(aspirante.id);
    setActiveTab('form');
    setError('');
    setNotice(`Editando datos del aspirante (ID: ${aspirante.id}).`);
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    setOriginalAspirante(null);
    setForm(initialForm);
    setError('');
    setNotice('Edición cancelada.');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setCreatedAspirante(null);

    const edadNum = parseInt(form.edad.trim(), 10);
    if (isNaN(edadNum) || edadNum <= 0) {
      setError('La edad debe ser un número entero positivo mayor a cero.');
      return;
    }

    const promedioNum = parseFloat(form.promedio.trim());
    if (isNaN(promedioNum) || promedioNum < 0 || promedioNum > 5) {
      setError('El promedio debe ser un número válido entre 0.0 y 5.0.');
      return;
    }

    const payload: AspirantePayload = {
      nombreCompleto: form.nombreCompleto.trim(),
      numDoc: form.numDoc.trim(),
      programa: form.programa.trim(),
      promedio: promedioNum,
      edad: edadNum,
    };

    setLoading(true);
    try {
      if (editingId) {
        const updated = await updateAspirante(editingId, payload);
        if (originalAspirante) {
          recordAuditHistory(editingId, originalAspirante, payload);
        }
        setOriginalAspirante(updated);
        setNotice('Información del aspirante actualizada correctamente.');
      } else {
        const created = await createAspirante(payload);
        setCreatedAspirante(created);
        setForm(initialForm);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setHasDraft(false);
        setNotice('Aspirante registrado exitosamente en el sistema.');
      }
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setLookupResult(null);

    const id = lookupId.trim();
    if (!id) {
      setError('Por favor ingresa un identificador de aspirante.');
      return;
    }

    setLoading(true);
    try {
      const aspirante = await getAspirante(id);
      setLookupResult(aspirante);
      loadAuditHistory(aspirante.id);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
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
          <span className="header-page active">Aspirantes</span>
          <Link className="header-link" to="/camas">Estado de camas</Link>
          {canManageContracts && <Link className="header-link" to="/contratos">Contratos</Link>}
          <span className="topbar-divider" />
          <span className="header-mark">CS</span>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow hero-label"><span aria-hidden="true">▣</span> Admisiones y Bienestar</p>
          <h2>Registro y edición de datos del aspirante</h2>
          <p>
            Gestiona la información personal, académica y socioeconómica del aspirante.
            Detección automática de menores de edad y control de cambios.
          </p>
          <span className="hero-rule" />
        </div>
        <div className="hero-image">
          <img src="/university-building.png" alt="Edificio universitario rodeado de jardines" />
        </div>
      </section>

      {/* Draft banner if saved */}
      {hasDraft && !editingId && (
        <aside className="alert alert-info" role="region" aria-label="Borrador pendiente" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#e0f2fe', color: '#0369a1', borderRadius: '12px', padding: '12px 18px', marginBottom: '20px' }}>
          <div>
            <strong>Tienes un borrador guardado</strong>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Guardado el: {draftSavedAt ?? 'en tu sesión anterior'}. Puedes cargarlo para continuar llenando el formulario.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="secondary-button" type="button" onClick={handleLoadDraft} style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
              Cargar borrador
            </button>
            <button className="link-button" type="button" onClick={handleDiscardDraft} style={{ margin: 0, color: '#dc2626', fontSize: '0.82rem' }}>
              Descartar
            </button>
          </div>
        </aside>
      )}

      <nav className="tabs" aria-label="Secciones del módulo de aspirantes">
        <button
          className={activeTab === 'form' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('form')}
          type="button"
        >
          <span aria-hidden="true">✎</span> {editingId ? 'Formulario de edición' : 'Formulario de registro'}
        </button>
        <button
          className={activeTab === 'lookup' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('lookup')}
          type="button"
        >
          <span aria-hidden="true">⌕</span> Consultar y editar
        </button>
        {auditHistory.length > 0 && (
          <button
            className={activeTab === 'history' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('history')}
            type="button"
          >
            <span aria-hidden="true">📋</span> Historial de cambios ({auditHistory.length})
          </button>
        )}
      </nav>

      {(error || notice) && (
        <div
          className={error ? 'alert error' : 'alert success'}
          role={error ? 'alert' : 'status'}
        >
          {error || notice}
        </div>
      )}

      {/* FORM TAB */}
      {activeTab === 'form' && (
        <section className="card" style={{ display: 'block' }}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">{editingId ? 'Modo edición' : 'Paso 1 de 1'}</p>
              <h3>{editingId ? 'Actualizar información del aspirante' : 'Formulario de registro del aspirante'}</h3>
              <p className="muted">
                Diligencia la información organizada en datos personales, académicos y socioeconómicos.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {!editingId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleSaveDraft}
                  title="Guarda tu avance localmente para completarlo más tarde"
                >
                  💾 Guardar borrador
                </button>
              )}
              {editingId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleCancelEdit}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* SECCIÓN 1: DATOS PERSONALES */}
            <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <legend style={{ padding: '0 10px', color: '#1260cf', fontWeight: 800, fontSize: '0.95rem' }}>
                1. Datos Personales
              </legend>

              <div className="form-grid">
                <label className="full-width">
                  Nombre completo *
                  <input
                    required
                    maxLength={150}
                    placeholder="Ej. María Gómez"
                    value={form.nombreCompleto}
                    onChange={(e) => updateField('nombreCompleto', e.target.value)}
                  />
                </label>

                <label>
                  Número de documento *
                  <input
                    required
                    minLength={5}
                    maxLength={30}
                    placeholder="Ej. CC-123456789 o TI-1029384"
                    value={form.numDoc}
                    onChange={(e) => updateField('numDoc', e.target.value)}
                  />
                </label>

                <label>
                  Edad *
                  <input
                    required
                    type="number"
                    min={1}
                    max={120}
                    placeholder="Ej. 17"
                    value={form.edad}
                    onChange={(e) => updateField('edad', e.target.value)}
                  />
                </label>
              </div>

              {/* Detección y validación de menores de 18 años */}
              {isMinor && (
                <div
                  className="alert"
                  role="status"
                  style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    marginTop: '16px',
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                  <div>
                    <strong>Aspirante menor de 18 años detectado ({form.edad} años)</strong>
                    <p style={{ margin: '2px 0 0' }}>
                      De acuerdo con el reglamento de la Casa Estudiantil (RNF-02 / RF-07), los aspirantes menores de edad
                      requieren autorización firmada por su acudiente o responsable legal para completar la postulación y asignación.
                    </p>
                  </div>
                  <span className="status status-rechazada" style={{ marginLeft: 'auto', background: '#fed7aa', color: '#9a3412' }}>
                    Menor de edad
                  </span>
                </div>
              )}

              {isAdult && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '12px',
                    color: '#166534',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                  }}
                >
                  <span className="status status-aprobada">Mayor de edad (≥ 18)</span>
                  <span>Cumple con mayoría de edad para contratación directa.</span>
                </div>
              )}
            </fieldset>

            {/* SECCIÓN 2: DATOS ACADÉMICOS */}
            <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <legend style={{ padding: '0 10px', color: '#1260cf', fontWeight: 800, fontSize: '0.95rem' }}>
                2. Datos Académicos
              </legend>

              <div className="form-grid">
                <label>
                  Programa académico *
                  <input
                    required
                    maxLength={150}
                    placeholder="Ej. Ingeniería de Sistemas"
                    value={form.programa}
                    onChange={(e) => updateField('programa', e.target.value)}
                  />
                </label>

                <label>
                  Promedio académico acumulado *
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    placeholder="Ej. 4.2"
                    value={form.promedio}
                    onChange={(e) => updateField('promedio', e.target.value)}
                  />
                </label>

                <label className="full-width">
                  Institución de educación superior
                  <input
                    placeholder="Ej. Universidad del Otún"
                    value={form.universidad}
                    onChange={(e) => updateField('universidad', e.target.value)}
                  />
                </label>
              </div>
            </fieldset>

            {/* SECCIÓN 3: INFORMACIÓN SOCIOECONÓMICA */}
            <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <legend style={{ padding: '0 10px', color: '#1260cf', fontWeight: 800, fontSize: '0.95rem' }}>
                3. Información Socioeconómica
              </legend>

              <div className="form-grid">
                <label>
                  Estrato socioeconómico
                  <select
                    value={form.estrato}
                    onChange={(e) => updateField('estrato', e.target.value)}
                  >
                    <option value="1">Estrato 1 (Bajo - Bajo)</option>
                    <option value="2">Estrato 2 (Bajo)</option>
                    <option value="3">Estrato 3 (Medio - Bajo)</option>
                    <option value="4">Estrato 4 (Medio)</option>
                    <option value="5">Estrato 5 (Medio - Alto)</option>
                    <option value="6">Estrato 6 (Alto)</option>
                  </select>
                </label>

                <label>
                  Ciudad / Municipio de procedencia
                  <input
                    maxLength={100}
                    placeholder="Ej. Mocoa, Putumayo"
                    value={form.ciudadOrigen}
                    onChange={(e) => updateField('ciudadOrigen', e.target.value)}
                  />
                </label>

                <label className="full-width">
                  Ingresos familiares mensuales estimados
                  <input
                    maxLength={100}
                    placeholder="Ej. 1 SMMLV o Menor a 2 SMMLV"
                    value={form.ingresosFamiliares}
                    onChange={(e) => updateField('ingresosFamiliares', e.target.value)}
                  />
                </label>

                <label className="full-width">
                  Observaciones socioeconómicas o condición de vulnerabilidad
                  <input
                    maxLength={250}
                    placeholder="Indica si cuenta con beca de Bienestar, condición de foráneo o situación especial"
                    value={form.observaciones}
                    onChange={(e) => updateField('observaciones', e.target.value)}
                  />
                </label>
              </div>
            </fieldset>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              {!editingId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleSaveDraft}
                  disabled={loading}
                >
                  Guardar avance
                </button>
              )}
              <button
                className="primary-button submit-button"
                disabled={loading}
                type="submit"
                style={{ margin: 0 }}
              >
                <span aria-hidden="true">➤</span>
                {loading ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Registrar aspirante'}
              </button>
            </div>
          </form>

          {createdAspirante && (
            <div className="confirmation" style={{ marginTop: '24px' }}>
              <strong>¡Aspirante registrado con éxito!</strong>
              <p>El perfil fue almacenado en el sistema con el siguiente identificador:</p>
              <code>{createdAspirante.id}</code>
              <p style={{ marginTop: '8px' }}>
                Edad: {createdAspirante.edad} años |{' '}
                {createdAspirante.esMenorDeEdad ? (
                  <span className="status status-rechazada" style={{ background: '#fef3c7', color: '#92400e' }}>
                    Menor de edad (Requiere acudiente)
                  </span>
                ) : (
                  <span className="status status-aprobada">Mayor de edad</span>
                )}
              </p>
              <button
                className="link-button"
                onClick={() => {
                  setLookupId(createdAspirante.id);
                  setActiveTab('lookup');
                }}
              >
                Consultar o editar este aspirante
              </button>
            </div>
          )}
        </section>
      )}

      {/* LOOKUP TAB */}
      {activeTab === 'lookup' && (
        <section className="card narrow">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Seguimiento y edición</p>
              <h3>Consultar aspirante</h3>
              <p className="muted">Ingresa el identificador único del aspirante para visualizar sus datos o editarlos.</p>
            </div>
          </div>

          <form className="lookup-form" onSubmit={handleLookup}>
            <label className="full-width">
              Identificador del aspirante *
              <input
                required
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="Ej. a7d6c3e1-2db0-4dc5-9cc3-123456789abc"
              />
            </label>
            <button className="primary-button" disabled={loading} type="submit">
              {loading ? 'Buscando...' : 'Consultar'}
            </button>
          </form>

          {lookupResult && (
            <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <div className="result-box" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <span className="muted">Nombre completo</span>
                  <strong>{lookupResult.nombreCompleto}</strong>
                </div>
                <div>
                  <span className="muted">Documento de identidad</span>
                  <strong>{lookupResult.numDoc}</strong>
                </div>
                <div>
                  <span className="muted">Programa académico</span>
                  <strong>{lookupResult.programa}</strong>
                </div>
                <div>
                  <span className="muted">Promedio</span>
                  <strong>{lookupResult.promedio}</strong>
                </div>
                <div>
                  <span className="muted">Edad</span>
                  <strong>{lookupResult.edad} años</strong>
                </div>
                <div>
                  <span className="muted">Condición de edad</span>
                  <div>
                    {lookupResult.esMenorDeEdad ? (
                      <span className="status status-rechazada" style={{ background: '#fef3c7', color: '#92400e' }}>
                        Menor de edad
                      </span>
                    ) : (
                      <span className="status status-aprobada">Mayor de edad</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => handleStartEditing(lookupResult)}
                  style={{ margin: 0 }}
                >
                  ✎ Editar información
                </button>
                {auditHistory.length > 0 && (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setActiveTab('history')}
                  >
                    Ver historial ({auditHistory.length})
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <section className="card" style={{ display: 'block' }}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Auditoría</p>
              <h3>Historial de modificaciones</h3>
              <p className="muted">Registro controlado de cambios aplicados sobre los datos del aspirante.</p>
            </div>
            {editingId && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => setActiveTab('form')}
              >
                Volver al formulario
              </button>
            )}
          </div>

          {auditHistory.length === 0 ? (
            <div className="empty-state">
              <p>No se han registrado modificaciones para este perfil todavía.</p>
            </div>
          ) : (
            <div className="table-wrap" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
                    <th style={{ padding: '10px' }}>Fecha y hora</th>
                    <th style={{ padding: '10px' }}>Usuario</th>
                    <th style={{ padding: '10px' }}>Campo modificado</th>
                    <th style={{ padding: '10px' }}>Valor anterior</th>
                    <th style={{ padding: '10px' }}>Nuevo valor</th>
                  </tr>
                </thead>
                <tbody>
                  {auditHistory.map((entry) => (
                    <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                      <td style={{ padding: '10px', color: '#64748b' }}>{entry.timestamp}</td>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{entry.usuario ?? 'Sistema'}</td>
                      <td style={{ padding: '10px', color: '#1d4ed8', fontWeight: 600 }}>{entry.campo}</td>
                      <td style={{ padding: '10px', color: '#dc2626' }}>{String(entry.valorAnterior)}</td>
                      <td style={{ padding: '10px', color: '#16a34a', fontWeight: 700 }}>{String(entry.valorNuevo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <footer className="site-footer">
        Casa Estudiantil San Martín <span>•</span> Apoyo, bienestar y educación
      </footer>
    </main>
  );
}
