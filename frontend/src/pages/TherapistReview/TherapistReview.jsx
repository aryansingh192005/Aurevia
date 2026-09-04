import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Check, Database, X } from 'lucide-react';

import api from '../../services/api';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import EmptyState from '../../components/EmptyState/EmptyState';
import Spinner from '../../components/Spinner/Spinner';
import Alert from '../../components/Alert/Alert';

import './TherapistReview.css';

// Reduce each 8-feature frame to a single representative value (its mean)
// purely so the therapist gets a quick visual shape of the rep — the full
// 8-dimensional sequence is still what gets exported for training.
function toChartData(sequence) {
  return sequence.map((frame, index) => ({
    frame: index,
    angle: Math.round(frame.reduce((sum, value) => sum + value, 0) / frame.length),
  }));
}

function TherapistReview() {
  const [recordings, setRecordings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [exportCount, setExportCount] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      try {
        const response = await api.get('/recordings?status=pending');

        if (!isMounted) return;

        setRecordings(response.data.recordings || []);
      } catch (requestError) {
        if (!isMounted) return;

        setError(
          requestError.response?.data?.error || 'Unable to load recordings for review.',
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initialLoad();

    return () => {
      isMounted = false;
    };
  }, []);

  async function submitLabel(recordingId, therapistLabel) {
    setSavingId(recordingId);
    setError('');

    try {
      await api.patch(`/recordings/${recordingId}`, {
        therapist_label: therapistLabel,
      });

      setRecordings((current) => current.filter((recording) => recording.id !== recordingId));
    } catch (requestError) {
      setError(
        requestError.response?.data?.error || 'Unable to save this review.',
      );
    } finally {
      setSavingId(null);
    }
  }

  async function checkExportCount() {
    try {
      const response = await api.get('/recordings/export');
      setExportCount(response.data.count);
    } catch {
      setExportCount(null);
    }
  }

  if (isLoading) {
    return <Spinner label="Loading recordings for review..." fullPage />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="AI Training Data"
        title="Review AI Recordings"
        description="Confirm or correct the AI's automatic call on each logged repetition. Every reviewed rep becomes a human-verified training example for Aurevia's future LSTM exercise-quality model."
        actions={
          <Button variant="secondary" icon={<Database size={16} />} onClick={checkExportCount}>
            Check Export Size
          </Button>
        }
      />

      {exportCount !== null && (
        <Alert variant="info">
          <span>
            {exportCount} reviewed repetitions are ready to export as training data
            (<code>GET /api/recordings/export</code>).
          </span>
        </Alert>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      {recordings.length === 0 && !error ? (
        <EmptyState
          icon={<Database size={28} />}
          title="Nothing to review right now"
          description="Every logged repetition has been reviewed. New recordings appear here as patients complete AI-tracked exercise sessions."
        />
      ) : (
        <div className="review-grid">
          {recordings.map((recording) => (
            <Card key={recording.id} className="review-card">
              <div className="review-card__header">
                <div>
                  <h2>{recording.exercise_name}</h2>
                  <span className="review-card__meta">
                    Session #{recording.session_id} · Rep {recording.rep_index}
                  </span>
                </div>

                <StatusBadge status={recording.heuristic_label === 'correct' ? 'success' : 'warning'}>
                  AI said: {recording.heuristic_label}
                </StatusBadge>
              </div>

              <ResponsiveContainer width="100%" height={110}>
                <LineChart data={toChartData(recording.sequence)} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <XAxis dataKey="frame" tick={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6f6489' }} width={30} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="angle"
                    stroke="#7e14ff"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>

              <p className="review-card__hint">
                Confidence: {recording.heuristic_confidence ?? 'n/a'}
              </p>

              <div className="review-card__actions">
                <Button
                  variant="secondary"
                  fullWidth
                  loading={savingId === recording.id}
                  icon={<Check size={16} />}
                  onClick={() => submitLabel(recording.id, 'correct')}
                >
                  Confirm Correct
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  loading={savingId === recording.id}
                  icon={<X size={16} />}
                  onClick={() => submitLabel(recording.id, 'incorrect')}
                >
                  Mark Incorrect
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default TherapistReview;
