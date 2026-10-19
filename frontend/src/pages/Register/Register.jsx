import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, HeartPulse, Lock, Mail, Stethoscope, User } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/Alert/Alert';
import FormField from '../../components/FormField/FormField';
import Button from '../../components/Button/Button';
import Spinner from '../../components/Spinner/Spinner';

import '../../styles/auth.css';

function Register() {
  const navigate = useNavigate();

  const { register, loading, isReady, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient',
    therapistCode: '',
  });

  const [error, setError] = useState('');

  if (!isReady) {
    return <Spinner label="Checking your session..." fullPage />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function selectRole(role) {
    setForm((current) => ({ ...current, role }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('All fields are required.');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    const result = await register(
      form.name.trim(),
      form.email.trim(),
      form.password,
      form.role,
      form.therapistCode,
    );

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
        <h2>Join a smarter rehab program.</h2>
        <p>
          Whether you're recovering or prescribing recovery, Aurevia keeps
          every session measured and every rep counted.
        </p>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card auth-card--wide animate-in">
          <h1>Create your Aurevia account</h1>
          <p className="auth-subtitle">Create a patient account or use your therapist invitation code.</p>

          {error && <Alert variant="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <div className="role-picker">
              <button
                type="button"
                className={`role-option ${form.role === 'patient' ? 'role-option--active' : ''}`}
                onClick={() => selectRole('patient')}
              >
                <HeartPulse size={20} />
                <span>Patient</span>
              </button>

              <button
                type="button"
                className={`role-option ${form.role === 'therapist' ? 'role-option--active' : ''}`}
                onClick={() => selectRole('therapist')}
              >
                <Stethoscope size={20} />
                <span>Therapist</span>
              </button>
            </div>

            <FormField label="Full Name" htmlFor="name">
              <div className="input-with-icon">
                <User size={17} />
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
            </FormField>

            <FormField label="Email" htmlFor="register-email">
              <div className="input-with-icon">
                <Mail size={17} />
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
            </FormField>

            <FormField
              label="Password"
              htmlFor="register-password"
              hint="At least 8 characters"
            >
              <div className="input-with-icon">
                <Lock size={17} />
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
            </FormField>

            {form.role === 'therapist' && (
              <FormField
                label="Therapist invitation code"
                htmlFor="therapist-code"
                hint="Ask your Aurevia administrator for an invitation code."
              >
                <div className="input-with-icon">
                  <Lock size={17} />
                  <input
                    id="therapist-code"
                    name="therapistCode"
                    type="password"
                    value={form.therapistCode}
                    onChange={handleChange}
                    autoComplete="one-time-code"
                    required
                  />
                </div>
              </FormField>
            )}

            <Button type="submit" fullWidth loading={loading} icon={<ArrowRight size={16} />}>
              Create Account
            </Button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
