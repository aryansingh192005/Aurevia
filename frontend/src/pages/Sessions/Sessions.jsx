import { useEffect, useState } from 'react';

import api from '../../services/api';

function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadSessions() {
      try {
        const response = await api.get('/sessions');

        if (!isMounted) {
          return;
        }

        setSessions(response.data.sessions || []);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(
          requestError.response?.data?.error ||
          'Unable to load session history.',
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSessions();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <section>
        <h1>Session History</h1>
        <p>Loading session history...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1>Session History</h1>
        <p role="alert">{error}</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Session History</h1>

      <p>
        Review your previous rehabilitation
        sessions.
      </p>

      {sessions.length === 0 ? (
        <div>
          <h2>No sessions yet</h2>

          <p>
            Your rehabilitation sessions will
            appear here.
          </p>
        </div>
      ) : (
        <div>
          {sessions.map((session) => (
            <article key={session.id}>
              <h2>
                {session.exercise.name}
              </h2>

              <p>
                Target Area:{' '}
                {session.exercise.target_area}
              </p>

              <p>
                Status: {session.status}
              </p>

              <p>
                Started:{' '}
                {session.started_at
                  ? new Date(
                      session.started_at,
                    ).toLocaleString()
                  : 'Not started'}
              </p>

              <p>
                Completed:{' '}
                {session.completed_at
                  ? new Date(
                      session.completed_at,
                    ).toLocaleString()
                  : 'Not completed'}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Sessions;