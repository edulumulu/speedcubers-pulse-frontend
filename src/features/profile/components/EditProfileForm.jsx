import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { updateMe, selectUserLoading, selectUserError, clearUserError } from '../../../store/slices/userSlice.js';
import { authService } from '../../../services/authService.js';
import { selectUser } from '../../../store/slices/authSlice.js';

export function EditProfileForm({ me }) {
  const dispatch = useDispatch();
  const loading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);
  const authUser = useSelector(selectUser);

  const [email, setEmail] = useState(me?.email ?? '');
  const [username, setUsername] = useState(me?.username ?? '');
  const [password, setPassword] = useState('');
  const [wcaInput, setWcaInput] = useState('');
  const [wcaError, setWcaError] = useState(null);
  const [wcaLoading, setWcaLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const usernameError =
    error && (error.includes('username') || error.includes('30'))
      ? 'Debes esperar 30 días entre cambios de username'
      : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearUserError());
    setSuccessMsg(null);

    const data = { email, username };
    if (password) data.password = password;

    const result = await dispatch(updateMe(data));
    if (updateMe.fulfilled.match(result)) {
      setPassword('');
      setSuccessMsg('Perfil actualizado correctamente');
    }
  };

  const handleLinkWca = async () => {
    if (!wcaInput.trim()) return;
    setWcaError(null);
    setWcaLoading(true);
    try {
      const token = authUser?.accessToken ?? null;
      // token comes from redux state via authSlice; authService.linkWca accepts (wcaId, token)
      await authService.linkWca(wcaInput.trim(), token);
      setWcaInput('');
      setSuccessMsg('WCA ID vinculado correctamente');
    } catch (err) {
      setWcaError(err.response?.data?.error || 'Error al vincular WCA ID');
    } finally {
      setWcaLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {successMsg && (
        <p className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-2">
          {successMsg}
        </p>
      )}

      {error && !usernameError && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={`form-input ${usernameError ? 'border-red-500' : ''}`}
          required
        />
        {usernameError ? (
          <p className="text-xs text-red-400">{usernameError}</p>
        ) : (
          <p className="text-xs text-muted">Solo puedes cambiar el username 1 vez cada 30 días</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted">Nueva contraseña <span className="text-xs">(dejar vacío para no cambiar)</span></label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
          placeholder="••••••••"
        />
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="text-sm font-medium text-[#e2f0ff]">WCA ID</p>
        {me?.wcaId ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-accent">{me.wcaId}</span>
            <span className="text-xs text-muted">(vinculado)</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={wcaInput}
              onChange={(e) => setWcaInput(e.target.value)}
              placeholder="Ej: 2015GOME01"
              className="form-input flex-1 mb-0"
            />
            <button
              type="button"
              onClick={handleLinkWca}
              disabled={wcaLoading || !wcaInput.trim()}
              className="btn-primary px-4 py-2 text-sm w-auto"
            >
              {wcaLoading ? 'Vinculando...' : 'Vincular'}
            </button>
          </div>
        )}
        {wcaError && <p className="text-xs text-red-400">{wcaError}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  );
}

EditProfileForm.propTypes = {
  me: PropTypes.shape({
    email: PropTypes.string,
    username: PropTypes.string,
    wcaId: PropTypes.string,
  }),
};
