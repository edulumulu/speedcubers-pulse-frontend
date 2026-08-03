import { Link, NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectIsAuthenticated, selectUser } from '../../store/slices/authSlice.js';
import { selectOnlineUsers, selectPresenceSocketStatus } from '../../store/slices/presenceSlice.js';
import { presenceSocketService } from '../../services/presenceSocketService.js';
import { challengeFailed, challengeSending, challengeSent } from '../../store/slices/challengeSlice.js';

export function Navbar() {
  const dispatch = useDispatch();
  const isAuth = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const onlineUsers = useSelector(selectOnlineUsers);
  const presenceStatus = useSelector(selectPresenceSocketStatus);
  const isPresenceLive = presenceStatus === 'connected';

  async function handleChallenge(userId) {
    dispatch(challengeSending());
    try {
      const response = await presenceSocketService.sendChallenge({ challengedUserId: userId, event: '3x3' });
      if (response.challenge) dispatch(challengeSent(response.challenge));
    } catch (err) {
      dispatch(challengeFailed(err.message));
    }
  }

  return (
    <nav className="flex flex-wrap justify-between items-center gap-3 px-4 sm:px-8 py-4 border-b border-border bg-bg sticky top-0 z-10">
      <Link to="/" className="font-mono text-sm text-[#e2f0ff] tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm">
        speed<span className="text-accent">cubers</span>.pulse
      </Link>

      <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-6">
        <NavLink to="/ranking" className={({ isActive }) =>
          `text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm ${isActive ? 'text-[#e2f0ff]' : 'text-muted hover:text-[#e2f0ff]'}`
        }>
          Ranking
        </NavLink>

        {isAuth ? (
          <>
            <details className="relative group">
              <summary className="list-none cursor-pointer text-sm text-muted hover:text-[#e2f0ff] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm">
                <span
                  className={`inline-block h-2 w-2 rounded-full mr-2 ${
                    isPresenceLive ? 'bg-green-400' : 'bg-muted'
                  }`}
                  aria-hidden="true"
                />
                Online {onlineUsers.length}
              </summary>
              <div className="absolute right-0 mt-3 w-56 rounded-md border border-border bg-surface p-3 shadow-lg">
                <p className="text-xs uppercase text-muted mb-2">Usuarios online</p>
                {onlineUsers.length ? (
                  <ul className="flex flex-col gap-1">
                    {onlineUsers.slice(0, 5).map((onlineUser) => (
                      <li className="flex items-center justify-between gap-3 text-sm text-[#e2f0ff]" key={onlineUser.id}>
                        <span className="truncate">{onlineUser.username}</span>
                        {onlineUser.id !== user?.id && (
                          <button
                            type="button"
                            className="rounded border border-border-light px-2 py-1 text-xs text-accent transition-colors hover:border-accent/60"
                            onClick={() => handleChallenge(onlineUser.id)}
                          >
                            Retar
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">Sin usuarios conectados</p>
                )}
              </div>
            </details>
            <NavLink to="/profile" className={({ isActive }) =>
              `text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm ${isActive ? 'text-[#e2f0ff]' : 'text-muted hover:text-[#e2f0ff]'}`
            }>
              {user?.username ?? 'Mi perfil'}
            </NavLink>
            <button
              onClick={() => dispatch(logout())}
              className="text-sm text-muted hover:text-[#e2f0ff] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
            >
              Salir
            </button>
            <Link to="/compete" className="btn-primary w-auto px-5 py-2">
              Competir
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm text-muted hover:text-[#e2f0ff] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm">
              Login
            </Link>
            <Link to="/register" className="btn-primary w-auto px-5 py-2">
              Registro
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
