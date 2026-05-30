---
name: security-check
description: Audit frontend code against the SpeedCubers Spain security requirements. Use when reviewing code before merging, when implementing auth token handling, API calls, or any user-facing form. Trigger proactively when the user shows code that deals with tokens, localStorage, user input, or third-party SDK configuration.
---

# Security Check (Frontend)

Audit frontend code against the security requirements for this project.

## What to audit

If a file path or diff is provided, audit that. Otherwise run `git diff HEAD`.

## Checklist

Mark ✅ (safe) or ❌ (needs fix) with a one-line note.

### Token & credential storage
- [ ] JWT access token stored in memory (Redux state), NOT in `localStorage` or `sessionStorage`
- [ ] No Agora App Certificate in any frontend file or env variable
- [ ] `VITE_` prefixed env vars contain no secrets (they are bundled and visible to users)
- [ ] No API keys, secrets, or passwords hardcoded in source

### API calls
- [ ] All requests use the axios instance with JWT interceptor — no raw `fetch` with manual token headers
- [ ] Token refresh handled silently in the axios interceptor, not spread across components
- [ ] 401 responses redirect to login and clear auth state

### User input
- [ ] Forms validate client-side for UX but do NOT skip backend validation
- [ ] No user-generated content rendered as raw HTML (`dangerouslySetInnerHTML` without sanitization)
- [ ] WCA IDs entered by users are validated format client-side before submitting

### Timer (critical)
- [ ] Timer uses `performance.now()` for precision, not `Date.now()`
- [ ] Result submitted to backend includes the raw time only — no client-side "win/lose" decision
- [ ] No security logic runs based on timer state alone

### Dependency safety
- [ ] No `npm audit` critical vulnerabilities introduced
- [ ] No `eval()` or dynamic `import()` with user-controlled strings

### Agora.io
- [ ] RTC tokens are fetched from the backend — never generated client-side
- [ ] App Certificate is never in any frontend file

## Output format

List every item checked. Group failures at the top. For each failure include the file and approximate line, and a concrete fix.

If everything passes, say so clearly and note what was in scope.
