---
name: new-branch
description: Create a new git branch following the SpeedCubers Spain GitFlow conventions. Use whenever the user wants to start working on a new feature, bug fix, refactor, or docs change — even if they just say "let's start on X" or "I want to implement the timer". Trigger proactively when the user is about to start coding something new.
---

# New Branch

Create a new branch following the project's GitFlow conventions.

## Branch naming

Format: `<type>/<short-description-in-kebab-case>`

| Type | When to use |
|------|-------------|
| `feature/` | New functionality |
| `fix/` | Bug fix |
| `refactor/` | Code restructure without behavior change |
| `docs/` | Documentation only |

Examples: `feature/auth-login-form`, `fix/timer-reset-on-cancel`, `refactor/ranking-slice`, `docs/component-storybook`

## Steps

1. Clarify what the user is working on if not obvious from context.
2. Suggest a branch name. Let the user confirm or adjust.
3. Run:

```bash
git checkout develop
git pull origin develop
git checkout -b <type>/<description>
```

4. Confirm the branch was created and remind the commit format.

## Commit format reminder

```
<type>(<scope>): <subject>
```

Frontend scopes: `auth`, `timer`, `video`, `ranking`, `profile`, `ui`, `hooks`, `store`, `services`, `router`

Good: `feat(timer): implement client-side countdown`  
Bad: `updated timer code`

PRs always target `develop`, never `main` directly.
