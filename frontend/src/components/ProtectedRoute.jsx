import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// If `roles` is provided, only authenticated users with one of those roles
// may access the wrapped route. Unauthenticated users go to /login.
export default function ProtectedRoute({ children, roles = null }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="full-page-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}