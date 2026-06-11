import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../api.js';
import { competitionService } from '../competitionService.js';

vi.mock('../api.js', () => ({
  default: {
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
        },
      },
    });

    await expect(competitionService.createRoom()).resolves.toEqual({
      id: 'room-1',
      code: 'ABC123',
      channelName: 'match-test',
    });
    expect(api.post).toHaveBeenCalledWith('/competitions');
  });

  it('joins a competition room by code and normalizes direct room responses', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        id: 'room-2',
        code: 'XYZ789',
        channelName: 'match-two',
      },
    });

    await expect(competitionService.joinRoom({ code: 'XYZ789' })).resolves.toEqual({
      id: 'room-2',
      code: 'XYZ789',
      channelName: 'match-two',
    });
    expect(api.post).toHaveBeenCalledWith('/competitions/join', { code: 'XYZ789' });
  });
});
