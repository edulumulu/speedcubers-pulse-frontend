import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchMe, deleteMe, selectMe, selectUserLoading, selectUserError } from '../../store/slices/userSlice.js';
import { clearAuth } from '../../store/slices/authSlice.js';
import { EditProfileForm } from './components/EditProfileForm.jsx';

export function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const me = useSelector(selectMe);
  const loading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  const handleDelete = async () => {
    const result = await dispatch(deleteMe());
    if (deleteMe.fulfilled.match(result)) {
      dispatch(clearAuth());
      navigate('/');
    }
  };

  return (
    <main className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-xl font-bold text-[#e2f0ff] mb-6">Mi perfil</h1>

      {loading && !me && (
        <p className="text-muted text-sm">Cargando...</p>
      )}

      {error && !me && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {me && (
        <>
          <div className="bg-surface border border-border rounded-xl p-6">
            <EditProfileForm me={me} />
          </div>

          <div className="mt-6 border border-red-500/20 rounded-xl p-5 flex flex-col gap-3">
            <p className="text-sm font-medium text-red-400">Zona de peligro</p>
            <p className="text-xs text-muted">Eliminar tu cuenta es permanente. Tus datos serán anonimizados.</p>
            {confirmDelete ? (
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="btn-primary w-auto px-4 py-2 text-sm bg-red-500 hover:bg-red-600"
                >
                  {loading ? 'Eliminando...' : 'Sí, eliminar mi cuenta'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="btn-secondary w-auto px-4 py-2 text-sm"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="btn-secondary w-auto px-4 py-2 text-sm border-red-500/40 text-red-400 hover:border-red-500 hover:text-red-300"
              >
                Eliminar cuenta
              </button>
            )}
          </div>
        </>
      )}
    </main>
  );
}
