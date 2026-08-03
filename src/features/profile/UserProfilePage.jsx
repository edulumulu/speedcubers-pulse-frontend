import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile, selectProfile, selectUserLoading, selectUserError } from '../../store/slices/userSlice.js';
import { selectUser } from '../../store/slices/authSlice.js';
import { selectOnlineUsers, selectPresenceSocketStatus } from '../../store/slices/presenceSlice.js';
import { challengeFailed, challengeSending, challengeSent } from '../../store/slices/challengeSlice.js';
import { presenceSocketService } from '../../services/presenceSocketService.js';
import { ProfileCard } from './components/ProfileCard.jsx';

export function UserProfilePage() {
  const { username } = useParams();
  const dispatch = useDispatch();
  const profile = useSelector(selectProfile);
  const loading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);
  const currentUser = useSelector(selectUser);
  const onlineUsers = useSelector(selectOnlineUsers);
  const presenceStatus = useSelector(selectPresenceSocketStatus);
  const isProfileOnline = Boolean(profile?.id && onlineUsers.some((user) => user.id === profile.id));
  const canChallenge = Boolean(
    currentUser
      && profile?.id
      && currentUser.id !== profile.id
      && isProfileOnline
      && presenceStatus === 'connected',
  );

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

      {profile && (
        <ProfileCard
          profile={profile}
          canChallenge={canChallenge}
          isOnline={isProfileOnline}
          onChallenge={async () => {
            dispatch(challengeSending());
            try {
              const response = await presenceSocketService.sendChallenge({
                challengedUserId: profile.id,
                event: '3x3',
              });
              if (response.challenge) dispatch(challengeSent(response.challenge));
            } catch (err) {
              dispatch(challengeFailed(err.message));
            }
          }}
        />
      )}
    </main>
  );
}
