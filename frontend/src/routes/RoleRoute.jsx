import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

function RoleRoute({ allowedRole }) {
  const { user } = useAuth();

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