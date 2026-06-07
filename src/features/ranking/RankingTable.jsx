function formatTime(seconds) {
  if (seconds == null) return '—';
  return `${seconds.toFixed(2)}s`;
}

function WcaBadge({ wcaRanking }) {
  if (!wcaRanking) return null;
  return (
    <span className="text-xs text-blue-400" title="Ranking WCA oficial (average)">
      WCA #{wcaRanking.rank ?? '?'}
    </span>
  );
}

export function RankingTable({ rows, event }) {
  if (!rows.length) {
    return (
      <p className="text-center text-muted text-sm py-12">
        Aún no hay competidores en el ranking.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted border-b border-border">
            <th className="py-3 pr-4 font-medium">#</th>
            <th className="py-3 pr-4 font-medium">Jugador</th>
            <th className="py-3 pr-4 font-medium text-right">Elo</th>
            <th className="py-3 pr-4 font-medium text-right">V</th>
            <th className="py-3 pr-4 font-medium text-right">D</th>
            <th className="py-3 pr-4 font-medium text-right">DNF</th>
            <th className="py-3 pr-4 font-medium text-right">PB</th>
            <th className="py-3 pr-4 font-medium text-right">Media</th>
            <th className="py-3 font-medium text-right">WCA {event}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.userId}
              className="border-b border-border/50 hover:bg-accent/30 transition-colors"
            >
              <td className="py-3 pr-4 text-muted font-mono">{row.position}</td>
              <td className="py-3 pr-4 font-medium">
                <a
                  href={`/users/${row.username}`}
                  className="hover:text-primary transition-colors"
                >
                  {row.username}
                </a>
                {row.wca_id && (
                  <span className="ml-2 text-xs text-muted">({row.wca_id})</span>
                )}
              </td>
              <td className="py-3 pr-4 text-right font-mono font-semibold">{row.elo}</td>
              <td className="py-3 pr-4 text-right text-green-500">{row.wins}</td>
              <td className="py-3 pr-4 text-right text-red-400">{row.losses}</td>
              <td className="py-3 pr-4 text-right text-muted">{row.dnf_count}</td>
              <td className="py-3 pr-4 text-right font-mono">{formatTime(row.pb_time)}</td>
              <td className="py-3 pr-4 text-right font-mono">{formatTime(row.average_time)}</td>
              <td className="py-3 text-right">
                <WcaBadge wcaRanking={row.wca_ranking} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
