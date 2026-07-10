import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService.js';
import { AuthField, AuthLayout, authFieldClass } from './AuthLayout.jsx';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Error al enviar el email. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Introduce tu email y te enviaremos un enlace para restablecerla."
      sideTitle="Vuelve sin perder el ritmo."
      sideText="El acceso se recupera por email y tu sesión vuelve a cargar perfil, ranking y salas disponibles."
      sideCode="OK"
      sideStats={[
        { label: 'Email', value: 'Seguro', tone: 'text-green-400' },
        { label: 'Token', value: '15m' },
        { label: 'Login', value: 'Listo', tone: 'text-accent' },
      ]}
    >
      {sent ? (
        <div className="py-4 text-center">
          <p className="mb-4 rounded-lg border border-green-400/20 bg-green-400/10 px-3 py-3 text-sm text-green-400">
            Si el email está registrado, recibirás un enlace en breve.
          </p>
          <Link to="/login" className="text-sm text-accent transition-colors hover:text-cyan-300">Volver al login</Link>
        </div>
      ) : (
        <>
          <div className="mb-5 rounded-lg border border-accent/20 bg-accent/10 p-3 text-sm leading-relaxed text-muted">
            Por seguridad, si el email existe, recibirás el enlace. Si no existe, no mostraremos información privada.
          </div>
          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
          <form onSubmit={handleSubmit}>
            <AuthField label="Email">
              <input
                className={authFieldClass}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </AuthField>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
          <div className="mt-5 text-center text-sm text-muted">
            <Link to="/login" className="text-accent transition-colors hover:text-cyan-300">Volver al login</Link>
          </div>
        </>
      )}
    </AuthLayout>
  );
}
