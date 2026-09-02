import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import './AppLayout.css';

function AppLayout() {
  const navigate = useNavigate();

  const {
    user,
    isAuthenticated,
    logout,
  } = useAuth();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="brand">
          <span className="brand-name">
            Aurevia
          </span>

          <span className="brand-tagline">
            AI-Powered Rehabilitation
          </span>
        </div>

        <nav
          className="main-navigation"
          aria-label="Main navigation"
        >
          <NavLink to="/">
            Home
          </NavLink>

          {!isAuthenticated && (
            <>
              <NavLink to="/login">
                Login
              </NavLink>

              <NavLink to="/register">
                Register
              </NavLink>
            </>
          )}

          {isAuthenticated &&
            user.role === 'patient' && (
              <>
                <NavLink to="/dashboard">
                  Dashboard
                </NavLink>

                <NavLink to="/exercises">
                  Exercises
                </NavLink>

                <NavLink to="/sessions">
                  Sessions
                </NavLink>

                <NavLink to="/progress">
                  Progress
                </NavLink>
              </>
            )}

          {isAuthenticated &&
            user.role === 'therapist' && (
              <NavLink to="/therapist">
                Therapist Dashboard
              </NavLink>
            )}

          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </nav>
      </header>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;