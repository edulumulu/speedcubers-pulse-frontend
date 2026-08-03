import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, selectAuthLoading, selectAuthError, selectIsAuthenticated, clearError } from '../../store/slices/authSlice.js';
import { authService } from '../../services/authService.js';
import { AuthField, AuthLayout, authFieldClass } from './AuthLayout.jsx';

const STEPS = ['Cuenta', 'WCA', 'Listo'];

export function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuth = useSelector(selectIsAuthenticated);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ username: '', email: '', password: '', wca_id: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuth) navigate('/', { replace: true });
    return () => dispatch(clearError());
  }, [isAuth, navigate, dispatch]);

  const validateStep0 = () => {
    const errs = {};
    if (!form.username || form.username.length < 2 || form.username.length > 20)
      errs.username = 'El username debe tener entre 2 y 20 caracteres';
    else if (!/^[a-zA-Z0-9]+$/.test(form.username))
      errs.username = 'Solo letras y números, sin espacios';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Email no válido';
    if (!form.password || form.password.length < 8)
      errs.password = 'Mínimo 8 caracteres';
    else if (!/[A-Z]/.test(form.password))
      errs.password = 'Debe contener al menos una mayúscula';
    else if (!/[0-9]/.test(form.password))
      errs.password = 'Debe contener al menos un número';
    return errs;
  };

  const validateStep1 = () => {
    const errs = {};
    if (form.wca_id && !/^[0-9]{4}[A-Z]{2,}[0-9]{2}$/.test(form.wca_id))
      errs.wca_id = 'Formato de WCA ID inválido (ej: 2022LUCA04)';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 0) {
      const errs = validateStep0();
      if (Object.keys(errs).length) { setErrors(errs); return; }
      // Check availability
      setLoading(true);
      try {
        const res = await authService.checkAvailability({ username: form.username, email: form.email });
        const newErrs = {};
        if (res.username?.taken) newErrs.username = 'Este username ya está en uso';
        if (res.email?.taken) newErrs.email = 'Este email ya está registrado';
        if (Object.keys(newErrs).length) { setErrors(newErrs); return; }
        setStep(1);
      } catch {
        setErrors({ general: 'Error de conexión. Inténtalo de nuevo.' });
      } finally {
        setLoading(false);
      }
      return;
    }
    const errs = validateStep1();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    const payload = { ...form };
    if (!payload.wca_id) delete payload.wca_id;
    dispatch(register(payload));
  };

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Configura tu usuario y vincula WCA si quieres mostrar datos oficiales."
      sideTitle="Tu identidad speedcuber."
      sideText="El username es tu identidad interna. El WCA ID se puede vincular después para enriquecer el perfil público."
      sideCode="WCA ID"
      sideStats={[
        { label: 'Perfil', value: 'Público' },
        { label: 'Ranking', value: 'Evento' },
        { label: 'Vídeo', value: '1v1', tone: 'text-accent' },
      ]}
    >
      <div className="mb-8 flex gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col gap-1">
            <div className={`h-1 rounded-full transition-colors duration-300 ${
              i < step ? 'bg-accent' : i === step ? 'bg-accent/40' : 'bg-border'
            }`} />
            <span className={`text-[0.65rem] uppercase tracking-wider ${i <= step ? 'text-accent' : 'text-muted'}`}>{s}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-5 rounded-md border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {step === 0 && (
          <>
            <AuthField label="Nombre de usuario" htmlFor="register-username">
              <input
                id="register-username"
                name="username"
                className={`${authFieldClass} ${errors.username ? 'border-red-500' : ''}`}
                type="text"
                placeholder="edulumulu"
                value={form.username}
                onChange={(e) => { setForm({ ...form, username: e.target.value }); setErrors((p) => ({ ...p, username: undefined })); }}
                required
                minLength={2}
                maxLength={20}
              />
            </AuthField>
            {errors.username && <p className="-mt-2 mb-3 text-xs text-red-400">{errors.username}</p>}
            <AuthField label="Email" htmlFor="register-email">
              <input
                id="register-email"
                name="email"
                className={`${authFieldClass} ${errors.email ? 'border-red-500' : ''}`}
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors((p) => ({ ...p, email: undefined })); }}
                required
              />
            </AuthField>
            {errors.email && <p className="-mt-2 mb-3 text-xs text-red-400">{errors.email}</p>}
            <AuthField label="Contraseña" htmlFor="register-password">
              <input
                id="register-password"
                name="password"
                className={`${authFieldClass} ${errors.password ? 'border-red-500' : ''}`}
                type="password"
                placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors((p) => ({ ...p, password: undefined })); }}
                required
              />
            </AuthField>
            {errors.password && <p className="-mt-2 mb-3 text-xs text-red-400">{errors.password}</p>}
            {errors.general && <p className="mb-3 text-xs text-red-400">{errors.general}</p>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Comprobando...' : 'Continuar'}
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted">opcional</span>
              <div className="flex-1 border-t border-border" />
            </div>

            <AuthField label="WCA ID" htmlFor="register-wca-id">
              <input
                id="register-wca-id"
                name="wca_id"
                className={`${authFieldClass} ${errors.wca_id ? 'border-red-500' : ''}`}
                type="text"
                placeholder="2022LUCA04"
                value={form.wca_id}
                onChange={(e) => { setForm({ ...form, wca_id: e.target.value.toUpperCase() }); setErrors((p) => ({ ...p, wca_id: undefined })); }}
                maxLength={12}
              />
            </AuthField>
            {errors.wca_id && <p className="-mt-2 mb-3 text-xs text-red-400">{errors.wca_id}</p>}

            {form.wca_id.length >= 9 && (
              <div className="mb-5 rounded-lg border border-accent/15 bg-accent/10 px-3 py-3">
                <p className="mb-0.5 text-xs text-muted">Validando con WCA...</p>
                <p className="text-sm text-[#e2f0ff]">Si el ID es válido, vincularemos tu perfil automáticamente.</p>
              </div>
            )}

            <button className="btn-primary mb-3" type="submit" disabled={authLoading}>
              {authLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => {
              setForm({ ...form, wca_id: '' });
              dispatch(register({ username: form.username, email: form.email, password: form.password }));
            }}>
              Saltar por ahora
            </button>
          </>
        )}
      </form>

      <div className="mt-5 text-center text-sm text-muted">
        ¿Ya tienes cuenta? <Link to="/login" className="text-accent transition-colors hover:text-cyan-300">Iniciar sesión</Link>
      </div>
    </AuthLayout>
  );
}
