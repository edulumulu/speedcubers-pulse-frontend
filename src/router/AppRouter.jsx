import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from '../components/ui/Navbar.jsx';
import { LoginPage } from '../features/auth/LoginPage.jsx';
import { RegisterPage } from '../features/auth/RegisterPage.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';

function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
      <p className="text-muted text-sm">Ranking — próximamente (Fase 3)</p>
    </div>
  );
}

export function AppRouter() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
