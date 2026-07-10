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

  const memberSince = me?.createdAt
    ? new Date(me.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })
    : null;

  return (
    <main className="mx-auto min-h-[calc(100vh-65px)] w-full max-w-7xl px-4 py-6">
      {loading && !me && (
        <section className="rounded-lg border border-border bg-surface p-4">
          <h1 className="mb-2 text-xl font-bold text-[#e2f0ff]">Mi perfil</h1>
          <p className="text-sm text-muted">Cargando...</p>
        </section>
      )}

      {error && !me && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">{error}</div>
      )}

      {me && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="overflow-hidden rounded-lg border border-border bg-surface">
            <header className="grid min-h-48 gap-5 border-b border-border bg-[#0b141e] p-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-4xl font-extrabold text-accent">
                {me.username?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-4xl font-extrabold leading-none text-[#e2f0ff]">Mi perfil</h1>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-border-light bg-bg/70 px-3 py-1 text-xs text-muted">
                    {me.username}
                  </span>
                  {me.wcaId && (
                    <span className="rounded-full border border-border-light bg-bg/70 px-3 py-1 font-mono text-xs text-accent">
                      WCA {me.wcaId}
                    </span>
                  )}
                  {memberSince && (
                    <span className="rounded-full border border-border-light bg-bg/70 px-3 py-1 text-xs text-muted">
                      Miembro desde {memberSince}
                    </span>
                  )}
                </div>
              </div>
            </header>

            <div className="p-5">
              <EditProfileForm me={me} />
            </div>
          </section>

          <aside className="h-fit rounded-lg border border-border bg-surface lg:sticky lg:top-[82px]">
            <section className="border-b border-border p-5">
              <p className="mb-4 text-[0.7rem] font-bold uppercase text-muted">Cuenta</p>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Usuario</span>
                  <strong className="truncate text-[#e2f0ff]">{me.username}</strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Email</span>
                  <strong className="truncate text-[#e2f0ff]">{me.email}</strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted">WCA vinculado</span>
                  <strong className="font-mono text-[#e2f0ff]">{me.wcaId ? 'sí' : 'no'}</strong>
                </div>
              </div>
            </section>

            <section className="p-5">
              <div className="rounded-lg border border-red-500/25 bg-red-500/5 p-4">
                <p className="mb-2 text-sm font-semibold text-red-400">Zona de peligro</p>
                <p className="mb-4 text-xs leading-relaxed text-muted">
                  Eliminar tu cuenta es permanente. Tus datos serán anonimizados.
                </p>
                {confirmDelete ? (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="btn-primary w-auto bg-red-500 px-4 py-2 text-sm hover:bg-red-600"
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
                    className="btn-secondary w-auto border-red-500/40 px-4 py-2 text-sm text-red-400 hover:border-red-500 hover:text-red-300"
                  >
                    Eliminar cuenta
                  </button>
                )}
              </div>
            </section>
          </aside>
        </div>
      )}
    </main>
  );
}
