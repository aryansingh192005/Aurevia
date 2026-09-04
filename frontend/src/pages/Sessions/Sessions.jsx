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

        setSessions(response.data.sessions || []);
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Sessions;
