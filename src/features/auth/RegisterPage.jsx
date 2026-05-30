import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, selectAuthLoading, selectAuthError, selectIsAuthenticated, clearError } from '../../store/slices/authSlice.js';

const STEPS = ['Cuenta', 'WCA', 'Listo'];

export function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuth = useSelector(selectIsAuthenticated);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ username: '', email: '', password: '', wca_id: '' });

  useEffect(() => {
    if (isAuth) navigate('/', { replace: true });
    return () => dispatch(clearError());
  }, [isAuth, navigate, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 0) { setStep(1); return; }
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
                  className="form-input"
                  type="text"
                  placeholder="edulumulu"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  minLength={2}
                  maxLength={20}
                />
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <label className="form-label">Contraseña</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button className="btn-primary" type="submit">Continuar</button>
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
                  className="form-input"
                  type="text"
                  placeholder="2022LUCA04"
                  value={form.wca_id}
                  onChange={(e) => setForm({ ...form, wca_id: e.target.value.toUpperCase() })}
                  maxLength={12}
                />

                {form.wca_id.length >= 9 && (
                  <div className="mb-5 px-3 py-3 bg-accent/8 border border-accent/15 rounded-lg">
                    <p className="text-xs text-muted mb-0.5">Validando con WCA...</p>
                    <p className="text-sm text-[#e2f0ff]">Si el ID es válido, vincularemos tu perfil automáticamente.</p>
                  </div>
                )}

                <button className="btn-primary mb-3" type="submit" disabled={loading}>
                  {loading ? 'Creando cuenta...' : 'Crear cuenta'}
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
