import PropTypes from 'prop-types';

export function ProfileCard({ profile }) {
  if (!profile) return null;

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const countryFlag = profile.wca?.countryIso2
    ? profile.wca.countryIso2
      .toUpperCase()
      .replace(/./g, (char) => String.fromCodePoint(0x1f1e6 - 65 + char.charCodeAt(0)))
    : null;

  return (
    <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#e2f0ff]">{profile.username}</h1>
          {memberSince && (
            <p className="text-muted text-sm mt-1">Miembro desde {memberSince}</p>
          )}
        </div>

        {profile.wcaId && (
          <div className="flex items-center gap-2 bg-bg border border-border rounded-lg px-3 py-1.5">
            {countryFlag && <span className="text-lg">{countryFlag}</span>}
            <span className="text-xs font-mono text-accent">{profile.wcaId}</span>
          </div>
        )}
      </div>

      {profile.wca && (
        <div className="border-t border-border pt-4 flex flex-col gap-1">
          {profile.wca.name && (
            <p className="text-sm text-[#e2f0ff]">
              <span className="text-muted">Nombre WCA: </span>{profile.wca.name}
            </p>
          )}
          {profile.wca.country && (
            <p className="text-sm text-[#e2f0ff]">
              <span className="text-muted">País: </span>{profile.wca.country}
            </p>
          )}
        </div>
      )}
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
  }),
};
