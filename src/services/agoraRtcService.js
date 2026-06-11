let agoraModulePromise;

function loadAgora() {
  if (!agoraModulePromise) {
    agoraModulePromise = import('agora-rtc-sdk-ng').then((m) => m.default ?? m);
  }
  return agoraModulePromise;
}

export const agoraRtcService = {
  async createSession({ appId, channelName, token, uid, onRemoteUserJoined, onRemoteUserLeft }) {
    const AgoraRTC = await loadAgora();
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    const localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
    const [, videoTrack] = localTracks;

    async function handleUserPublished(user, mediaType) {
      await client.subscribe(user, mediaType);
      if (mediaType === 'video' && user.videoTrack) {
        onRemoteUserJoined?.({
          uid: user.uid,
          videoTrack: user.videoTrack,
          audioTrack: user.audioTrack,
        });
      }
      if (mediaType === 'audio' && user.audioTrack) {
        user.audioTrack.play();
      }
    }

    function handleUserUnpublished(user, mediaType) {
      if (mediaType === 'video') {
        onRemoteUserLeft?.(user.uid);
      }
    }

    function handleUserLeft(user) {
      onRemoteUserLeft?.(user.uid);
    }

    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);
    client.on('user-left', handleUserLeft);

    try {
      await client.join(appId, channelName, token, uid);
      await client.publish(localTracks);
    } catch (err) {
      client.off('user-published', handleUserPublished);
      client.off('user-unpublished', handleUserUnpublished);
      client.off('user-left', handleUserLeft);
      localTracks.forEach((track) => {
        track.stop();
        track.close();
      });
      await client.leave().catch(() => {});
      throw err;
    }

    return {
      uid,
      client,
      localTracks,
      playLocalVideo(element) {
        if (element && videoTrack) videoTrack.play(element);
      },
      async leave() {
        client.off('user-published', handleUserPublished);
        client.off('user-unpublished', handleUserUnpublished);
        client.off('user-left', handleUserLeft);
        await client.unpublish(localTracks).catch(() => {});
        localTracks.forEach((track) => {
          track.stop();
          track.close();
        });
        await client.leave();
      },
    };
  },
};
