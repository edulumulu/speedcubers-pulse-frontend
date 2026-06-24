import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRanking, setEvent } from '../../store/slices/rankingSlice.js';
import { RankingTable } from './RankingTable.jsx';

const EVENTS = ['3x3', '2x2', '4x4', '5x5', '6x6', '7x7', '3x3oh', 'mega', 'pyra', 'skewb', 'sq1', 'clock'];

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
                key={e}
                onClick={() => handleEventChange(e)}
                aria-pressed={event === e}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  event === e
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent text-muted hover:text-foreground'
                }`}
              >
                {e}
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
