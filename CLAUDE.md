# SpeedCubers Pulse — Frontend Context

Red social para speedcubers españoles: competencias 1v1 en tiempo real con videoconferencia, rankings y presencia online. Proyecto de Fin de Master — MVP en 8 semanas.

**Estado actual**: Fase 0 (setup inicial).

## Arquitectura

React 18 con estructura por features. Cada feature agrupa sus propios componentes, hooks, y lógica local:

```
src/
  features/
    auth/          # Login, register, WCA link
    timer/         # Countdown, solve display
    competition/   # Lobby, match, result
    ranking/       # Leaderboard, stats
    profile/       # User profile, WCA data
  components/      # Shared UI components (Button, Modal, etc.)
  hooks/           # Shared hooks (useSocket, useAuth, etc.)
  store/           # Redux Toolkit slices + selectors
  services/        # API clients (axios instances, socket.io client)
  router/          # React Router config
  utils/           # Pure helpers
```

**Redux Toolkit** para estado global (auth, ranking, presence). Estado local de componentes con `useState`/`useReducer`. No mezclar: si el estado no se comparte entre features, va local.

**Decisión crítica**: el timer corre 100% en el cliente. El resultado se envía al backend al terminar. El servidor solo valida el rango (0–600s) — no confiar en respuestas del servidor para el tick del timer.

## Stack

- React 18 + Vite 5
- Redux Toolkit (RTK Query para llamadas a la API)
- React Router 6
- Tailwind CSS 3 + Shadcn/ui
- Axios (instancia con interceptors para JWT)
- Socket.io client 4
- Agora React SDK (videoconferencia)
- Vitest + React Testing Library (tests)
- ESLint + Prettier

## Convenciones de commits

Conventional Commits obligatorio: `<type>(<scope>): <subject>`

Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`, `style`

Scopes: `auth`, `timer`, `video`, `ranking`, `profile`, `ui`, `hooks`, `store`, `services`, `router`

Subject: imperativo, max 50 chars, sin punto final, minúsculas.

Ejemplos válidos:
```
feat(timer): implement client-side countdown with scramble display
fix(auth): handle token expiration in axios interceptor
test(ranking): add leaderboard rendering tests
```

## Branches

GitFlow simplificado:
- `main` — producción, solo merges via PR taggeados `v*.*.*`
- `develop` — staging, target de PRs de feature
- `feature/<name>`, `fix/<name>`, `refactor/<name>`, `docs/<name>` — ramas de trabajo

**Nunca force push a `main` o `develop`.**

## Testing

```
src/
  features/<feature>/__tests__/   # Tests junto a la feature
  components/__tests__/           # Tests de componentes compartidos
e2e/                              # Tests E2E con Playwright (Fase 7)
  fixtures/                       # Helpers: createUser(), loginAs(), etc.
  flows/                          # Specs por flujo de usuario
  playwright.config.ts
```

- Tests unitarios con Vitest + React Testing Library
- No mockear Redux store completo — usar `renderWithProviders` con un store real configurado para tests
- `msw` para interceptar llamadas HTTP en tests (no mockear axios directamente)
- **Tests E2E con Playwright** — se añaden en Fase 7, cuando las features principales estén estabilizadas. Ver plan completo en `../speedcubers-pulse-docs/PLAYWRIGHT_E2E_PLAN.md`

Targets:
- >80% cobertura global (Vitest)
- >95% en lógica de `auth` y `timer`
- Cada componente nuevo debe tener al menos un test de render
- Flujos E2E cubiertos: registro/login, vincular WCA, reto 1v1 completo, leaderboard

## Seguridad (frontend)

- Nunca almacenar tokens JWT en `localStorage` — usar `httpOnly cookies` o memoria (en RAM con Redux)
- No mostrar información sensible de otros usuarios sin que el backend lo autorice
- Validar inputs en cliente antes de enviar (UX), pero confiar en la validación del backend para seguridad
- No exponer claves de Agora.io en el bundle — el backend genera los tokens RTC

## Variables de entorno (Vite)

Solo variables prefijadas con `VITE_` son accesibles en el bundle. Ver `.env.example`.

Variables críticas:
- `VITE_API_URL` — URL base del backend
- `VITE_SOCKET_URL` — URL del servidor Socket.io
- `VITE_AGORA_APP_ID` — App ID de Agora (público, no secret)

**Nunca incluir `VITE_AGORA_APP_CERTIFICATE` ni ningún secreto en el frontend.**

## Comandos útiles

```bash
npm run dev          # Dev server (puerto 5173)
npm run build        # Build de producción
npm run preview      # Preview del build
npm test             # Vitest una sola pasada
npm run test:watch   # Vitest en modo watch
npm run test:coverage
npm run lint         # ESLint + Prettier check
npm run lint:fix     # Auto-fix
```

## Antes de hacer push

**Siempre** ejecutar en este orden antes de `git push` o abrir un PR:

```bash
npm run lint          # 0 errores obligatorio
npm test              # todos los tests deben pasar
npm run test:coverage # solo antes de abrir PR — verificar umbrales
```

Si algo falla, corregirlo antes de pushear. El CI lo detectará de todas formas.
Usa la skill `/pre-push` para que Claude lo ejecute automáticamente.

## Fases del MVP

| Fase | Contenido | Estado |
|------|-----------|--------|
| 0 | Setup e infraestructura | ✅ |
| 1 | Autenticación (login/register + WCA opcional) | ⏳ Siguiente |
| 2 | Perfiles de usuario | — |
| 3 | Rankings + leaderboard | — |
| 4 | Videoconferencia (Agora.io) | — |
| 5 | Sistema de timing (cliente) | — |
| 6 | Presencia online | — |
| 7 | Integración, e2e, polish | — |
| 8 | Deployment (Railway/Vercel) | — |

## Documentación externa

- Spec completa y schema de BD: `../speedcubers-pulse-docs/SPEEDCUBERS_SPAIN_PROJECT_SPEC.md`
- Guía de commits, CI/CD, security checklist: `../speedcubers-pulse-docs/PROFESSIONAL_EXECUTION_GUIDE.md`
- Contexto general del proyecto: `../speedcubers-pulse-docs/CLAUDE.md`
- Backend API: `../speedcubers-pulse-backend/` — endpoints documentados en `src/presentation/routes/`
