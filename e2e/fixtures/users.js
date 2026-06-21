export function uniqueE2eUser() {
  const suffix = Date.now().toString(36).slice(-8);
  return {
    username: `e2e${suffix}`,
    email: `e2e-${suffix}@speedcubers.dev`,
    password: 'Password1',
  };
}
