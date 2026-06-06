import { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

// updateMe is a thunk/action creator that accepts the changed fields
export function EditProfileForm({ me, updateMe }) {
  EditProfileForm.propTypes = {
    me: PropTypes.shape({ username: PropTypes.string, email: PropTypes.string }),
    updateMe: PropTypes.func.isRequired,
  };
  const dispatch = useDispatch();
  const [username, setUsername] = useState(me?.username ?? '');
  const [email, setEmail] = useState(me?.email ?? '');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { email };
    if (username !== me?.username) data.username = username;
    if (password) data.password = password;
    dispatch(updateMe(data));
  };

  return (
    <form onSubmit={handleSubmit}>
      <label className="form-label">Nombre de usuario</label>
      <input
        className="form-input"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        minLength={2}
        maxLength={20}
      />
      <label className="form-label">Email</label>
      <input
        className="form-input"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <label className="form-label">Nueva contraseña (opcional)</label>
      <input
        className="form-input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Dejar vacío para no cambiar"
      />
      <button className="btn-primary" type="submit">Guardar cambios</button>
    </form>
  );
}
