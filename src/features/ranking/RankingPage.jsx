import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice.js';
import { fetchRanking, setEvent } from '../../store/slices/rankingSlice.js';
import { EventIcon } from '../../components/EventIcon.jsx';
import { RankingTable } from './RankingTable.jsx';

const EVENTS = [
  { value: '3x3', label: '3x3', shortLabel: '3x3' },
  { value: '2x2', label: '2x2', shortLabel: '2x2' },
  { value: '4x4', label: '4x4', shortLabel: '4x4' },
  { value: '5x5', label: '5x5', shortLabel: '5x5' },
  { value: '6x6', label: '6x6', shortLabel: '6x6' },
  { value: '7x7', label: '7x7', shortLabel: '7x7' },
  { value: 'oh', label: '3x3 OH', shortLabel: 'OH' },
  { value: 'pyraminx', label: 'Pyraminx', shortLabel: 'Pyra' },
  { value: 'skewb', label: 'Skewb', shortLabel: 'Skewb' },
  { value: 'megaminx', label: 'Megaminx', shortLabel: 'Mega' },
  { value: 'fto', label: 'FTO', shortLabel: 'FTO' },
];

function formatTime(value) {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(2)}s`;
}

function getEventLabel(event) {
  return EVENTS.find((item) => item.value === event)?.shortLabel ?? event;
}

function buildSummary(rows) {
  const validPbs = rows
    .map((row) => row.pb_time)
    .filter((value) => value !== null && value !== undefined);
  const totalMatches = rows.reduce((sum, row) => (
    sum + (row.total_matches ?? row.wins + row.losses)
  ), 0);
  const averageElo = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + row.elo, 0) / rows.length)
    : null;

  return {
    players: rows.length,
    rounds: totalMatches,
    bestPb: validPbs.length ? Math.min(...validPbs) : null,
    averageElo,
  };
}

function StatCard({ label, value, helper, tone = 'text-[#e2f0ff]', wide = false }) {
  return (
    <div className={`min-h-[92px] rounded-lg border border-border bg-bg p-3 flex flex-col justify-between ${wide ? 'col-span-2' : ''}`}>
      <span className="text-xs text-muted">{label}</span>
      <strong className={`font-mono text-2xl leading-none ${tone}`}>{value}</strong>
      {helper && <small className="text-[0.68rem] leading-snug text-muted">{helper}</small>}
    </div>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string,
  tone: PropTypes.string,
  wide: PropTypes.bool,
};

export function RankingPage() {
  const dispatch = useDispatch();
  const { data, event, status, error } = useSelector((s) => s.ranking);
  const user = useSelector(selectUser);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchRanking(event));
    }
  }, [status, event, dispatch]);

  function handleEventChange(newEvent) {
    dispatch(setEvent(newEvent));
    dispatch(fetchRanking(newEvent));
    setQuery('');
  }

  const activeEvent = getEventLabel(event);
  const filteredData = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return data;

    return data.filter((row) => (
      row.username.toLowerCase().includes(normalizedQuery)
      || row.wca_id?.toLowerCase().includes(normalizedQuery)
    ));
  }, [data, query]);
  const summary = useMemo(() => buildSummary(data), [data]);
  const currentUserRanking = useMemo(() => (
    data.find((row) => row.userId === user?.id || row.username === user?.username)
  ), [data, user]);

  return (
    <div className="min-h-[calc(100vh-65px)] w-full px-4 py-6">
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="overflow-hidden rounded-lg border border-border bg-surface">
          <header className="grid gap-4 border-b border-border p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <h1 className="text-3xl font-bold leading-none">Ranking</h1>
            <span className="font-mono text-4xl font-extrabold leading-none text-accent">{activeEvent}</span>
          </header>

          <div className="flex gap-2 overflow-x-auto border-b border-border px-5 py-3">
            {EVENTS.map((item) => (
              <button
                key={item.value}
                onClick={() => handleEventChange(item.value)}
                aria-pressed={event === item.value}
                className={`grid min-w-[4.5rem] justify-items-center gap-1 rounded-md border px-3 py-2 text-center transition-colors ${
                  event === item.value
                    ? 'border-accent/70 bg-accent/10 text-accent'
                    : 'border-border bg-bg text-muted hover:border-border-light hover:text-[#e2f0ff]'
                }`}
              >
                <span className="h-8 w-8 text-[2rem]">
                  <EventIcon event={item.value} />
                </span>
                <strong className="block text-[0.68rem] leading-none">{item.shortLabel}</strong>
                <span className="block text-[0.58rem] text-muted">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="border-b border-border px-5 py-3">
            <label className="sr-only" htmlFor="ranking-search">Buscar usuario</label>
            <input
              id="ranking-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Buscar usuario en ${activeEvent}`}
              className="mb-0 min-h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-[#e2f0ff] placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          {status === 'loading' && (
            <p className="text-center text-sm text-muted py-16">Cargando ranking…</p>
          )}

          {status === 'failed' && (
            <p className="text-center text-sm text-red-400 py-16">{error}</p>
          )}

          {status === 'succeeded' && (
            <RankingTable rows={filteredData} event={event} hasQuery={query.trim().length > 0} />
          )}
        </section>

        <aside className="h-fit rounded-lg border border-border bg-surface lg:sticky lg:top-[82px]">
          <section className="border-b border-border p-4">
            <p className="mb-3 text-[0.7rem] font-bold uppercase text-muted">Resumen {activeEvent}</p>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Competidores" value={summary.players} helper="con ranking activo" tone="text-accent" />
              <StatCard label="Rondas" value={summary.rounds} helper={`jugadas en ${activeEvent}`} />
              <StatCard label="PB" value={formatTime(summary.bestPb)} helper="marca interna" tone="text-green-400" />
              <StatCard label="Elo medio" value={summary.averageElo ?? '—'} helper="del evento" tone="text-blue-400" />
            </div>
          </section>

          <section className="border-b border-border p-4">
            <p className="mb-3 text-[0.7rem] font-bold uppercase text-muted">Tus datos</p>
            {currentUserRanking ? (
              <div className="grid grid-cols-2 gap-2">
                <StatCard
                  label="Elo"
                  value={currentUserRanking.elo}
                  helper="ranking interno"
                  tone="text-amber-300"
                  wide
                />
                <StatCard label="Posición" value={`#${currentUserRanking.position}`} helper={activeEvent} tone="text-accent" />
                <StatCard
                  label="Balance"
                  value={`${currentUserRanking.wins}-${currentUserRanking.losses}`}
                  helper={`${currentUserRanking.dnf_count ?? 0} DNF`}
                />
              </div>
            ) : (
              <p className="rounded-lg border border-border bg-bg p-3 text-sm text-muted">
                Aún no tienes datos en este evento.
              </p>
            )}
          </section>

          <section className="p-4">
            <p className="mb-3 text-[0.7rem] font-bold uppercase text-muted">Actividad</p>
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                label="Categoría más participada"
                value={activeEvent}
                helper="según el filtro activo"
                tone="text-accent"
                wide
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
