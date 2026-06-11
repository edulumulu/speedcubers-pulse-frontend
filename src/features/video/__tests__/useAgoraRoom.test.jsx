import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { agoraRtcService } from '../../../services/agoraRtcService.js';
import { useAgoraRoom } from '../useAgoraRoom.js';

vi.mock('../../../services/agoraRtcService.js', () => ({
  agoraRtcService: {
    createSession: vi.fn(),
  },
}));

const room = {
  appId: 'agora-app',
  channelName: 'match-test',
  token: 'rtc-token',
  uid: 42,
};

function createSessionMock() {
  return {
    leave: vi.fn().mockResolvedValue(undefined),
    playLocalVideo: vi.fn(),
  };
}

describe('useAgoraRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('joins Agora with the token data and cleans up on leave', async () => {
    const session = createSessionMock();
    agoraRtcService.createSession.mockResolvedValueOnce(session);

    const { result } = renderHook(() => useAgoraRoom(room));

    await waitFor(() => {
      expect(result.current.rtcStatus).toBe('connected');
    });

    expect(agoraRtcService.createSession).toHaveBeenCalledWith(expect.objectContaining(room));
    expect(session.playLocalVideo).toHaveBeenCalledWith(null);

    await act(async () => {
      await result.current.leaveRtcRoom();
    });

    expect(session.leave).toHaveBeenCalledTimes(1);
    expect(result.current.rtcStatus).toBe('idle');
    expect(result.current.remoteUsers).toEqual([]);
    expect(result.current.rtcError).toBeNull();
  });

  it('tracks remote users and binds their video tracks', async () => {
    const session = createSessionMock();
    let onRemoteUserJoined;
    let onRemoteUserLeft;
    agoraRtcService.createSession.mockImplementationOnce(async (options) => {
      onRemoteUserJoined = options.onRemoteUserJoined;
      onRemoteUserLeft = options.onRemoteUserLeft;
      return session;
    });
    const videoTrack = { play: vi.fn() };

    const { result } = renderHook(() => useAgoraRoom(room));

    await waitFor(() => {
      expect(result.current.rtcStatus).toBe('connected');
    });

    act(() => {
      onRemoteUserJoined({ uid: 7, videoTrack });
    });

    await waitFor(() => {
      expect(result.current.remoteUsers).toEqual([{ uid: 7, videoTrack }]);
    });

    const remoteVideoElement = document.createElement('div');
    act(() => {
      result.current.bindRemoteVideo(7, remoteVideoElement);
    });

    expect(videoTrack.play).toHaveBeenCalledWith(remoteVideoElement);

    act(() => {
      onRemoteUserLeft(7);
    });

    await waitFor(() => {
      expect(result.current.remoteUsers).toEqual([]);
    });
  });

  it('surfaces permission errors when Agora cannot access devices', async () => {
    agoraRtcService.createSession.mockRejectedValueOnce({ name: 'NotAllowedError' });

    const { result } = renderHook(() => useAgoraRoom(room));

    await waitFor(() => {
      expect(result.current.rtcStatus).toBe('failed');
    });

    expect(result.current.rtcError).toBe('Permiso de cámara o micrófono denegado');
    expect(result.current.remoteUsers).toEqual([]);
  });
});
