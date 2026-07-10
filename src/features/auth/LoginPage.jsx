import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, selectAuthLoading, selectAuthError, selectIsAuthenticated, clearError } from '../../store/slices/authSlice.js';
import { AuthField, AuthLayout, authFieldClass } from './AuthLayout.jsx';

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;
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
    <AuthLayout
      title="Bienvenido de nuevo"
      subtitle="Entra para competir, revisar ranking y mantener tu perfil al día."
      sideTitle="Compite con contexto."
      sideText="Accede a salas 1v1, rankings separados por cubo y perfiles vinculados con WCA."
      sideCode="3x3"
      sideStats={[
        { label: 'Elo', value: '1216', tone: 'text-amber-300' },
        { label: 'PB', value: '10.92', tone: 'text-green-400' },
        { label: 'Online', value: '2', tone: 'text-accent' },
      ]}
    >
      {successMessage && (
        <div className="mb-5 rounded-md border border-green-400/20 bg-green-400/10 px-3 py-2.5 text-sm text-green-400">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-md border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <AuthField label="Email" htmlFor="login-email">
          <input
            id="login-email"
            name="email"
            className={authFieldClass}
            type="email"
            placeholder="tu@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            autoComplete="email"
          />
        </AuthField>

        <AuthField label="Contraseña" htmlFor="login-password">
          <input
            id="login-password"
            name="password"
            className={authFieldClass}
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            autoComplete="current-password"
          />
        </AuthField>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <hr className="flex-1 border-border" />
        <span className="text-xs text-muted">o</span>
        <hr className="flex-1 border-border" />
      </div>

      <Link to="/register?wca=1">
        <button className="btn-secondary">Entrar con WCA ID</button>
      </Link>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <span>¿Primera vez? <Link to="/register" className="text-accent transition-colors hover:text-cyan-300">Crear cuenta</Link></span>
        <Link to="/forgot-password" className="text-xs text-accent transition-colors hover:text-cyan-300">Olvidé mi contraseña</Link>
      </div>
    </AuthLayout>
  );
}
