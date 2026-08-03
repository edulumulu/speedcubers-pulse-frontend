import PropTypes from 'prop-types';

export function ProfileCard({ profile, canChallenge = false, isOnline = false, onChallenge }) {
  if (!profile) return null;

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const countryFlag = profile.wca?.countryIso2
    ? profile.wca.countryIso2
      .toUpperCase()
      .replace(/./g, (char) => String.fromCodePoint(0x1f1e6 - 65 + char.charCodeAt(0)))
    : null;

  const hasWcaDetails = profile.wca?.name || profile.wca?.country || profile.wcaId;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="overflow-hidden rounded-lg border border-border bg-surface">
        <header className="grid min-h-48 gap-5 border-b border-border bg-[#0b141e] p-6 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-end">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-4xl font-extrabold text-accent">
            {profile.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-4xl font-extrabold leading-none text-[#e2f0ff]">{profile.username}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.wcaId && (
                <span className="inline-flex items-center gap-2 rounded-full border border-border-light bg-bg/70 px-3 py-1 font-mono text-xs text-accent">
                  {countryFlag && <span className="font-sans text-sm">{countryFlag}</span>}
                  WCA {profile.wcaId}
                </span>
              )}
              {memberSince && (
                <span className="rounded-full border border-border-light bg-bg/70 px-3 py-1 text-xs text-muted">
                  Miembro desde {memberSince}
                </span>
              )}
            </div>
          </div>
          <div className="grid gap-2 justify-items-end">
            <span className={`text-xs ${isOnline ? 'text-green-400' : 'text-muted'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <button
              type="button"
              className="btn-secondary w-auto px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canChallenge}
              onClick={onChallenge}
            >
              Retar
            </button>
          </div>
        </header>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <article className="min-h-[118px] rounded-lg border border-border bg-bg p-4">
            <span className="text-xs text-muted">Perfil</span>
            <strong className="mt-5 block truncate text-2xl font-bold text-[#e2f0ff]">Público</strong>
            <small className="mt-2 block text-xs text-muted">Usuario público</small>
          </article>
          <article className="min-h-[118px] rounded-lg border border-border bg-bg p-4">
            <span className="text-xs text-muted">WCA</span>
            <strong className="mt-5 block truncate font-mono text-2xl font-bold text-accent">{profile.wcaId ? 'Vinculado' : '—'}</strong>
            <small className="mt-2 block text-xs text-muted">
              {profile.wcaId ? 'Vinculado' : 'Sin WCA vinculado'}
            </small>
          </article>
          <article className="min-h-[118px] rounded-lg border border-border bg-bg p-4">
            <span className="text-xs text-muted">País</span>
            <strong className="mt-5 block truncate text-2xl font-bold text-[#e2f0ff]">
              {profile.wca?.countryIso2 ?? countryFlag ?? '—'}
            </strong>
            <small className="mt-2 block text-xs text-muted">Dato WCA público</small>
          </article>
          <article className="min-h-[118px] rounded-lg border border-border bg-bg p-4">
            <span className="text-xs text-muted">Rankings por evento</span>
            <strong className="mt-5 block truncate text-2xl font-bold text-[#e2f0ff]">Próximamente</strong>
            <small className="mt-2 block text-xs text-muted">Elo, PB y media por cubo</small>
          </article>
        </div>

        <div className="border-t border-border p-5">
          <p className="mb-3 text-[0.7rem] font-bold uppercase text-muted">Eventos</p>
          <div className="rounded-lg border border-border bg-bg p-4 text-sm text-muted">
            Las estadísticas públicas por evento se mostrarán aquí cuando el perfil exponga rankings detallados por cubo.
          </div>
        </div>
      </section>

      <aside className="h-fit rounded-lg border border-border bg-surface lg:sticky lg:top-[82px]">
        <section className="border-b border-border p-5">
          <p className="mb-4 text-[0.7rem] font-bold uppercase text-muted">WCA</p>
          {hasWcaDetails ? (
            <div className="grid gap-3 text-sm">
              {profile.wca?.name && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Nombre</span>
                  <strong className="truncate text-[#e2f0ff]">{profile.wca.name}</strong>
                </div>
              )}
              {profile.wca?.country && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted">País</span>
                  <strong className="truncate text-[#e2f0ff]">{profile.wca.country}</strong>
                </div>
              )}
              {profile.wcaId && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted">ID</span>
                  <strong className="font-mono text-accent">{profile.wcaId}</strong>
                </div>
              )}
            </div>
          ) : (
            <p className="rounded-lg border border-border bg-bg p-3 text-sm text-muted">
              Este usuario no tiene WCA vinculado.
            </p>
          )}
        </section>
        <section className="p-5">
          <p className="mb-4 text-[0.7rem] font-bold uppercase text-muted">Actividad</p>
          <p className="rounded-lg border border-border bg-bg p-3 text-sm text-muted">
            La actividad reciente se añadirá cuando el historial público de rondas esté disponible.
          </p>
        </section>
      </aside>
    </div>
  );
}

ProfileCard.propTypes = {
  profile: PropTypes.shape({
    username: PropTypes.string,
    createdAt: PropTypes.string,
    wcaId: PropTypes.string,
    wca: PropTypes.shape({
      countryIso2: PropTypes.string,
      name: PropTypes.string,
      country: PropTypes.string,
    }),
    id: PropTypes.string,
  }),
  canChallenge: PropTypes.bool,
  isOnline: PropTypes.bool,
  onChallenge: PropTypes.func,
};
