const SECRET_ENV_PATTERNS = [
  /SECRET/i,
  /CERTIFICATE/i,
  /PRIVATE[_-]?KEY/i,
  /WEBHOOK/i,
  /STRIPE[_-]?SECRET/i,
];

export function exposedFrontendSecretKeys(env = {}) {
  return Object.keys(env).filter((key) => (
    key.startsWith('VITE_')
    && SECRET_ENV_PATTERNS.some((pattern) => pattern.test(key))
    && env[key]
  ));
}

export function assertNoFrontendSecrets(env = {}) {
  const exposedKeys = exposedFrontendSecretKeys(env);
  if (!exposedKeys.length) return;

  throw new Error(`Frontend env exposes secret-like keys: ${exposedKeys.join(', ')}`);
}
