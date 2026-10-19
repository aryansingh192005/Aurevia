import { Navigate, Outlet } from 'react-router-dom';

import Spinner from '../components/Spinner/Spinner';
import { useAuth } from '../context/AuthContext';

function RoleRoute({ allowedRole }) {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return <Spinner label="Checking your session..." fullPage />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (user.role !== allowedRole) {
    return (
      <Navigate
        to={
          user.role === 'patient'
            ? '/patient/dashboard'
            : '/therapist/dashboard'
        }
        replace
      />
    );
  }

  return <Outlet />;
}

export default RoleRoute;
