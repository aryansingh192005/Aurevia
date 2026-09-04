import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/Alert/Alert';
import FormField from '../../components/FormField/FormField';
import Button from '../../components/Button/Button';

import '../../styles/auth.css';

function Login() {
  const navigate = useNavigate();

  const {
    login,
    loading,
    isAuthenticated,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    const result = await login(email.trim(), password);

    if (!result.success) {
      setError(result.error);
      return;
    }

    navigate('/dashboard', { replace: true });
  }

  return (
    <div className="auth-page">
      <div className="auth-showcase">
        <div className="auth-showcase__glow" aria-hidden="true" />
        <span className="auth-showcase__badge">Aurevia</span>
        <h2>Every rep, understood.</h2>
        <p>
          Sign in to pick up your rehabilitation plan right where you left
          off — AI form feedback and all.
        </p>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card animate-in">
          <h1>Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue your rehabilitation journey.</p>

          {error && <Alert variant="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <FormField label="Email" htmlFor="email">
              <div className="input-with-icon">
                <Mail size={17} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </FormField>

            <FormField label="Password" htmlFor="password">
              <div className="input-with-icon">
                <Lock size={17} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>
            </FormField>

            <Button type="submit" fullWidth loading={loading} icon={<ArrowRight size={16} />}>
              Sign In
            </Button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
