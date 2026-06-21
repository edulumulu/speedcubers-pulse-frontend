let userCounter = 0;

export function uniqueE2eUser() {
  userCounter += 1;
  const suffix = `${Date.now().toString(36).slice(-8)}${userCounter.toString(36)}`;
  return {
    username: `e2e${suffix}`,
    email: `e2e-${suffix}@speedcubers.dev`,
    password: 'Password1',
  };
}
