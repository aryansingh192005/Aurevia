import { useEffect, useState } from 'react';

import api from '../../services/api';

function TherapistResults() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadResults() {
      try {
        const response = await api.get(
          '/session-results',
        );

        if (!isMounted) {
          return;
        }

        setResults(response.data.results || []);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(
          requestError.response?.data?.error ||
          'Unable to load session results.',
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadResults();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <section>
        <h1>Session Results</h1>
        <p>Loading session results...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1>Session Results</h1>
        <p role="alert">{error}</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Session Results</h1>

      <p>
        Review rehabilitation sessions completed
        by your patients.
      </p>

      {results.length === 0 ? (
        <div>
          <h2>No session results yet</h2>

          <p>
            Patient session results will appear
            here after rehabilitation sessions
            are completed.
          </p>
        </div>
      ) : (
        <div>
          {results.map((result) => (
            <article key={result.id}>
              <h2>
                {result.exercise.name}
              </h2>

              <p>
                Patient: {result.patient.name}
              </p>

              <p>
                Email: {result.patient.email}
              </p>

              <p>
                Session Status:{' '}
                {result.session.status}
              </p>

              <p>
                Result Type: {result.result_type}
              </p>

              <h3>Result Data</h3>

              <pre>
                {JSON.stringify(
                  result.result_data,
                  null,
                  2,
                )}
              </pre>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default TherapistResults;