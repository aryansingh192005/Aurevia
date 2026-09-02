import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

function PatientDashboard() {
  const { user } = useAuth();

  return (
    <section>
      <h1>
        Welcome, {user?.name}
      </h1>

      <p>
        Your rehabilitation journey at a glance.
      </p>

      <div>
        <article>
          <h2>Assigned Exercises</h2>
          <p>
            View exercises assigned by your therapist.
          </p>

          <Link to="/patient/exercises">
            View Exercises
          </Link>
        </article>

        <article>
          <h2>Start Exercise</h2>
          <p>
            Begin your rehabilitation session.
          </p>

          <Link to="/patient/exercises">
            Start Exercise
          </Link>
        </article>

        <article>
          <h2>Session History</h2>
          <p>
            Review your completed rehabilitation sessions.
          </p>

          <Link to="/patient/sessions">
            View Sessions
          </Link>
        </article>

        <article>
          <h2>Progress</h2>
          <p>
            Track your rehabilitation progress.
          </p>

          <Link to="/patient/progress">
            View Progress
          </Link>
        </article>
      </div>
    </section>
  );
}

export default PatientDashboard;