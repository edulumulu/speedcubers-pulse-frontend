import { describe, expect, it } from 'vitest';
import { assertNoFrontendSecrets, exposedFrontendSecretKeys } from '../runtimeSecurity.js';

describe('runtimeSecurity', () => {
  it('allows public Vite configuration keys', () => {
    expect(exposedFrontendSecretKeys({
      VITE_API_URL: 'https://api.speedcubers.test/api/v1',
      VITE_SOCKET_URL: 'https://api.speedcubers.test',
      VITE_AGORA_APP_ID: 'public-app-id',
    })).toEqual([]);
  });

  it('detects secret-like Vite keys with values', () => {
    expect(exposedFrontendSecretKeys({
      VITE_AGORA_APP_CERTIFICATE: 'secret',
      VITE_STRIPE_SECRET_KEY: 'sk_test',
      VITE_API_URL: 'https://api.speedcubers.test/api/v1',
    })).toEqual(['VITE_AGORA_APP_CERTIFICATE', 'VITE_STRIPE_SECRET_KEY']);
  });

  it('throws before bootstrapping when a secret-like key is exposed', () => {
    expect(() => assertNoFrontendSecrets({
      VITE_PRIVATE_KEY: 'secret',
    })).toThrow('Frontend env exposes secret-like keys: VITE_PRIVATE_KEY');
  });
});
