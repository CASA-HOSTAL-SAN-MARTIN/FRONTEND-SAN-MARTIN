import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { getCamas } from '../api/client';
import type { Cama, CamaEstado } from '../types';

type PisoFilter = 'todos' | '1' | '2' | '3';

const stateLabels: Record<CamaEstado, string> = {
  disponible: 'Disponible',
  ocupada: 'Ocupada',
  bloqueada: 'Bloqueada',
};

function normalizeState(value: string): CamaEstado {
  const normalized = value.toLowerCase().replace(/[\s-]/g, '_');
  if (normalized === 'ocupada' || normalized === 'bloqueada') return normalized;
  return 'disponible';
}

function getApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
  }
  return 'No fue posible consultar el estado de las camas. Inténtalo nuevamente.';
}

function groupByRoom(camas: Cama[]) {
  return camas.reduce<Record<string, Cama[]>>((rooms, cama) => {
    const room = rooms[cama.habitacion] ?? [];
    room.push(cama);
    rooms[cama.habitacion] = room;
    return rooms;
  }, {});
}

export function CamasPage() {
  const [camas, setCamas] = useState<Cama[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<PisoFilter>('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadCamas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCamas();
      setCamas(data.map((cama) => ({ ...cama, estado: normalizeState(cama.estado) })));
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCamas();
  }, [loadCamas]);

  const filteredCamas = useMemo(
    () => selectedFloor === 'todos' ? camas : camas.filter((cama) => String(cama.piso) === selectedFloor),
    [camas, selectedFloor],
  );
  const floors = useMemo(() => [1, 2, 3].map((piso) => ({
    piso,
    rooms: groupByRoom(filteredCamas.filter((cama) => cama.piso === piso)),
  })).filter(({ rooms }) => Object.keys(rooms).length > 0), [filteredCamas]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Casa Estudiantil San Martín</p>
          <h1>Estado de camas</h1>
        </div>
        <div className="header-actions">
          <Link className="header-link" to="/">Solicitudes</Link>
          <span className="header-mark">CS</span>
        </div>
      </header>

      <section className="hero beds-hero">
        <p className="eyebrow">Disponibilidad</p>
        <h2>Consulta el estado de cada cama</h2>
        <p>Visualiza rápidamente las camas disponibles, ocupadas y bloqueadas por piso y habitación.</p>
      </section>

      <section className="board-toolbar" aria-label="Filtros del tablero">
        <div>
          <label htmlFor="floor-filter">Filtrar por piso</label>
          <select id="floor-filter" value={selectedFloor} onChange={(event) => setSelectedFloor(event.target.value as PisoFilter)}>
            <option value="todos">Todos los pisos</option>
            <option value="1">Piso 1</option>
            <option value="2">Piso 2</option>
            <option value="3">Piso 3</option>
          </select>
        </div>
        <div className="toolbar-right">
          <div className="legend" aria-label="Leyenda de estados">
            {(Object.keys(stateLabels) as CamaEstado[]).map((state) => <span key={state}><i className={`bed-dot ${state}`} />{stateLabels[state]}</span>)}
          </div>
          <button className="secondary-button" disabled={loading} onClick={() => void loadCamas()}>{loading ? 'Actualizando...' : 'Actualizar'}</button>
        </div>
      </section>

      {lastUpdated && !loading && <p className="updated-at">Última actualización: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
      {error && <div className="alert error" role="alert">{error}</div>}
      {loading && <div className="empty-state"><span className="loader" />Cargando estado de camas...</div>}
      {!loading && !error && filteredCamas.length === 0 && <div className="empty-state"><strong>No hay camas para mostrar</strong><span>Prueba con otro piso o actualiza la información.</span></div>}
      {!loading && !error && floors.map(({ piso, rooms }) => (
        <section className="floor-section" key={piso}>
          <div className="floor-heading"><h3>Piso {piso}</h3><span>{Object.keys(rooms).length} habitaciones</span></div>
          <div className="rooms-grid">
            {Object.entries(rooms).map(([room, roomBeds]) => (
              <article className="room-card" key={room}>
                <h4>Habitación {room}</h4>
                <div className="beds-grid">
                  {roomBeds.map((cama) => (
                    <div className={`bed-card ${cama.estado}`} key={cama.id}>
                      <span className="bed-number">Cama {cama.numero}</span>
                      <strong>{stateLabels[cama.estado]}</strong>
                      {cama.estado === 'bloqueada' && cama.motivoBloqueo && <span className="block-reason">Motivo: {cama.motivoBloqueo}</span>}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
