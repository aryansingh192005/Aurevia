import { NavLink, Outlet } from 'react-router-dom';

function AppLayout() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="brand">
          <span className="brand-name">Aurevia</span>
          <span className="brand-tagline">
            AI-Powered Rehabilitation
          </span>
        </div>

        <nav className="main-navigation" aria-label="Main navigation">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/exercises">Exercises</NavLink>
          <NavLink to="/sessions">Sessions</NavLink>
          <NavLink to="/progress">Progress</NavLink>
          <NavLink to="/login">Login</NavLink>
        </nav>
      </header>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;