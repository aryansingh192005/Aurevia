import { useEffect, useState } from 'react';

import api from '../../services/api';

function Progress() {
  const [progress, setProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      try {
        const response = await api.get('/progress');

        if (!isMounted) {
          return;
        }

        setProgress(response.data.progress || []);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(
          requestError.response?.data?.error ||
          'Unable to load progress.',
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <section>
        <h1>My Progress</h1>
        <p>Loading your progress...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1>My Progress</h1>
        <p role="alert">{error}</p>
      </section>
    );
  }

  return (
    <section>
      <h1>My Progress</h1>

      <p>
        Track your rehabilitation performance
        over time.
      </p>

      {progress.length === 0 ? (
        <div>
          <h2>No progress data yet</h2>

          <p>
            Complete a rehabilitation session to
            start building your progress history.
          </p>
        </div>
      ) : (
        <div>
          {progress.map((record) => (
            <article key={record.id}>
              <h2>
                {record.metric_name}
              </h2>

              <p>
                <strong>Value:</strong>{' '}
                {record.metric_value}
              </p>

              <p>
                <strong>Session:</strong>{' '}
                {record.session_id
                  ? `#${record.session_id}`
                  : 'Not associated'}
              </p>

              <p>
                <strong>Recorded:</strong>{' '}
                {new Date(
                  record.recorded_at,
                ).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Progress;