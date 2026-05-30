---
name: pre-push
description: Run lint and tests before pushing to remote. Use whenever the user says "push", "git push", "make a PR" or "open a pull request". Always run this before pushing — never skip it.
---

# Pre-push checklist

Before pushing any branch, always run lint and tests in this order.
If any step fails, fix the issue before pushing.

## Steps

### 1. Lint

```bash
npm run lint
```

- Must exit with **0 errors**.
- Warnings are allowed but must be reviewed.
- Common issues: unused imports, missing PropTypes, wrong quotes.
- Fix with `npm run lint:fix` for auto-fixable issues, then re-run.

### 2. Tests

```bash
npm test
```

- All tests must **pass**.
- If a test fails because the component changed intentionally, update the test — do not delete it.

### 3. Coverage (only before opening a PR)

```bash
npm run test:coverage
```

- Must meet the project thresholds defined in `vitest.config.js`.
- If coverage drops below threshold, either add tests or justify the exclusion.

### 4. Push

Only after all steps pass:

```bash
git push origin <branch>
```

## If the user tries to skip

Remind them:

> "El CI va a fallar igualmente — mejor pillarlo aquí que en GitHub."

## Quick fix reference

| Error | Fix |
|---|---|
| `is defined but never used` | Remove the import |
| `is missing in props validation` | Add `PropTypes` |
| `test failed` | Fix the component or update the test |
| Coverage below threshold | Add tests or exclude the file in `vitest.config.js` |
