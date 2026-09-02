import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '../../services/api';

function PatientExercises() {
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadAssignments() {
      try {
        const response = await api.get('/assignments');

        if (!isMounted) {
          return;
        }

        setAssignments(response.data.assignments || []);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        const message =
          requestError.response?.data?.error ||
          'Unable to load assigned exercises.';

        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAssignments();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <section>
        <h1>Assigned Exercises</h1>
        <p>Loading your exercises...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1>Assigned Exercises</h1>
        <p role="alert">{error}</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Assigned Exercises</h1>

      <p>
        Exercises assigned to you by your therapist.
      </p>

      {assignments.length === 0 ? (
        <div>
          <h2>No exercises assigned</h2>

          <p>
            Your therapist has not assigned any
            rehabilitation exercises yet.
          </p>
        </div>
      ) : (
        <div>
          {assignments.map((assignment) => (
            <article key={assignment.id}>
              <h2>
                {assignment.exercise.name}
              </h2>

              <p>
                {assignment.exercise.description}
              </p>

              <p>
                <strong>Target area:</strong>{' '}
                {assignment.exercise.target_area}
              </p>

              <p>
                <strong>Difficulty:</strong>{' '}
                {assignment.exercise.difficulty}
              </p>

              <p>
                <strong>Sets:</strong>{' '}
                {assignment.target_sets ?? 'Not specified'}
              </p>

              <p>
                <strong>Repetitions:</strong>{' '}
                {assignment.target_reps ?? 'Not specified'}
              </p>

              <p>
                <strong>Status:</strong>{' '}
                {assignment.status}
              </p>

              <Link
                to={`/patient/exercises/${assignment.id}/start`}
              >
                Start Exercise
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default PatientExercises;