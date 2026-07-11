import { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { updateMe, linkWca, selectUserLoading } from '../../../store/slices/userSlice.js';

const WCA_ID_REGEX = /^[0-9]{4}[A-Z]{2,}[0-9]{2}$/;

export function EditProfileForm({ me }) {
  EditProfileForm.propTypes = {
    me: PropTypes.shape({
      username: PropTypes.string,
      email: PropTypes.string,
      wcaId: PropTypes.string,
    }).isRequired,
  };

  const dispatch = useDispatch();
  const loading = useSelector(selectUserLoading);

  const [username, setUsername] = useState(me?.username ?? '');
  const [email, setEmail] = useState(me?.email ?? '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [wcaInput, setWcaInput] = useState('');
  const [wcaError, setWcaError] = useState('');
  const [wcaSuccess, setWcaSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    const data = { email };
    if (username !== me?.username) data.username = username;
    const result = await dispatch(updateMe(data));
    if (updateMe.fulfilled.match(result)) {
      setProfileSuccess('Perfil actualizado correctamente');
    } else {
      setProfileError(result.payload || 'Error al actualizar el perfil');
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPassword('');
    setPasswordConfirm('');
    setPasswordError('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (password.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== passwordConfirm) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    const result = await dispatch(updateMe({ password }));
    if (updateMe.fulfilled.match(result)) {
      setPasswordSuccess('Contraseña actualizada correctamente');
      closePasswordModal();
    } else {
      setPasswordError(result.payload || 'Error al cambiar la contraseña');
    }
  };

  const handleLinkWca = async (e) => {
    e.preventDefault();
    setWcaError('');
    setWcaSuccess('');

    const trimmed = wcaInput.trim().toUpperCase();
    if (!WCA_ID_REGEX.test(trimmed)) {
      setWcaError('Formato inválido. Ejemplo: 2022LUCA04');
      return;
    }

    const result = await dispatch(linkWca(trimmed));
    if (linkWca.fulfilled.match(result)) {
      setWcaSuccess('WCA ID vinculado correctamente');
      setWcaInput('');
    } else {
      setWcaError(result.payload || 'Error al vincular el WCA ID');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2 border-b border-border/70 pb-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
          <label className="form-label mb-0">Nombre de usuario</label>
          <input
            className="form-input mb-0"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={2}
            maxLength={20}
          />
        </div>

        <div className="grid gap-2 border-b border-border/70 pb-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
          <label className="form-label mb-0">Email</label>
          <input
            className="form-input mb-0"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#e2f0ff]">Contraseña</p>
            <p className="mt-1 text-xs text-muted">Cámbiala solo cuando lo necesites.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowPasswordModal(true);
              setPasswordSuccess('');
            }}
            className="btn-secondary w-auto px-4 py-2"
          >
            Cambiar contraseña
          </button>
        </div>

        {profileError && <p className="text-sm text-red-400">{profileError}</p>}
        {profileSuccess && <p className="text-sm text-green-400">{profileSuccess}</p>}
        {passwordSuccess && <p className="text-sm text-green-400">{passwordSuccess}</p>}

        <div className="flex justify-end">
          <button className="btn-primary w-auto px-5" type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      <div className="border-t border-border pt-5">
        <h2 className="mb-4 text-sm font-semibold text-[#e2f0ff]">WCA ID</h2>

        {me?.wcaId ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-bg px-4 py-3">
            <span className="text-xs text-muted">WCA ID vinculado:</span>
            <span className="font-mono text-accent font-medium">{me.wcaId}</span>
            <span className="ml-auto text-xs text-muted flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
              No se puede cambiar
            </span>
          </div>
        ) : (
          <form onSubmit={handleLinkWca} className="flex flex-col gap-3">
            <p className="text-xs text-muted">
              Vincula tu WCA ID para mostrar tus resultados oficiales. Una vez vinculado no podrás cambiarlo.
            </p>
            <div className="flex gap-2">
              <input
                className={`form-input flex-1 font-mono uppercase ${wcaError ? 'border-red-500' : ''}`}
                type="text"
                value={wcaInput}
                onChange={(e) => {
                  setWcaInput(e.target.value.toUpperCase());
                  setWcaError('');
                }}
                placeholder="Ej: 2022LUCA04"
                maxLength={12}
              />
              <button
                type="submit"
                disabled={loading || !wcaInput.trim()}
                className="btn-secondary px-4 py-2 text-sm whitespace-nowrap disabled:opacity-50"
              >
                {loading ? '...' : 'Vincular'}
              </button>
            </div>
            {wcaError && <p className="text-xs text-red-400 -mt-1">{wcaError}</p>}
            {wcaSuccess && <p className="text-xs text-green-400 -mt-1">{wcaSuccess}</p>}
          </form>
        )}
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
          <form onSubmit={handlePasswordSubmit} className="w-full max-w-md rounded-lg border border-border-light bg-surface shadow-2xl">
            <header className="border-b border-border px-5 py-4">
              <h2 id="password-modal-title" className="text-xl font-bold text-[#e2f0ff]">Cambiar contraseña</h2>
            </header>
            <div className="grid gap-4 px-5 py-4">
              <div>
                <label className="form-label">Nueva contraseña</label>
                <input
                  className="form-input mb-0"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <label className="form-label">Confirmar contraseña</label>
                <input
                  className="form-input mb-0"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Repite la contraseña"
                />
              </div>
              {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5">
              <button type="button" onClick={closePasswordModal} className="btn-secondary w-auto px-4 py-2">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-primary w-auto px-4 py-2">
                {loading ? 'Guardando...' : 'Guardar contraseña'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
