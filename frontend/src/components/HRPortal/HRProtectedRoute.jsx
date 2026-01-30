import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const HRProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = (user.role || '').toLowerCase();
  if (role !== 'hr') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default HRProtectedRoute;
