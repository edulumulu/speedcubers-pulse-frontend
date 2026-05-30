import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, selectAuthLoading, selectAuthError, selectIsAuthenticated, clearError } from '../../store/slices/authSlice.js';

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuth = useSelector(selectIsAuthenticated);

  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (isAuth) navigate('/', { replace: true });
    return () => dispatch(clearError());
  }, [isAuth, navigate, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(form));
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-medium text-[#e2f0ff] mb-1">Bienvenido de nuevo</h1>
        <p className="text-sm text-muted mb-8">Inicia sesión para competir</p>

        <div className="card">
          {error && (
            <div className="mb-5 px-3 py-2.5 bg-red-400/10 border border-red-400/20 rounded-md text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />

            <label className="form-label">Contraseña</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
            />

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <hr className="flex-1 border-border" />
            <span className="text-xs text-muted">o</span>
            <hr className="flex-1 border-border" />
          </div>

          <Link to="/register?wca=1">
            <button className="btn-secondary">🏆 &nbsp;Entrar con WCA ID</button>
          </Link>

          <div className="flex justify-between items-center mt-5 text-sm text-muted">
            <span>¿Primera vez? <Link to="/register" className="text-accent hover:text-cyan-300 transition-colors">Crear cuenta</Link></span>
            <Link to="/forgot-password" className="text-accent hover:text-cyan-300 transition-colors text-xs">Olvidé mi contraseña</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
