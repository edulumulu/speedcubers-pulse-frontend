import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuthBootstrapped, selectIsAuthenticated } from '../store/slices/authSlice.js';

export function ProtectedRoute({ children }) {
  const bootstrapped = useSelector(selectAuthBootstrapped);
  const isAuth = useSelector(selectIsAuthenticated);
  if (!bootstrapped) return null;
  return isAuth ? children : <Navigate to="/login" replace />;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
