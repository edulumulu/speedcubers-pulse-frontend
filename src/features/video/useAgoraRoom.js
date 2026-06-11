import { useCallback, useEffect, useRef, useState } from 'react';
import { agoraRtcService } from '../../services/agoraRtcService.js';

const initialState = {
  status: 'idle',
  error: null,
  remoteUsers: [],
};

function friendlyAgoraError(err) {
  if (err?.name === 'NotAllowedError' || err?.code === 'PERMISSION_DENIED') {
    return 'Permiso de cámara o micrófono denegado';
  }
  if (err?.code === 'DEVICE_NOT_FOUND') {
    return 'No se ha encontrado cámara o micrófono';
  }
  return err?.message || 'No se pudo conectar con Agora';
}

export function useAgoraRoom(room) {
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());
  const sessionRef = useRef(null);
  const [state, setState] = useState(initialState);

  const leaveRtcRoom = useCallback(async () => {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) {
      await session.leave();
    }
    remoteVideoRefs.current.clear();
    setState(initialState);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function joinRtcRoom() {
      if (!room?.appId || !room?.channelName || !room?.token || room.uid === null || room.uid === undefined) {
        return;
      }

      setState({ status: 'joining', error: null, remoteUsers: [] });
      try {
        const session = await agoraRtcService.createSession({
          appId: room.appId,
          channelName: room.channelName,
          token: room.token,
          uid: room.uid,
          onRemoteUserJoined: (remoteUser) => {
            setState((current) => ({
              ...current,
              remoteUsers: [
                ...current.remoteUsers.filter((user) => user.uid !== remoteUser.uid),
                remoteUser,
              ],
            }));
          },
          onRemoteUserLeft: (uid) => {
            setState((current) => ({
              ...current,
              remoteUsers: current.remoteUsers.filter((user) => user.uid !== uid),
            }));
            remoteVideoRefs.current.delete(uid);
          },
        });

        if (cancelled) {
          await session.leave();
          return;
        }

        sessionRef.current = session;
        session.playLocalVideo(localVideoRef.current);
        setState((current) => ({ ...current, status: 'connected' }));
      } catch (err) {
        if (!cancelled) {
          setState({ status: 'failed', error: friendlyAgoraError(err), remoteUsers: [] });
        }
      }
    }

    joinRtcRoom();

    return () => {
      cancelled = true;
      const session = sessionRef.current;
      sessionRef.current = null;
      if (session) {
        session.leave();
      }
    };
  }, [room]);

  const bindRemoteVideo = useCallback((uid, element) => {
    if (!element) return;
    remoteVideoRefs.current.set(uid, element);
    const remoteUser = state.remoteUsers.find((user) => user.uid === uid);
    remoteUser?.videoTrack?.play(element);
  }, [state.remoteUsers]);

  return {
    localVideoRef,
    remoteUsers: state.remoteUsers,
    rtcStatus: state.status,
    rtcError: state.error,
    bindRemoteVideo,
    leaveRtcRoom,
  };
}
