import { useEffect, useState } from 'react';
import { CalendarCheck, CalendarClock, History } from 'lucide-react';

import api from '../../services/api';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import EmptyState from '../../components/EmptyState/EmptyState';
import Spinner from '../../components/Spinner/Spinner';
import Alert from '../../components/Alert/Alert';

import './Sessions.css';

const STATUS_TONE = {
  created: 'neutral',
  started: 'warning',
  in_progress: 'warning',
  completed: 'success',
};

function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadSessions() {
      try {
        const response = await api.get('/sessions');

        if (!isMounted) return;

        const loaded = response.data.sessions || [];
        setSessions(loaded);
      } catch (requestError) {
        if (!isMounted) return;

        setError(
          requestError.response?.data?.error || 'Unable to load session history.',
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSessions();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <Spinner label="Loading session history..." fullPage />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="History"
        title="Session History"
        description="Review your previous rehabilitation sessions."
      />

      {error && <Alert variant="error">{error}</Alert>}

      {sessions.length === 0 && !error ? (
        <EmptyState
          icon={<History size={28} />}
          title="No sessions yet"
          description="Your rehabilitation sessions will appear here once you start one."
        />
      ) : (
        <div className="session-list">
          {sessions.map((session) => (
            <Card key={session.id} className="session-row">
              <div className="session-row__main">
                <h2>{session.exercise.name}</h2>
                <p>{session.exercise.target_area || 'General'} area</p>
              </div>

              <div className="session-row__meta">
                <div className="session-row__timestamp">
                  <CalendarClock size={14} />
                  <span>
                    {session.started_at
                      ? new Date(session.started_at).toLocaleString()
                      : 'Not started'}
                  </span>
                </div>
                <div className="session-row__timestamp">
                  <CalendarCheck size={14} />
                  <span>
                    {session.completed_at
                      ? new Date(session.completed_at).toLocaleString()
                      : 'Not completed'}
                  </span>
                </div>
              </div>

              <StatusBadge status={STATUS_TONE[session.status] || 'neutral'}>
                {session.status.replace('_', ' ')}
              </StatusBadge>
              {session.status === 'completed' && (
                <div className="session-result" aria-label="Session result summary">
                  {session.result ? (
                    <>
                      <strong>Session summary</strong>
                      <div className="session-result__metrics">
                        {typeof session.result.result_data?.repetitions === 'number' && (
                          <span><b>{session.result.result_data.repetitions}</b> reps</span>
                        )}
                        {typeof session.result.result_data?.correct_repetitions === 'number' && (
                          <span><b>{session.result.result_data.correct_repetitions}</b> correct reps</span>
                        )}
                        {typeof session.result.result_data?.accuracy === 'number' && (
                          <span><b>{session.result.result_data.accuracy}%</b> accuracy</span>
                        )}
                      </div>
                      {session.result.result_data?.patient_check_in && (
                        <div className="session-result__checkin">
                          <strong>Your check-in · self-reported</strong>
                          <span>Discomfort {session.result.result_data.patient_check_in.discomfort_rating}/10 · Effort {session.result.result_data.patient_check_in.effort_rating}/10</span>
                          {session.result.result_data.patient_check_in.note && (
                            <p>{session.result.result_data.patient_check_in.note}</p>
                          )}
                        </div>
                      )}
                    </>
                  ) : <span className="session-result__empty">No summary was saved for this session.</span>}
                </div>
              )}
              {(session.therapist_feedback || []).length > 0 && (
                <section className="session-therapist-notes" aria-label="Therapist feedback">
                  <strong className="session-therapist-notes__title">Therapist feedback</strong>
                  {(session.therapist_feedback || []).map((note) => (
                    <article key={note.id} className="session-therapist-notes__item">
                      <div><strong>{note.therapist.name}</strong><time dateTime={note.created_at}>{new Date(note.created_at).toLocaleDateString()}</time></div>
                      <p>{note.message}</p>
                    </article>
                  ))}
                </section>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Sessions;
