# 🎨 SpeedCubers Pulse - Frontend

React 18 frontend for SpeedCubers Pulse platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/TU-USUARIO/speedcubers-pulse-frontend.git
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

- **Architecture & Design**: See [docs/PROJECT_SPEC.md](../speedcubers-pulse-docs/PROJECT_SPEC.md)
- **Execution Standards**: See [EXECUTION_GUIDE.md](../speedcubers-pulse-docs/EXECUTION_GUIDE.md)
- **UI Components**: See `docs/COMPONENTS.md` (coming soon)

## ✅ Testing

```bash
npm test              # All tests
npm run test:unit    # Unit tests only
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

Target: >80% coverage

## 🎨 Styling

- **Framework**: Tailwind CSS 3.x
- **Components**: Shadcn/ui
- **Icons**: Lucide React

## 📦 Tech Stack

- **Framework**: React 18.x
- **Build Tool**: Vite 5.x
- **Router**: React Router 6.x
- **State Management**: Redux Toolkit
- **HTTP Client**: Axios
- **Real-time**: Socket.io client
- **Video**: Agora React SDK
- **Testing**: Vitest + React Testing Library

## 🏗️ Project Structure
```
src/
├── components/      # Reusable React components
├── pages/          # Page components
├── hooks/          # Custom React hooks
├── services/       # API & external services
├── store/          # Redux store & slices
├── utils/          # Utility functions
├── styles/         # Global styles
└── App.jsx         # Main app component
```

## 🔄 Git Workflow

See [EXECUTION_GUIDE.md](../speedcubers-pulse-docs/EXECUTION_GUIDE.md) for:
- Conventional Commits
- Branch naming
- Pull Request process

## 🚀 Deployment

Development: `npm run dev`  
Build: `npm run build`  
Preview build: `npm run preview`

Production deployment via GitHub Actions on `main` branch with tag `v*`

## 📋 Roadmap

- Phase 0: Setup ✅
- Phase 1: Authentication (Week 2-3)
- Phase 2: User Profiles (Week 3.5)
- Phase 3: Rankings (Week 4)
- [See full roadmap in PROJECT_SPEC.md](../speedcubers-pulse-docs/PROJECT_SPEC.md#plan-de-fases)

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

**Status**: Development (Phase 0)  
**Version**: 0.1.0  
**Last Updated**: 2026-05-16