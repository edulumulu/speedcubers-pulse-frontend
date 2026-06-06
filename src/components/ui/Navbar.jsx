import { Link, NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectIsAuthenticated, selectUser } from '../../store/slices/authSlice.js';

export function Navbar() {
  const dispatch = useDispatch();
  const isAuth = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  return (
    <nav className="flex justify-between items-center px-8 py-4 border-b border-border bg-bg sticky top-0 z-10">
      <Link to="/" className="font-mono text-sm text-[#e2f0ff] tracking-tight">
        speed<span className="text-accent">cubers</span>.pulse
      </Link>

      <div className="flex items-center gap-6">
        <NavLink to="/ranking" className={({ isActive }) =>
          `text-sm transition-colors ${isActive ? 'text-[#e2f0ff]' : 'text-muted hover:text-[#e2f0ff]'}`
        }>
          Ranking
        </NavLink>

        {isAuth ? (
          <>
            <NavLink to="/profile" className={({ isActive }) =>
              `text-sm transition-colors ${isActive ? 'text-[#e2f0ff]' : 'text-muted hover:text-[#e2f0ff]'}`
            }>
              {user?.username ?? 'Mi perfil'}
            </NavLink>
            <button
              onClick={() => dispatch(logout())}
              className="text-sm text-muted hover:text-[#e2f0ff] transition-colors"
            >
              Salir
            </button>
            <Link to="/compete" className="btn-primary w-auto px-5 py-2">
              Competir
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm text-muted hover:text-[#e2f0ff] transition-colors">
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
