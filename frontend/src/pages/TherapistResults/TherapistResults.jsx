import { useEffect, useState } from 'react';
import { Award, FileBarChart, Percent, User } from 'lucide-react';

import api from '../../services/api';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import EmptyState from '../../components/EmptyState/EmptyState';
import Spinner from '../../components/Spinner/Spinner';
import Alert from '../../components/Alert/Alert';

import './TherapistResults.css';

function accuracyTone(accuracy) {
  if (accuracy == null) return 'neutral';
  if (accuracy >= 85) return 'success';
  if (accuracy >= 60) return 'warning';
  return 'danger';
}

function TherapistResults() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadResults() {
      try {
        const response = await api.get('/session-results');

        if (!isMounted) return;

        setResults(response.data.results || []);
      } catch (requestError) {
        if (!isMounted) return;

        setError(
          requestError.response?.data?.error || 'Unable to load session results.',
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadResults();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <Spinner label="Loading session results..." fullPage />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Outcomes"
        title="Session Results"
        description="Review rehabilitation sessions completed by your patients."
      />

      {error && <Alert variant="error">{error}</Alert>}

      {results.length === 0 && !error ? (
        <EmptyState
          icon={<FileBarChart size={28} />}
          title="No session results yet"
          description="Patient session results will appear here after rehabilitation sessions are completed."
        />
      ) : (
        <div className="results-list">
          {results.map((result) => {
            const accuracy = result.result_data?.accuracy;

            return (
              <Card key={result.id} className="result-card">
                <div className="result-card__header">
                  <div>
                    <h2>{result.exercise.name}</h2>
                    <span className="result-card__patient">
                      <User size={13} /> {result.patient.name} · {result.patient.email}
                    </span>
                  </div>

                  {accuracy != null && (
                    <StatusBadge status={accuracyTone(accuracy)}>
                      <Percent size={11} style={{ display: 'inline', marginRight: 2 }} />
                      {accuracy}% accuracy
                    </StatusBadge>
                  )}
                </div>

                <div className="result-card__metrics">
                  {Object.entries(result.result_data || {})
                    .filter(([key]) => key !== 'feedback')
                    .map(([key, value]) => (
                      <div key={key} className="result-metric">
                        <span className="result-metric__value">{String(value)}</span>
                        <span className="result-metric__label">{key.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                </div>

                {result.result_data?.feedback && (
                  <div className="result-card__feedback">
                    <Award size={14} />
                    <span>{result.result_data.feedback}</span>
                  </div>
                )}

                <div className="result-card__footer">
                  <span>Session #{result.session.id} · {result.session.status}</span>
                  <span>{new Date(result.created_at).toLocaleString()}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TherapistResults;
