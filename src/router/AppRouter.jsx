import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from '../components/ui/Navbar.jsx';
import { LoginPage } from '../features/auth/LoginPage.jsx';
import { RegisterPage } from '../features/auth/RegisterPage.jsx';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage.jsx';
import { ProfilePage } from '../features/profile/ProfilePage.jsx';
import { UserProfilePage } from '../features/profile/UserProfilePage.jsx';
import { RankingPage } from '../features/ranking/RankingPage.jsx';
import { VideoRoomPage } from '../features/video/VideoRoomPage.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { GuestRoute } from './GuestRoute.jsx';

export function AppRouter() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<RankingPage />} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/compete" element={<ProtectedRoute><VideoRoomPage /></ProtectedRoute>} />
        <Route path="/users/:username" element={<UserProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
