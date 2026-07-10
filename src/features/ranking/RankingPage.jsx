import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRanking, setEvent } from '../../store/slices/rankingSlice.js';
import { RankingTable } from './RankingTable.jsx';

const EVENTS = [
  { value: '3x3', label: '3x3' },
  { value: '2x2', label: '2x2' },
  { value: '4x4', label: '4x4' },
  { value: '5x5', label: '5x5' },
  { value: '6x6', label: '6x6' },
  { value: '7x7', label: '7x7' },
  { value: 'oh', label: '3x3 OH' },
  { value: 'pyraminx', label: 'Pyraminx' },
  { value: 'skewb', label: 'Skewb' },
];

export function RankingPage() {
  const dispatch = useDispatch();
  const { data, event, status, error } = useSelector((s) => s.ranking);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchRanking(event));
    }
  }, [status, event, dispatch]);

  function handleEventChange(newEvent) {
    dispatch(setEvent(newEvent));
    dispatch(fetchRanking(newEvent));
  }

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] max-w-5xl mx-auto w-full px-4">
      {/* Header fijo — no scrollea */}
      <div className="shrink-0 border-b border-border/50 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Ranking</h1>
            <p className="text-sm text-muted">Top 100 speedcubers por Elo</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {EVENTS.map((e) => (
              <button
                key={e.value}
                onClick={() => handleEventChange(e.value)}
                aria-pressed={event === e.value}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  event === e.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent text-muted hover:text-foreground'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista — solo esta zona scrollea */}
      <div className="flex-1 overflow-y-auto py-4">
        {status === 'loading' && (
          <p className="text-center text-muted text-sm py-12">Cargando ranking…</p>
        )}

        {status === 'failed' && (
          <p className="text-center text-red-400 text-sm py-12">{error}</p>
        )}

        {status === 'succeeded' && (
          <RankingTable rows={data} event={event} />
        )}
      </div>
    </div>
  );
}
