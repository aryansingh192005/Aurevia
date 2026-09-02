import { Navigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

function DashboardRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'patient') {
    return (
      <Navigate
        to="/patient/dashboard"
        replace
      />
    );
  }

  if (user.role === 'therapist') {
    return (
      <Navigate
        to="/therapist/dashboard"
        replace
      />
    );
  }

  return <Navigate to="/" replace />;
}

export default DashboardRedirect;