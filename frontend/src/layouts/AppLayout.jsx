import { useState } from 'react';
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
  MoveUpRight,
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
    <div className={`app-layout ${isAuthenticated ? 'app-layout--workspace' : 'app-layout--public'}`}>
      {isAuthenticated ? (
        <>
          <button
            type="button"
            className={`sidebar-scrim ${menuOpen ? 'sidebar-scrim--visible' : ''}`}
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          />
          <aside className={`workspace-sidebar ${menuOpen ? 'workspace-sidebar--open' : ''}`}>
            <NavLink to="/" className="brand" onClick={() => setMenuOpen(false)}>
              <span className="brand-mark"><Activity size={21} strokeWidth={2.5} /></span>
              <span className="brand-text">
                <span className="brand-name">aurevia<span>.</span></span>
                <span className="brand-tagline">MOVE TOWARD BETTER</span>
              </span>
            </NavLink>
            <div className="sidebar-section-label">WORKSPACE</div>
            <nav className="main-navigation" aria-label="Main navigation">
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}>
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{label}</span>
                  {label === 'Dashboard' && <MoveUpRight className="nav-link-arrow" size={14} />}
                </NavLink>
              ))}
            </nav>
            <div className="sidebar-note">
              <span className="sidebar-note__icon"><Activity size={16} /></span>
              <div><strong>Small steps count.</strong><span>Your progress is built one session at a time.</span></div>
            </div>
            <div className="sidebar-bottom">
              <div className="nav-user">
                <span className="nav-user__avatar">{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                <span className="nav-user__info">
                  <span className="nav-user__name">{user?.name}</span>
                  <span className="nav-user__role">{user?.role}</span>
                </span>
                <button type="button" className="logout-button" onClick={handleLogout} title="Sign out">
                  <LogOut size={16} /> <span>Sign out</span>
                </button>
              </div>
            </div>
          </aside>
          <div className="workspace-main">
            <header className="workspace-topbar">
              <button
                type="button"
                className="menu-toggle"
                aria-label="Toggle navigation"
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? <X size={21} /> : <Menu size={21} />}
              </button>
              <div className="topbar-context"><span className="topbar-context__dot" /> Your rehabilitation space</div>
              <div className="topbar-user">
                <span className="topbar-user__name">{user?.name}</span>
                <span className="nav-user__avatar">{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                <button type="button" className="topbar-signout" onClick={handleLogout}>
                  <LogOut size={15} /><span>Sign out</span>
                </button>
              </div>
            </header>
            <main className="app-content"><Outlet /></main>
            <footer className="workspace-footer"><span>© {new Date().getFullYear()} Aurevia</span><span>Progress, at your pace.</span></footer>
          </div>
        </>
      ) : (
        <>
          <header className="app-header">
            <NavLink to="/" className="brand" onClick={() => setMenuOpen(false)}>
              <span className="brand-mark"><Activity size={21} strokeWidth={2.5} /></span>
              <span className="brand-text"><span className="brand-name">aurevia<span>.</span></span><span className="brand-tagline">MOVE TOWARD BETTER</span></span>
            </NavLink>
            <button type="button" className="menu-toggle" aria-label="Toggle navigation" onClick={() => setMenuOpen((open) => !open)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <nav className={`main-navigation ${menuOpen ? 'main-navigation--open' : ''}`} aria-label="Main navigation">
              <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
              <NavLink to="/login" onClick={() => setMenuOpen(false)}>Sign in</NavLink>
              <NavLink to="/register" className="nav-cta" onClick={() => setMenuOpen(false)}>Get started <MoveUpRight size={15} /></NavLink>
            </nav>
          </header>
          <main className="app-content"><Outlet /></main>
        </>
      )}
    </div>
  );
}

export default AppLayout;
