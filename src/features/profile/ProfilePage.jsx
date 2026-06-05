import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe, selectMe, selectUserLoading, selectUserError } from '../../store/slices/userSlice.js';
import { EditProfileForm } from './components/EditProfileForm.jsx';

export function ProfilePage() {
  const dispatch = useDispatch();
  const me = useSelector(selectMe);
  const loading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

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
        <div className="bg-surface border border-border rounded-xl p-6">
          <EditProfileForm me={me} />
        </div>
      )}
    </main>
  );
}
