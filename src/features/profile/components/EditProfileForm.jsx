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
  const [password, setPassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const [wcaInput, setWcaInput] = useState('');
  const [wcaError, setWcaError] = useState('');
  const [wcaSuccess, setWcaSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    const data = { email };
    if (username !== me?.username) data.username = username;
    if (password) data.password = password;
    const result = await dispatch(updateMe(data));
    if (updateMe.fulfilled.match(result)) {
      setProfileSuccess('Perfil actualizado correctamente');
      setPassword('');
    } else {
      setProfileError(result.payload || 'Error al actualizar el perfil');
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
    <div className="flex flex-col gap-8">
      {/* --- Profile fields --- */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[#e2f0ff]">Datos del perfil</h2>

        <div>
          <label className="form-label">Nombre de usuario</label>
          <input
            className="form-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={2}
            maxLength={20}
          />
        </div>

        <div>
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="form-label">Nueva contraseña (opcional)</label>
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Dejar vacío para no cambiar"
          />
        </div>

        {profileError && <p className="text-sm text-red-400">{profileError}</p>}
        {profileSuccess && <p className="text-sm text-green-400">{profileSuccess}</p>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      {/* --- WCA ID section --- */}
      <div className="border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-[#e2f0ff] mb-4">WCA ID</h2>

        {me?.wcaId ? (
          <div className="flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-3">
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
    </div>
  );
}
