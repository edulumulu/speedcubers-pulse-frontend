---
name: conventional-commit
description: Generate or validate a Conventional Commit message following the SpeedCubers Spain frontend commit conventions. Use whenever the user is about to commit, asks "how should I phrase this commit?", shows a diff and wants a commit message, or writes a vague message like "updated stuff" or "fix". Trigger proactively when the user says "commit" or "git commit" in any context.
---

# Conventional Commit

Help the user write a commit message that follows the project's Conventional Commits standard.

## Format

```
<type>(<scope>): <subject>

<body — optional>

<footer — optional>
```

## Rules

**Subject line** (required):
- Max 50 characters
- Imperative mood: "implement", not "implemented" or "implements"
- No period at the end
- Lowercase first letter

**Body** (when the change isn't obvious):
- Max 72 chars per line
- Explain WHAT changed and WHY, not HOW

**Types:**

| Type | Use for |
|------|---------|
| `feat` | New functionality |
| `fix` | Bug fix |
| `refactor` | Code change without behavior change |
| `test` | Adding or modifying tests |
| `docs` | Documentation only |
| `chore` | Deps, tooling, config |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |
| `style` | Formatting, no logic change |

**Frontend scopes:** `auth`, `timer`, `video`, `ranking`, `profile`, `ui`, `hooks`, `store`, `services`, `router`

## How to use this skill

If the user provides a diff or describes what they changed:
1. Identify the type and most appropriate scope
2. Draft a subject line (imperative, ≤50 chars)
3. Add a body if the change isn't self-explanatory
4. Show the full message ready to copy-paste

If the user provides a draft for validation:
1. Check against every rule above
2. Point out exactly what's wrong
3. Offer a corrected version

## Examples

```
feat(timer): implement client-side countdown with scramble display
```

```
fix(auth): handle token expiration in axios interceptor

Refresh was not being triggered when the access token expired
mid-session, causing silent 401s on protected routes.
```

```
feat(ranking): add real-time leaderboard via Socket.io

Closes #34
```

## Forbidden

**Never include co-authorship lines from AI tools.**

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

Commits in this repo are authored solely by the developer. Remove any such line.

**Bad → corrected:**
- `"update auth"` → `"refactor(auth): simplify token refresh logic"`
- `"Fixed timer bug."` → `"fix(timer): reset countdown on competition cancel"`
- `"wip"` → not valid — stash or finish the work
