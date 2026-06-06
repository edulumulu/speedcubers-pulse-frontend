import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, selectAuthLoading, selectAuthError, selectIsAuthenticated, clearError } from '../../store/slices/authSlice.js';
import { authService } from '../../services/authService.js';

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
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-medium text-[#e2f0ff] mb-1">Crear cuenta</h1>
        <p className="text-sm text-muted mb-6">Únete a la comunidad speedcuber</p>

        {/* Progress steps */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col gap-1">
              <div className={`h-0.5 rounded-full transition-colors duration-300 ${
                i < step ? 'bg-accent' : i === step ? 'bg-accent/40' : 'bg-border'
              }`} />
              <span className={`text-[0.65rem] uppercase tracking-wider ${i <= step ? 'text-accent' : 'text-muted'}`}>{s}</span>
            </div>
          ))}
        </div>

        <div className="card">
          {error && (
            <div className="mb-5 px-3 py-2.5 bg-red-400/10 border border-red-400/20 rounded-md text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 0 && (
              <>
                <label className="form-label">Nombre de usuario</label>
                <input
                  className={`form-input ${errors.username ? 'border-red-500' : ''}`}
                  type="text"
                  placeholder="edulumulu"
                  value={form.username}
                  onChange={(e) => { setForm({ ...form, username: e.target.value }); setErrors((p) => ({ ...p, username: undefined })); }}
                  required
                  minLength={2}
                  maxLength={20}
                />
                {errors.username && <p className="text-xs text-red-400 -mt-3 mb-3">{errors.username}</p>}
                <label className="form-label">Email</label>
                <input
                  className={`form-input ${errors.email ? 'border-red-500' : ''}`}
                  type="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors((p) => ({ ...p, email: undefined })); }}
                  required
                />
                {errors.email && <p className="text-xs text-red-400 -mt-3 mb-3">{errors.email}</p>}
                <label className="form-label">Contraseña</label>
                <input
                  className={`form-input ${errors.password ? 'border-red-500' : ''}`}
                  type="password"
                  placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors((p) => ({ ...p, password: undefined })); }}
                  required
                />
                {errors.password && <p className="text-xs text-red-400 -mt-3 mb-3">{errors.password}</p>}
                {errors.general && <p className="text-xs text-red-400 mb-3">{errors.general}</p>}
                <button className="btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Comprobando...' : 'Continuar'}
                </button>
              </>
            )}

            {step === 1 && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-xs text-muted">opcional</span>
                  <div className="flex-1 border-t border-border" />
                </div>

                <label className="form-label">WCA ID</label>
                <input
                  className={`form-input ${errors.wca_id ? 'border-red-500' : ''}`}
                  type="text"
                  placeholder="2022LUCA04"
                  value={form.wca_id}
                  onChange={(e) => { setForm({ ...form, wca_id: e.target.value.toUpperCase() }); setErrors((p) => ({ ...p, wca_id: undefined })); }}
                  maxLength={12}
                />
                {errors.wca_id && <p className="text-xs text-red-400 -mt-3 mb-3">{errors.wca_id}</p>}

                {form.wca_id.length >= 9 && (
                  <div className="mb-5 px-3 py-3 bg-accent/8 border border-accent/15 rounded-lg">
                    <p className="text-xs text-muted mb-0.5">Validando con WCA...</p>
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

          <div className="text-center mt-5 text-sm text-muted">
            ¿Ya tienes cuenta? <Link to="/login" className="text-accent hover:text-cyan-300 transition-colors">Iniciar sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
