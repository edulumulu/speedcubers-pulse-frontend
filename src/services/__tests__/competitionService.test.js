import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../api.js';
import { competitionService } from '../competitionService.js';

vi.mock('../api.js', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

describe('competitionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a competition room and normalizes the response', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        competition: {
          roomId: 'room-1',
          roomCode: 'ABC123',
          videoChannelName: 'match-test',
          event: '2x2',
        },
      },
    });

    await expect(competitionService.createRoom({ event: '2x2' })).resolves.toEqual({
      id: 'room-1',
      code: 'ABC123',
      channelName: 'match-test',
      event: '2x2',
      status: 'waiting',
      host: null,
      guest: null,
      activeRound: null,
      latestCompletedRound: null,
      matchScore: null,
    });
    expect(api.post).toHaveBeenCalledWith('/competitions', { event: '2x2' });
  });

  it('joins a competition room by code and normalizes direct room responses', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        id: 'room-2',
        code: 'XYZ789',
        channelName: 'match-two',
        status: 'active',
      },
    });

    await expect(competitionService.joinRoom({ code: 'XYZ789' })).resolves.toEqual({
      id: 'room-2',
      code: 'XYZ789',
      channelName: 'match-two',
      event: '3x3',
      status: 'active',
      host: null,
      guest: null,
      activeRound: null,
      latestCompletedRound: null,
      matchScore: null,
    });
    expect(api.post).toHaveBeenCalledWith('/competitions/join', { code: 'XYZ789' });
  });

  it('gets a competition room by code', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        competition: {
          id: 'room-2',
          code: 'XYZ789',
          channelName: 'match-two',
          status: 'active',
        },
      },
    });

    await expect(competitionService.getRoom({ code: 'XYZ789' })).resolves.toEqual({
      id: 'room-2',
      code: 'XYZ789',
      channelName: 'match-two',
      event: '3x3',
      status: 'active',
      host: null,
      guest: null,
      activeRound: null,
      latestCompletedRound: null,
      matchScore: null,
    });
    expect(api.get).toHaveBeenCalledWith('/competitions/XYZ789');
  });

  it('updates the active round event and normalizes the room response', async () => {
    api.patch.mockResolvedValueOnce({
      data: {
        competition: {
          id: 'room-2',
          code: 'XYZ789',
          channelName: 'match-two',
          event: '3x3',
          status: 'active',
          activeRound: { id: 'round-1', number: 1, event: '2x2', scramble: 'R U F', status: 'active' },
        },
      },
    });

    await expect(competitionService.updateRoundEvent({ code: 'XYZ789', event: '2x2' })).resolves.toMatchObject({
      id: 'room-2',
      code: 'XYZ789',
      event: '3x3',
      activeRound: { event: '2x2', scramble: 'R U F' },
    });
    expect(api.patch).toHaveBeenCalledWith('/competitions/XYZ789/round/event', { event: '2x2' });
  });

  it('submits a competition result and unwraps the result payload', async () => {
    const result = {
      id: 'result-1',
      timeMs: 12345,
      penalty: '+2',
    };
    api.post.mockResolvedValueOnce({ data: { result } });

    await expect(
      competitionService.submitResult({ code: 'ABC123', timeMs: 12345, penalty: '+2' }),
    ).resolves.toEqual(result);
    expect(api.post).toHaveBeenCalledWith('/competitions/ABC123/results', {
      timeMs: 12345,
      penalty: '+2',
    });
  });
});
