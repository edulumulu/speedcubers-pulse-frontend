import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile, selectProfile, selectUserLoading, selectUserError } from '../../store/slices/userSlice.js';
import { ProfileCard } from './components/ProfileCard.jsx';

export function UserProfilePage() {
  const { username } = useParams();
  const dispatch = useDispatch();
  const profile = useSelector(selectProfile);
  const loading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);

  useEffect(() => {
    if (username) dispatch(fetchProfile(username));
  }, [dispatch, username]);

  return (
    <main className="mx-auto min-h-[calc(100vh-65px)] w-full max-w-7xl px-4 py-6">
      {loading && !profile && (
        <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">Cargando perfil...</div>
      )}

      {error && !profile && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">{error}</div>
      )}

      {profile && <ProfileCard profile={profile} />}
    </main>
  );
}
