import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

function Login() {
  const navigate = useNavigate();

  const {
    login,
    loading,
    isAuthenticated,
    user,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    navigate('/dashboard', { replace: true });
  }, [isAuthenticated, user, navigate]);

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

    const result = await login(
      email.trim(),
      password,
    );

    if (!result.success) {
      setError(result.error);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>Welcome back</h1>

        <p>
          Sign in to continue your rehabilitation journey.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register">
            Create one
          </Link>
        </p>
      </div>
    </section>
  );
}

export default Login;