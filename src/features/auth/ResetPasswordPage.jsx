import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService.js';
import { AuthField, AuthLayout, authFieldClass } from './AuthLayout.jsx';

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
      <AuthLayout
        title="Nueva contraseña"
        subtitle="El enlace de recuperación no es válido."
        sideTitle="Solicita un nuevo enlace."
        sideText="Los enlaces de recuperación caducan para proteger tu cuenta."
        sideCode="!"
        sideStats={[
          { label: 'Estado', value: 'Inválido', tone: 'text-red-400' },
          { label: 'Acción', value: 'Nuevo' },
          { label: 'Login', value: 'Seguro', tone: 'text-accent' },
        ]}
      >
        <div className="text-center">
          <p className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-3 text-sm text-red-400">Enlace de recuperación inválido.</p>
          <Link to="/forgot-password" className="text-accent hover:text-cyan-300 text-sm">Solicitar uno nuevo</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Nueva contraseña"
      subtitle="Elige una contraseña segura para volver a entrar."
      sideTitle="Actualiza el acceso."
      sideText="Tu sesión seguirá protegida con refresh cookie y access token en memoria."
      sideCode="JWT"
      sideStats={[
        { label: 'Mínimo', value: '8+' },
        { label: 'Mayúscula', value: '1' },
        { label: 'Número', value: '1', tone: 'text-accent' },
      ]}
    >
      {error && <p className="mb-4 rounded border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-400">{error}</p>}
      <form onSubmit={handleSubmit}>
        <AuthField label="Nueva contraseña">
          <input
            className={`${authFieldClass} ${fieldErrors.password ? 'border-red-500' : ''}`}
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldErrors({}); }}
            placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
            required
          />
        </AuthField>
        {fieldErrors.password && <p className="-mt-2 mb-3 text-xs text-red-400">{fieldErrors.password}</p>}
        <AuthField label="Confirmar contraseña">
          <input
            className={`${authFieldClass} ${fieldErrors.confirm ? 'border-red-500' : ''}`}
            type="password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setFieldErrors({}); }}
            placeholder="Repite la contraseña"
            required
          />
        </AuthField>
        {fieldErrors.confirm && <p className="-mt-2 mb-3 text-xs text-red-400">{fieldErrors.confirm}</p>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </AuthLayout>
  );
}
