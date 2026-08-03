import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { presenceSocketService } from '../../services/presenceSocketService.js';
import { competitionRoomReceived } from '../../store/slices/competitionSlice.js';
import {
  challengeAccepted,
  challengeCancelled,
  challengeReceived,
  challengeRejected,
  challengeSent,
} from '../../store/slices/challengeSlice.js';
import {
  fetchOnlineUsers,
  onlineUserReceived,
  onlineUserRemoved,
  presenceConnected,
  presenceConnecting,
  presenceConnectionFailed,
  presenceDisconnected,
} from '../../store/slices/presenceSlice.js';

const HEARTBEAT_MS = 30000;

export function PresenceConnection() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const accessToken = useSelector((state) => state.auth.accessToken);

  useEffect(() => {
    if (!accessToken) {
      dispatch(presenceDisconnected());
      return undefined;
    }

    dispatch(fetchOnlineUsers());
    dispatch(presenceConnecting());

    const socket = presenceSocketService.connect({ token: accessToken });
    socket.on('connect', () => dispatch(presenceConnected()));
    socket.on('connect_error', () => dispatch(presenceConnectionFailed('No se pudo conectar presencia online')));
    socket.on('presence:online', (user) => dispatch(onlineUserReceived(user)));
    socket.on('presence:offline', (user) => dispatch(onlineUserRemoved(user)));
    socket.on('challenge:received', (challenge) => dispatch(challengeReceived(challenge)));
    socket.on('challenge:sent', (challenge) => dispatch(challengeSent(challenge)));
    socket.on('challenge:rejected', (payload) => dispatch(challengeRejected(payload)));
    socket.on('challenge:cancelled', (payload) => dispatch(challengeCancelled(payload)));
    socket.on('challenge:accepted', (payload) => {
      if (payload?.competition) {
        dispatch(competitionRoomReceived(payload.competition));
      }
      dispatch(challengeAccepted(payload));
      navigate('/compete');
    });

    const heartbeatId = window.setInterval(() => {
      socket.emit('presence:heartbeat');
    }, HEARTBEAT_MS);

    return () => {
      window.clearInterval(heartbeatId);
      socket.off('connect');
      socket.off('connect_error');
      socket.off('presence:online');
      socket.off('presence:offline');
      socket.off('challenge:received');
      socket.off('challenge:sent');
      socket.off('challenge:rejected');
      socket.off('challenge:cancelled');
      socket.off('challenge:accepted');
      socket.disconnect();
      dispatch(presenceDisconnected());
    };
  }, [accessToken, dispatch, navigate]);

  return null;
}
