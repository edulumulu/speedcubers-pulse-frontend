import PropTypes from 'prop-types';

export function AuthLayout({ title, subtitle, sideTitle, sideText, sideCode = '3x3', sideStats, children }) {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-65px)] w-full max-w-6xl items-stretch gap-4 px-4 py-6 lg:grid-cols-[minmax(0,29rem)_minmax(0,1fr)]">
      <section className="rounded-lg border border-border bg-surface p-5 sm:p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold leading-none text-[#e2f0ff]">{title}</h1>
          {subtitle && <p className="mt-3 text-sm leading-relaxed text-muted">{subtitle}</p>}
        </header>
        {children}
      </section>

      <aside className="hidden rounded-lg border border-border bg-surface p-6 lg:flex lg:flex-col lg:justify-between">
        <div>
          <h2 className="mb-3 max-w-md text-3xl font-extrabold leading-tight text-[#e2f0ff]">{sideTitle}</h2>
          <p className="max-w-md text-sm leading-relaxed text-muted">{sideText}</p>
          <div className="mt-6 overflow-hidden rounded-lg border border-border bg-bg">
            <div className="grid h-52 place-items-center border-b border-border bg-[#0b141e]">
              <strong className="font-mono text-5xl font-extrabold text-accent">{sideCode}</strong>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border">
              {sideStats.map((stat) => (
                <div key={stat.label} className="min-h-[5.5rem] bg-[#0b141e] p-3">
                  <span className="mb-3 block text-[0.68rem] text-muted">{stat.label}</span>
                  <strong className={`font-mono text-xl ${stat.tone ?? 'text-[#e2f0ff]'}`}>{stat.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}

AuthLayout.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  sideTitle: PropTypes.string.isRequired,
  sideText: PropTypes.string.isRequired,
  sideCode: PropTypes.string,
  sideStats: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    tone: PropTypes.string,
  })).isRequired,
  children: PropTypes.node.isRequired,
};

export const authFieldClass = 'form-input mb-0 min-h-[50px] rounded-[10px] border-[#1b3c57] bg-[#0d1a26] text-[15px] placeholder:text-[#8aa2ba] focus:border-accent focus:bg-[#102133] focus:ring-2 focus:ring-accent/20';

export function AuthField({ label, htmlFor, children }) {
  return (
    <div className="mb-4">
      <label className="form-label mb-2 text-[#bdd3e8]" htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

AuthField.propTypes = {
  label: PropTypes.string.isRequired,
  htmlFor: PropTypes.string,
  children: PropTypes.node.isRequired,
};
