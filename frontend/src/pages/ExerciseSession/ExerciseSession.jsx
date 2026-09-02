import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import api from '../../services/api';

function ExerciseSession() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [session, setSession] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);

  const [resultSubmitted, setResultSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadAssignment() {
      try {
        const response = await api.get(
          `/assignments/${assignmentId}`,
        );

        if (!isMounted) {
          return;
        }

        setAssignment(response.data.assignment);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(
          requestError.response?.data?.error ||
            'Unable to load this exercise assignment.',
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAssignment();

    return () => {
      isMounted = false;
    };
  }, [assignmentId]);

  async function createSession() {
    if (!assignment) {
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const response = await api.post('/sessions', {
        exercise_id: assignment.exercise.id,
      });

      setSession(response.data.session);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          'Unable to create rehabilitation session.',
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function beginRehabilitation() {
    if (!session) {
      return;
    }

    setIsStarting(true);
    setError('');

    try {
      const response = await api.patch(
        `/sessions/${session.id}`,
        {
          status: 'started',
        },
      );

      setSession(response.data.session);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          'Unable to start rehabilitation session.',
      );
    } finally {
      setIsStarting(false);
    }
  }

  async function completeSession() {
    if (!session) {
      return;
    }

    setIsCompleting(true);
    setError('');

    try {
      const response = await api.patch(
        `/sessions/${session.id}`,
        {
          status: 'completed',
        },
      );

      setSession(response.data.session);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          'Unable to complete rehabilitation session.',
      );
    } finally {
      setIsCompleting(false);
    }
  }

  async function submitResult() {
    if (!session || session.status !== 'completed') {
      return;
    }

    setIsSubmittingResult(true);
    setError('');

    try {
      await api.post(
        `/sessions/${session.id}/results`,
        {
          result_type: 'exercise_analysis',
          result_data: {
            repetitions: assignment.target_reps ?? 10,
            correct_repetitions: assignment.target_reps ?? 10,
            incorrect_repetitions: 0,
            accuracy: 100,
            feedback:
              'Mock result for frontend and backend integration testing.',
          },
        },
      );

      setResultSubmitted(true);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          'Unable to submit exercise result.',
      );
    } finally {
      setIsSubmittingResult(false);
    }
  }

  if (isLoading) {
    return (
      <section>
        <h1>Exercise Session</h1>
        <p>Loading your exercise...</p>
      </section>
    );
  }

  if (error && !assignment) {
    return (
      <section>
        <h1>Exercise Session</h1>

        <p role="alert">{error}</p>

        <Link to="/patient/exercises">
          Back to Exercises
        </Link>
      </section>
    );
  }

  if (!assignment) {
    return null;
  }

  const exercise = assignment.exercise;

  return (
    <section>
      <h1>{exercise.name}</h1>

      <p>
        Your rehabilitation exercise session.
      </p>

      <article>
        <h2>Exercise Details</h2>

        <p>{exercise.description}</p>

        <p>
          <strong>Target area:</strong>{' '}
          {exercise.target_area}
        </p>

        <p>
          <strong>Difficulty:</strong>{' '}
          {exercise.difficulty}
        </p>

        <p>
          <strong>Target sets:</strong>{' '}
          {assignment.target_sets ?? 'Not specified'}
        </p>

        <p>
          <strong>Target repetitions:</strong>{' '}
          {assignment.target_reps ?? 'Not specified'}
        </p>

        <p>
          <strong>Assignment status:</strong>{' '}
          {assignment.status}
        </p>
      </article>

      {error && (
        <p role="alert">
          {error}
        </p>
      )}

      {!session && (
        <div>
          <h2>Ready to Begin?</h2>

          <p>
            Create a rehabilitation session for this
            assigned exercise.
          </p>

          <button
            type="button"
            onClick={createSession}
            disabled={isCreating}
          >
            {isCreating
              ? 'Creating Session...'
              : 'Create Session'}
          </button>
        </div>
      )}

      {session && session.status === 'created' && (
        <div>
          <h2>Session Created</h2>

          <p>
            <strong>Session ID:</strong>{' '}
            {session.id}
          </p>

          <p>
            <strong>Status:</strong>{' '}
            {session.status}
          </p>

          <button
            type="button"
            onClick={beginRehabilitation}
            disabled={isStarting}
          >
            {isStarting
              ? 'Starting...'
              : 'Begin Rehabilitation'}
          </button>
        </div>
      )}

      {session && session.status === 'started' && (
        <div>
          <h2>Rehabilitation In Progress</h2>

          <p>
            Session #{session.id} is currently active.
          </p>

          <p>
            Camera and AI movement analysis will be
            connected here.
          </p>

          <p>
            The AI module will eventually analyze
            movement and generate the session result.
          </p>

          <button
            type="button"
            onClick={completeSession}
            disabled={isCompleting}
          >
            {isCompleting
              ? 'Completing Session...'
              : 'Finish Session'}
          </button>
        </div>
      )}

      {session && session.status === 'completed' && (
        <div>
          <h2>Session Completed</h2>

          <p>
            Your rehabilitation session has been
            completed successfully.
          </p>

          <p>
            <strong>Completed at:</strong>{' '}
            {session.completed_at
              ? new Date(
                  session.completed_at,
                ).toLocaleString()
              : 'Not available'}
          </p>

          {!resultSubmitted ? (
            <div>
              <p>
                The AI analysis result is not connected
                yet, so you can submit a temporary test
                result.
              </p>

              <button
                type="button"
                onClick={submitResult}
                disabled={isSubmittingResult}
              >
                {isSubmittingResult
                  ? 'Submitting Result...'
                  : 'Submit Test Result'}
              </button>
            </div>
          ) : (
            <div>
              <h3>Result Submitted</h3>

              <p>
                The rehabilitation result was saved
                successfully.
              </p>

              <Link to="/patient/sessions">
                View Session History
              </Link>
            </div>
          )}
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() =>
            navigate('/patient/exercises')
          }
        >
          Back to Exercises
        </button>
      </div>
    </section>
  );
}

export default ExerciseSession;