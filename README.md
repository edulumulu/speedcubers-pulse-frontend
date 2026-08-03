# SpeedCubers Pulse - Frontend

Frontend React/Vite de SpeedCubers Pulse: ranking, perfiles, presencia online, retos directos y sala de competición 1v1 con vídeo.

Este repositorio forma parte del proyecto de TFM. La documentación de entrega está centralizada en:

- https://github.com/edulumulu/speedcubers-pulse-docs
- [README de entrega](../speedcubers-pulse-docs/README.md)

## Demo

| Recurso | URL |
|---|---|
| Aplicación staging/demo | https://speedcubers-pulse-frontend.vercel.app |
| Backend staging/demo | https://speedcubers-pulse-backend-production.up.railway.app |

## Stack

- React 18
- Vite 7
- Redux Toolkit
- React Router 6
- Tailwind CSS 3
- Axios
- Socket.io client
- Agora Web SDK
- `@cubing/icons`
- Vitest + React Testing Library
- Playwright
- Vercel staging/demo

## Funcionalidades frontend

- Registro, login, logout y restauración de sesión.
- Ranking por categorías de cubo.
- Perfiles públicos y perfil privado.
- Lista de usuarios online.
- Retos directos desde navbar y perfil público.
- Popup de reto recibido, esperando respuesta, cancelar, aceptar y rechazar.
- Sala de competición 1v1 con cámara local/remota.
- Selector visual de tipo de cubo.
- Scramble compartido.
- Inspección sincronizada.
- Timer local por competidor.
- Envío de resultado con `OK`, `+2` y `DNF`.
- Marcador de rondas.
- Límite de vídeo y mensajes de cuota agotada.

## Instalación local

### Requisitos

- Node.js 20.x
- npm
- Backend local arrancado en `http://localhost:3000`

### Setup inicial

```bash
git clone https://github.com/edulumulu/speedcubers-pulse-frontend.git
cd speedcubers-pulse-frontend
npm install
cp .env.example .env
npm run dev
```

Aplicación local: `http://localhost:5173`

## Usuarios de prueba

Tras cargar fixtures en backend:

| Usuario | Email | Contraseña |
|---|---|---|
| `edulumulu` | `edu@edu.com` | `Abcd1234` |
| `margallego` | `mar@mar.com` | `Abcd1234` |

Para probar retos directos o competición 1v1, usa dos navegadores o una ventana normal/incógnito con usuarios distintos.

## Variables de entorno

Consulta `.env.example`, `.env.develop.example` y `.env.production.example`.

Variables principales:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
VITE_AGORA_APP_ID=
```

No añadir secretos al frontend. En concreto, nunca usar `VITE_AGORA_APP_CERTIFICATE`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor Vite local |
| `npm test` | Tests unitarios/componentes |
| `npm run test:watch` | Tests en watch mode |
| `npm run test:coverage` | Cobertura |
| `npm run test:e2e` | Playwright E2E |
| `npm run test:e2e:debug` | Playwright en modo debug |
| `npm run build` | Build producción |
| `npm run preview` | Preview del build |

## Estructura

```text
src/
├── components/          # Componentes UI compartidos
├── features/
│   ├── auth/            # Login, registro, recuperación
│   ├── challenges/      # Popup global de retos directos
│   ├── presence/        # Socket lifecycle y online users
│   ├── profile/         # Perfil privado/público
│   ├── ranking/         # Ranking por eventos
│   ├── timer/           # Timer e inspección
│   └── video/           # Sala 1v1 y Agora
├── router/              # Rutas y guards
├── services/            # API clients y sockets
├── store/               # Redux slices
├── styles/              # CSS global/Tailwind
└── App.jsx
```

## Despliegue

- Proveedor actual staging/demo: Vercel Hobby.
- Rama de despliegue: `develop`.
- Build command: `npm run build`.
- Output: `dist`.
- Configuración: `vercel.json`.

## Documentación relacionada

- [README de entrega](../speedcubers-pulse-docs/README.md)
- [Especificación completa](../speedcubers-pulse-docs/SPEEDCUBERS_SPAIN_PROJECT_SPEC.md)
- [Guía profesional](../speedcubers-pulse-docs/PROFESSIONAL_EXECUTION_GUIDE.md)
- [Plan de staging/demo](../speedcubers-pulse-docs/STAGING_DEPLOYMENT_PLAN.md)
- [Plan de entrega TFM](../speedcubers-pulse-docs/TFM_DELIVERY_PLAN.md)
