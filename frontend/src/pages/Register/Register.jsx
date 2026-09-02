import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

function Register() {
  const navigate = useNavigate();

  const {
    register,
    loading,
  } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient',
  });

  const [error, setError] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      setError('All fields are required.');
      return;
    }

    if (form.password.length < 8) {
      setError(
        'Password must be at least 8 characters.',
      );
      return;
    }

    const result = await register(
      form.name.trim(),
      form.email.trim(),
      form.password,
      form.role,
    );

    if (!result.success) {
      setError(result.error);
      return;
    }

    navigate('/dashboard', { replace: true });
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>Create your Aurevia account</h1>

        <p>
          Choose your role and get started.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">
              Full Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-email">
              Email
            </label>

            <input
              id="register-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-password">
              Password
            </label>

            <input
              id="register-password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">
              Account Type
            </label>

            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <option value="patient">
                Patient
              </option>

              <option value="therapist">
                Therapist
              </option>
            </select>
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
            {loading
              ? 'Creating account...'
              : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}

export default Register;