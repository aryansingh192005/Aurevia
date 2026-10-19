import { useEffect, useState } from 'react';
import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';
import {
  Activity,
  Accessibility,
  BarChart3,
  BrainCircuit,
  ClipboardList,
  Dumbbell,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

import './AppLayout.css';

const PATIENT_LINKS = [
  { to: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/patient/exercises', label: 'My Exercises', icon: Dumbbell },
  { to: '/patient/care-plan', label: 'Care Plan', icon: ClipboardList },
  { to: '/patient/privacy', label: 'Privacy & Data', icon: Accessibility },
  { to: '/exercises', label: 'Exercise Library', icon: Activity },
  { to: '/sessions', label: 'Session History', icon: History },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
];

const THERAPIST_LINKS = [
  { to: '/therapist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/therapist/patients', label: 'Patients', icon: Users },
  { to: '/therapist/assign-exercise', label: 'Assign Exercise', icon: ClipboardList },
  { to: '/therapist/care-plans', label: 'Care Plans', icon: ClipboardList },
  { to: '/therapist/sessions', label: 'Session Results', icon: History },
  { to: '/therapist/review', label: 'Review AI Data', icon: BrainCircuit },
];

function AppLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [largeText, setLargeText] = useState(() => localStorage.getItem('aurevia.largeText') === 'true');

  useEffect(() => {
    document.documentElement.style.fontSize = largeText ? '112.5%' : '';
    localStorage.setItem('aurevia.largeText', String(largeText));
  }, [largeText]);

  const {
    user,
    isAuthenticated,
    logout,
  } = useAuth();

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  }

  const links = isAuthenticated
    ? (user?.role === 'therapist' ? THERAPIST_LINKS : PATIENT_LINKS)
    : [];

  return (
    <div className="app-layout">
      <header className="app-header">
        <NavLink to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">A</span>
          <span className="brand-text">
            <span className="brand-name">Aurevia</span>
            <span className="brand-tagline">AI-Powered Rehabilitation</span>
          </span>
        </NavLink>

        <button
          type="button"
          className="menu-toggle"
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav
          className={`main-navigation ${menuOpen ? 'main-navigation--open' : ''}`}
          aria-label="Main navigation"
        >
          {!isAuthenticated && (
            <>
              <NavLink to="/" end onClick={() => setMenuOpen(false)}>
                Home
              </NavLink>

              <NavLink to="/login" onClick={() => setMenuOpen(false)}>
                Login
              </NavLink>

              <NavLink to="/register" className="nav-cta" onClick={() => setMenuOpen(false)}>
                Get Started
              </NavLink>
            </>
          )}

          {isAuthenticated &&
            links.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}>
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}

          {isAuthenticated && (
            <button
              type="button"
              className="accessibility-toggle"
              aria-pressed={largeText}
              onClick={() => setLargeText((value) => !value)}
              title="Adjust text size"
            >
              <Accessibility size={16} /> <span>{largeText ? 'Text: large' : 'Text size'}</span>
            </button>
          )}

          {isAuthenticated && (
            <div className="nav-user">
              <span className="nav-user__avatar">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
              <span className="nav-user__info">
                <span className="nav-user__name">{user?.name}</span>
                <span className="nav-user__role">{user?.role}</span>
              </span>

              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
                aria-label="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
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
