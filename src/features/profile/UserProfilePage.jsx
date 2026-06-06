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
    <main className="max-w-lg mx-auto px-4 py-10">
      {loading && !profile && (
        <p className="text-muted text-sm">Cargando perfil...</p>
      )}

      {error && !profile && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {profile && <ProfileCard profile={profile} />}
    </main>
  );
}
