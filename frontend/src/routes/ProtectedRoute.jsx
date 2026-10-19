import { Navigate, Outlet } from 'react-router-dom';

import Spinner from '../components/Spinner/Spinner';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ allowedRoles }) {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return <Spinner label="Checking your session..." fullPage />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
