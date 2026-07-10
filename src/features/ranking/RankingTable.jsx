import PropTypes from 'prop-types';

const EVENT_LABELS = {
  '3x3': '3x3',
  '2x2': '2x2',
  '4x4': '4x4',
  '5x5': '5x5',
  '6x6': '6x6',
  '7x7': '7x7',
  oh: '3x3 OH',
  pyraminx: 'Pyraminx',
  skewb: 'Skewb',
};

function fmt(s) {
  if (s === null || s === undefined) return '—';
  return `${s.toFixed(2)}s`;
}

function positionIcon(pos) {
  if (pos === 1) return '🥇';
  if (pos === 2) return '🥈';
  if (pos === 3) return '🥉';
  return pos;
}

function positionClasses(pos) {
  if (pos === 1) return 'border-amber-300/40 bg-amber-300/10 text-amber-200';
  if (pos === 2) return 'border-slate-300/35 bg-slate-300/10 text-slate-200';
  if (pos === 3) return 'border-orange-300/35 bg-orange-300/10 text-orange-200';
  return 'border-border-light bg-bg text-muted';
}

function avatarColor(pos) {
  if (pos === 1) return 'bg-amber-300/10 text-amber-200 border-amber-300/30';
  if (pos === 2) return 'bg-slate-300/10 text-slate-200 border-slate-300/30';
  if (pos === 3) return 'bg-orange-300/10 text-orange-200 border-orange-300/30';
  return 'bg-accent/10 text-accent border-accent/20';
}

function rowTone(pos) {
  if (pos === 1) return 'bg-gradient-to-r from-amber-300/10 to-surface';
  if (pos === 2) return 'bg-gradient-to-r from-slate-300/10 to-surface';
  if (pos === 3) return 'bg-gradient-to-r from-orange-400/10 to-surface';
  return 'bg-surface';
}

function eloColor(elo) {
  if (elo >= 1200) return 'text-amber-300';
  if (elo >= 1100) return 'text-blue-400';
  if (elo >= 1000) return 'text-green-400';
  return 'text-red-400';
}

function PositionBadge({ position }) {
  return (
    <span className={`inline-flex h-9 min-w-10 items-center justify-center rounded-md border px-2 font-mono text-sm font-bold ${positionClasses(position)}`}>
      {position <= 3 ? (
        <>
          <span aria-hidden="true" className="text-lg leading-none">{positionIcon(position)}</span>
          <span className="ml-1 text-xs">{position}</span>
        </>
      ) : (
        position
      )}
    </span>
  );
}

PositionBadge.propTypes = {
  position: PropTypes.number.isRequired,
};

function PlayerIdentity({ row }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${avatarColor(row.position)}`}>
        {row.username[0].toUpperCase()}
      </div>
      <div className="min-w-0">
        <a
          href={`/users/${row.username}`}
          className="block truncate text-base font-bold text-[#e2f0ff] transition-colors hover:text-accent md:text-[1.05rem]"
        >
          {row.username}
        </a>
        <p className="truncate text-xs text-muted md:text-[0.82rem]">
          {row.wca_id || 'Sin WCA vinculado'}
        </p>
      </div>
    </div>
  );
}

PlayerIdentity.propTypes = {
  row: PropTypes.shape({
    position: PropTypes.number.isRequired,
    username: PropTypes.string.isRequired,
    wca_id: PropTypes.string,
  }).isRequired,
};

function RankingRow({ row }) {
  const wcaRank = row.wca_ranking?.rank ? `#${row.wca_ranking.rank.toLocaleString()}` : '—';

  return (
    <article className={`grid min-h-[5.35rem] grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 border-t border-border px-4 py-3 transition-colors hover:bg-[#0b141e] md:grid-cols-[4rem_minmax(0,1fr)_7rem_6.5rem_6.5rem_7rem_7rem] md:px-5 ${rowTone(row.position)}`}>
      <div className="flex justify-center">
        <PositionBadge position={row.position} />
      </div>

      <PlayerIdentity row={row} />

      <div className="text-right">
        <p className={`font-mono text-[1.35rem] font-extrabold leading-none ${eloColor(row.elo)}`}>{row.elo}</p>
        <p className="mt-1 text-[0.68rem] text-muted md:hidden">Elo</p>
      </div>

      <div className="hidden text-right text-base md:block">
        <span className="font-medium text-green-400">{row.wins}V</span>
        <span className="mx-1 text-muted">/</span>
        <span className="font-medium text-red-400">{row.losses}D</span>
      </div>

      <div className="hidden text-right md:block">
        <p className="font-mono text-base font-medium">{fmt(row.pb_time)}</p>
      </div>

      <div className="hidden text-right md:block">
        <p className="font-mono text-base font-medium">{fmt(row.average_time)}</p>
      </div>

      <div className="hidden text-right md:block">
        <p className={row.wca_ranking ? 'text-base font-semibold text-blue-400' : 'text-base text-muted'}>
          {wcaRank}
        </p>
      </div>

      <div className="col-span-2 col-start-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted md:hidden">
        <span>
          <span className="text-green-400">{row.wins}</span>
          <span className="text-green-400">V</span>
          <span className="text-muted"> / </span>
          <span className="text-red-400">{row.losses}</span>
          <span className="text-red-400">D</span>
        </span>
        <span className="font-mono text-[#e2f0ff]">PB: {fmt(row.pb_time)}</span>
        <span className="font-mono text-[#e2f0ff]">Media: {fmt(row.average_time)}</span>
      </div>
    </article>
  );
}

RankingRow.propTypes = {
  row: PropTypes.shape({
    position: PropTypes.number.isRequired,
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    elo: PropTypes.number.isRequired,
    wins: PropTypes.number.isRequired,
    losses: PropTypes.number.isRequired,
    pb_time: PropTypes.number,
    average_time: PropTypes.number,
    wca_id: PropTypes.string,
    wca_ranking: PropTypes.shape({
      rank: PropTypes.number,
      average: PropTypes.number,
    }),
  }).isRequired,
};

export function RankingTable({ rows, event = '3x3', hasQuery = false }) {
  if (!rows.length) {
    const eventLabel = EVENT_LABELS[event] ?? event;

    return (
      <div className="flex min-h-[22rem] items-center justify-center px-5 py-14 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 bg-accent/10 font-mono font-extrabold text-accent">
            {eventLabel}
          </div>
          <h2 className="mb-2 text-xl font-bold text-[#e2f0ff]">
            {hasQuery ? 'No hay resultados para esta búsqueda' : 'Aún no hay competidores en este evento'}
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            {hasQuery
              ? 'Prueba con otro username o WCA ID.'
              : `Cuando se complete una ronda de ${eventLabel}, aparecerán aquí su Elo, PB, media y balance.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="hidden min-h-11 grid-cols-[4rem_minmax(0,1fr)_7rem_6.5rem_6.5rem_7rem_7rem] items-center border-b border-border px-5 text-xs font-semibold uppercase text-muted md:grid">
        <span className="text-center">#</span>
        <span>Usuario</span>
        <span className="text-right">Elo</span>
        <span className="text-right">V/D</span>
        <span className="text-right">PB</span>
        <span className="text-right">Media</span>
        <span className="text-right">WCA avg</span>
      </div>
      {rows.map((row) => (
        <RankingRow key={`${row.userId}-${row.position}`} row={row} />
      ))}
    </div>
  );
}

RankingTable.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.shape({
    userId: PropTypes.string.isRequired,
  })).isRequired,
  event: PropTypes.string,
  hasQuery: PropTypes.bool,
};
