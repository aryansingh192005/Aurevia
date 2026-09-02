import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

function TherapistDashboard() {
  const { user } = useAuth();

  return (
    <section>
      <h1>
        Welcome, {user?.name}
      </h1>

      <p>
        Manage your patients and rehabilitation
        programs.
      </p>

      <div>
        <article>
          <h2>Patients</h2>
          <p>
            View and manage your assigned patients.
          </p>

          <Link to="/therapist/patients">
            View Patients
          </Link>
        </article>

        <article>
          <h2>Assign Exercise</h2>
          <p>
            Prescribe rehabilitation exercises.
          </p>

          <Link to="/therapist/assign-exercise">
            Assign Exercise
          </Link>
        </article>

        <article>
          <h2>Session Results</h2>
          <p>
            Review patient rehabilitation sessions.
          </p>

          <Link to="/therapist/sessions">
            View Results
          </Link>
        </article>

        <article>
          <h2>Progress Reports</h2>
          <p>
            Monitor patient rehabilitation progress.
          </p>

          <Link to="/therapist/progress">
            View Reports
          </Link>
        </article>
      </div>
    </section>
  );
}

export default TherapistDashboard;