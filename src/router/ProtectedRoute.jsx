import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/slices/authSlice.js';

export function ProtectedRoute({ children }) {
  const isAuth = useSelector(selectIsAuthenticated);
  return isAuth ? children : <Navigate to="/login" replace />;
}
