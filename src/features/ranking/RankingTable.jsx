function fmt(s) {
  if (s == null) return '—';
  return `${s.toFixed(2)}s`;
}

function positionIcon(pos) {
  if (pos === 1) return '🥇';
  if (pos === 2) return '🥈';
  if (pos === 3) return '🥉';
  return pos;
}

function avatarColor(pos) {
  if (pos === 1) return 'bg-yellow-400/20 text-yellow-400';
  if (pos === 2) return 'bg-slate-300/20 text-slate-300';
  if (pos === 3) return 'bg-amber-600/20 text-amber-600';
  return 'bg-accent text-muted';
}

function eloColor(elo) {
  if (elo >= 1200) return 'text-yellow-400';
  if (elo >= 1100) return 'text-blue-400';
  if (elo >= 1000) return 'text-green-400';
  return 'text-red-400';
}

function RankingRow({ row }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
      {/* Position */}
      <div className="w-10 text-center shrink-0">
        {row.position <= 3
          ? <span className="text-2xl">{positionIcon(row.position)}</span>
          : <span className="text-lg font-bold text-muted">{row.position}</span>}
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(row.position)}`}>
          {row.username[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <a
            href={`/users/${row.username}`}
            className="font-semibold text-base hover:text-primary transition-colors"
          >
            {row.username}
          </a>
          {row.wca_id && (
            <p className="text-xs text-blue-400 truncate">{row.wca_id}</p>
          )}
        </div>
      </div>

      {/* Elo */}
      <div className="shrink-0 text-right">
        <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Elo</p>
        <p className={`text-xl font-bold ${eloColor(row.elo)}`}>{row.elo}</p>
      </div>

      {/* V / D chips */}
      <div className="hidden sm:flex gap-2 shrink-0">
        <span className="px-2 py-1 bg-green-400/10 text-green-400 text-xs rounded-md font-medium">{row.wins}V</span>
        <span className="px-2 py-1 bg-red-400/10 text-red-400 text-xs rounded-md font-medium">{row.losses}D</span>
      </div>

      {/* Times */}
      <div className="hidden md:flex gap-4 shrink-0">
        <div className="text-right">
          <p className="text-xs text-muted">PB</p>
          <p className="font-mono text-sm font-medium">{fmt(row.pb_time)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Media</p>
          <p className="font-mono text-sm font-medium">{fmt(row.average_time)}</p>
        </div>
      </div>

      {/* WCA official rank */}
      <div className="shrink-0 text-right min-w-[72px]">
        {row.wca_ranking ? (
          <>
            <p className="text-xs text-muted">WCA avg</p>
            <p className="text-sm font-medium text-blue-400">#{row.wca_ranking.rank?.toLocaleString()}</p>
          </>
        ) : (
          <span className="text-muted text-sm">—</span>
        )}
      </div>
    </div>
  );
}

export function RankingTable({ rows }) {
  if (!rows.length) {
    return (
      <p className="text-center text-muted text-sm py-12">
        Aún no hay competidores en el ranking.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <RankingRow key={row.userId} row={row} />
      ))}
    </div>
  );
}
