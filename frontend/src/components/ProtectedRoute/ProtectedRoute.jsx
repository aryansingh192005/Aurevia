import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

function ProtectedRoute({ allowedRoles }) {
  const {
    user,
    loading,
    isAuthenticated,
  } = useAuth();

  const location = useLocation();

  if (loading) {
    return (
      <section>
        <h1>Loading Aurevia...</h1>
        <p>Checking your session.</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    if (user.role === 'therapist') {
      return (
        <Navigate
          to="/therapist"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;