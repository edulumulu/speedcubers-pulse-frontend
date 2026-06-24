import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService.js';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (password.length < 8) errs.password = 'Mínimo 8 caracteres';
    else if (!/[A-Z]/.test(password)) errs.password = 'Debe contener al menos una mayúscula';
    else if (!/[0-9]/.test(password)) errs.password = 'Debe contener al menos un número';
    if (password !== confirm) errs.confirm = 'Las contraseñas no coinciden';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(token, password);
      navigate('/login', { state: { message: 'Contraseña actualizada. Inicia sesión.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Token inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center px-4">
        <div className="card text-center">
          <p className="text-red-400 text-sm mb-4">Enlace de recuperación inválido.</p>
          <Link to="/forgot-password" className="text-accent hover:text-cyan-300 text-sm">Solicitar uno nuevo</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-medium text-[#e2f0ff] mb-1">Nueva contraseña</h1>
        <p className="text-sm text-muted mb-8">Elige una contraseña segura</p>
        <div className="card">
          {error && <p className="text-sm text-red-400 mb-4 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">{error}</p>}
          <form onSubmit={handleSubmit}>
            <label className="form-label">Nueva contraseña</label>
            <input
              className={`form-input ${fieldErrors.password ? 'border-red-500' : ''}`}
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors({}); }}
              placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
              required
            />
            {fieldErrors.password && <p className="text-xs text-red-400 -mt-3 mb-3">{fieldErrors.password}</p>}
            <label className="form-label">Confirmar contraseña</label>
            <input
              className={`form-input ${fieldErrors.confirm ? 'border-red-500' : ''}`}
              type="password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setFieldErrors({}); }}
              placeholder="Repite la contraseña"
              required
            />
            {fieldErrors.confirm && <p className="text-xs text-red-400 -mt-3 mb-3">{fieldErrors.confirm}</p>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
