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

function analysisSourceLabel(source) {
  if (source === 'lstm') return 'LSTM model';
  if (source === 'heuristic') return 'pose-based estimate';
  return 'source not recorded';
}

function TherapistResults() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState({});
  const [savingSession, setSavingSession] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadResults() {
      try {
        const response = await api.get('/session-results');

        if (!isMounted) return;

        const loadedResults = response.data.results || [];
        setResults(loadedResults);
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

  async function sendFeedback(sessionId) {
    const message = (drafts[sessionId] || '').trim();
    if (!message) return;
    setSavingSession(sessionId);
    setError('');
    try {
      const response = await api.post(`/sessions/${sessionId}/feedback`, { message });
      setResults((current) => current.map((result) => (
        result.session.id === sessionId
          ? { ...result, therapist_feedback: [response.data.feedback, ...(result.therapist_feedback || [])] }
          : result
      )));
      setDrafts((current) => ({ ...current, [sessionId]: '' }));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to save therapist feedback.');
    } finally { setSavingSession(null); }
  }

  if (isLoading) {
    return <Spinner label="Loading session results..." fullPage />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Outcomes"
        title="Session Results"
        description="Review movement-analysis summaries and patient check-ins."
      />

      <p className="result-analysis-disclaimer">Movement-analysis percentages show the share of repetitions labeled correct by Aurevia. They are estimates, not clinically validated accuracy scores or a diagnosis.</p>

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
            const patientCheckIn = result.result_data?.patient_check_in;
            const analysisSource = result.result_data?.analysis_source;

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
                    <StatusBadge status="neutral">
                      <Percent size={11} style={{ display: 'inline', marginRight: 2 }} />
                      {accuracy}% AI-labeled correct reps
                    </StatusBadge>
                  )}
                </div>

                <div className="result-card__metrics">
                  {Object.entries(result.result_data || {})
                    .filter(([key]) => !['feedback', 'patient_check_in', 'analysis_source', 'previous_submissions'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="result-metric">
                        <span className="result-metric__value">{String(value)}</span>
                        <span className="result-metric__label">{key.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                </div>

                {accuracy == null && !patientCheckIn && (
                  <p className="result-card__empty">No movement-analysis data was captured for this session.</p>
                )}

                {patientCheckIn && <div className="result-patient-checkin"><strong>Patient check-in · self-reported</strong><div><span>Discomfort <b>{patientCheckIn.discomfort_rating}/10</b></span><span>Effort <b>{patientCheckIn.effort_rating}/10</b></span></div>{patientCheckIn.note && <p>{patientCheckIn.note}</p>}</div>}

                {result.result_data?.feedback && (
                  <div className="result-card__feedback">
                    <Award size={14} />
                    <span>{result.result_data.feedback}</span>
                  </div>
                )}

                <div className="result-card__footer">
                  <span>Session #{result.session.id} · {result.session.status}</span>
                  <span>Analysis source: {analysisSourceLabel(analysisSource)}</span>
                  <span>{new Date(result.created_at).toLocaleString()}</span>
                </div>

                <div className="result-therapist-feedback">
                  <strong>Care team notes</strong>
                  {(result.therapist_feedback || []).map((note) => (
                    <p className="result-therapist-feedback__note" key={note.id}>
                      {note.message}<small>{note.therapist.name} · {new Date(note.created_at).toLocaleString()}</small>
                    </p>
                  ))}
                  <label className="visually-hidden" htmlFor={`feedback-${result.session.id}`}>Add patient feedback</label>
                  <textarea
                    id={`feedback-${result.session.id}`}
                    rows="2"
                    maxLength="2000"
                    placeholder="Share encouragement or a next-step cue with the patient"
                    value={drafts[result.session.id] || ''}
                    onChange={(event) => setDrafts((current) => ({ ...current, [result.session.id]: event.target.value }))}
                  />
                  <button
                    type="button"
                    className="result-feedback-submit"
                    disabled={savingSession === result.session.id || !(drafts[result.session.id] || '').trim()}
                    onClick={() => sendFeedback(result.session.id)}
                  >{savingSession === result.session.id ? 'Saving…' : 'Send note to patient'}</button>
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
