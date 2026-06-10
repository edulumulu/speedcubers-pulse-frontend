# 🎨 SpeedCubers Pulse - Frontend

React 18 frontend for SpeedCubers Pulse platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/edulumulu/speedcubers-pulse-frontend.git
cd speedcubers-pulse-frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

App runs on `http://localhost:5173`

## 📖 Documentation

- **Architecture & Design**: See [SPEEDCUBERS_SPAIN_PROJECT_SPEC.md](../speedcubers-pulse-docs/SPEEDCUBERS_SPAIN_PROJECT_SPEC.md)
- **Execution Standards**: See [PROFESSIONAL_EXECUTION_GUIDE.md](../speedcubers-pulse-docs/PROFESSIONAL_EXECUTION_GUIDE.md)
- **UI Components**: Shared components live in `src/components/`

## ✅ Testing

```bash
npm test              # All tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

Target: >80% coverage

## 🎨 Styling

- **Framework**: Tailwind CSS 3.x
- **Components**: Custom shared components in `src/components/`

## 📦 Tech Stack

- **Framework**: React 18.x
- **Build Tool**: Vite 5.x
- **Router**: React Router 6.x
- **State Management**: Redux Toolkit
- **HTTP Client**: Axios
- **Real-time**: Socket.io client
- **Video**: Agora React SDK (planned Phase 4)
- **Testing**: Vitest + React Testing Library

## 🏗️ Project Structure
```
src/
├── components/      # Shared UI components
├── features/        # Feature modules: auth, profile, ranking
├── router/          # React Router config and route guards
├── services/        # API clients and external services
├── store/           # Redux store and slices
├── styles/          # Global styles
└── App.jsx          # Main app component
```

## 🔄 Git Workflow

See [PROFESSIONAL_EXECUTION_GUIDE.md](../speedcubers-pulse-docs/PROFESSIONAL_EXECUTION_GUIDE.md) for:
- Conventional Commits
- Branch naming
- Pull Request process

## 🚀 Deployment

Development: `npm run dev`  
Build: `npm run build`  
Preview build: `npm run preview`

Production deployment via GitHub Actions on `main` branch with tag `v*`

## 📋 Roadmap

- Phase 0: Setup ✅ (complete)
- Phase 1: Authentication ✅
- Phase 2: User Profiles ✅
- Phase 3: Rankings + leaderboard ✅
- Phase 4: Video calling with Agora.io (next)
- [See full roadmap in SPEEDCUBERS_SPAIN_PROJECT_SPEC.md](../speedcubers-pulse-docs/SPEEDCUBERS_SPAIN_PROJECT_SPEC.md#plan-de-fases)

## 👨‍💻 Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes following code standards
3. Run tests: `npm test`
4. Commit: `git commit -m "feat(scope): description"`
5. Push: `git push origin feature/my-feature`
6. Create Pull Request

## 📞 Questions?

Open an issue in this repository.

---

**Status**: Development (Fases 0, 1, 2 y 3 completas; próxima Fase 4)
**Version**: 0.1.0  
**Last Updated**: 2026-06-10
