import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { presenceSocketService } from '../../services/presenceSocketService.js';
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

    const heartbeatId = window.setInterval(() => {
      socket.emit('presence:heartbeat');
    }, HEARTBEAT_MS);

    return () => {
      window.clearInterval(heartbeatId);
      socket.off('connect');
      socket.off('connect_error');
      socket.off('presence:online');
      socket.off('presence:offline');
      socket.disconnect();
      dispatch(presenceDisconnected());
    };
  }, [accessToken, dispatch]);

  return null;
}
