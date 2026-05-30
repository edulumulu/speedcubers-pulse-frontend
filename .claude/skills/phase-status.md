---
name: phase-status
description: Show the current frontend development phase status, including completed tasks, pending tasks, and next steps. Use when the user asks "where are we?", "what's next?", "what phase are we in?", or when starting a new work session. Also trigger when the user mentions a phase number or says things like "let's start phase 2" or "what's left in this phase".
---

# Phase Status

Give the user a clear picture of where the frontend is in the 8-week MVP plan.

## How to determine the current phase

1. If the user specifies a phase number, use that.
2. Otherwise, inspect `src/` to check which files exist against the phase deliverables below.
3. Cross-reference with `git log --oneline -20` to see recent work.

## Frontend phase map

| Phase | Name | Key frontend deliverables |
|-------|------|---------------------------|
| 0 | Setup | Vite config, Tailwind, Router skeleton, RTK store, ESLint/Prettier |
| 1 | Auth | Login/register forms, JWT handling, axios interceptor, protected routes |
| 2 | Profiles | Profile page, WCA data display, avatar, edit form |
| 3 | Ranking | Leaderboard page, stats cards, RTK Query integration |
| 4 | Video | Agora.io integration, competition lobby, video grid |
| 5 | Timing | Timer component, scramble display, solve submission |
| 6 | Presence | Online indicator, Socket.io presence, real-time updates |
| 7 | Polish | E2E tests (Playwright), accessibility audit, loading states, error boundaries |
| 8 | Deploy | Vercel/Railway config, env setup, production build verification |

## What to show

```
## Phase <N>: <Name>

### Completed ✅
- [x] ...

### Pending ⏳
- [ ] ...

### Expected commits for this phase
feat(auth): ...
test(auth): ...

### Next phase: <N+1> — <Name>
First tasks: ...
```

Keep it scannable. List frontend tasks only. Flag anything risky — e.g. Phase 4 Agora.io requires backend token generation to be working first; Phase 5 timer precision depends on `performance.now()` not `Date.now()`.

After showing the status, suggest the next concrete action.
