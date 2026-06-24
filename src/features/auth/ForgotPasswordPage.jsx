import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService.js';

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
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-medium text-[#e2f0ff] mb-1">Recuperar contraseña</h1>
        <p className="text-sm text-muted mb-8">Te enviaremos un enlace para restablecer tu contraseña</p>
        <div className="card">
          {sent ? (
            <div className="text-center py-4">
              <p className="text-green-400 text-sm mb-4">Si el email está registrado, recibirás un enlace en breve.</p>
              <Link to="/login" className="text-accent hover:text-cyan-300 text-sm transition-colors">Volver al login</Link>
            </div>
          ) : (
            <>
              {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
              <form onSubmit={handleSubmit}>
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
                <button className="btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>
              <div className="mt-5 text-center text-sm text-muted">
                <Link to="/login" className="text-accent hover:text-cyan-300 transition-colors">Volver al login</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
