import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';

import api from '../../services/api';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import EmptyState from '../../components/EmptyState/EmptyState';
import Spinner from '../../components/Spinner/Spinner';
import Alert from '../../components/Alert/Alert';

import './Progress.css';

const METRIC_LABELS = {
  repetitions: 'Repetitions',
  correct_repetitions: 'Correct Reps',
  incorrect_repetitions: 'Incorrect Reps',
  accuracy: 'Accuracy (%)',
};

function formatMetricLabel(name) {
  return METRIC_LABELS[name] || name.replace(/_/g, ' ');
}

function Progress() {
  const [progress, setProgress] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      try {
        const [response, sessionResponse] = await Promise.all([api.get('/progress'), api.get('/sessions')]);

        if (!isMounted) return;

        setProgress(response.data.progress || []);
        setSessions(sessionResponse.data.sessions || []);
      } catch (requestError) {
        if (!isMounted) return;

        setError(requestError.response?.data?.error || 'Unable to load progress.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, []);

  const completedSessions = sessions.filter((session) => session.status === 'completed');
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const thisWeek = completedSessions.filter((session) => session.completed_at && new Date(session.completed_at) >= weekStart).length;
  const daySet = new Set(completedSessions.filter((session) => session.completed_at).map((session) => new Date(session.completed_at).toLocaleDateString()));
  let currentStreak = 0;
  const streakDay = new Date();
  if (!daySet.has(streakDay.toLocaleDateString())) streakDay.setDate(streakDay.getDate() - 1);
  while (daySet.has(streakDay.toLocaleDateString())) { currentStreak += 1; streakDay.setDate(streakDay.getDate() - 1); }
  const accuracyRecords = [...progress].filter((record) => record.metric_name === 'accuracy').sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
  const accuracyChange = accuracyRecords.length >= 2 ? Math.round(accuracyRecords[accuracyRecords.length - 1].metric_value - accuracyRecords[0].metric_value) : null;

  const grouped = useMemo(() => {
    const byMetric = {};

    [...progress]
      .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))
      .forEach((record) => {
        if (!byMetric[record.metric_name]) {
          byMetric[record.metric_name] = [];
        }

        byMetric[record.metric_name].push({
          date: new Date(record.recorded_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          }),
          value: record.metric_value,
        });
      });

    return byMetric;
  }, [progress]);

  if (isLoading) {
    return <Spinner label="Loading your progress..." fullPage />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Analytics"
        title="My Progress"
        description="Track your rehabilitation performance over time."
      />

      {error && <Alert variant="error">{error}</Alert>}

      <div className="progress-insights" aria-label="Progress highlights">
        <div className="progress-insight"><span className="progress-insight__value">{completedSessions.length}</span><span className="progress-insight__label">sessions completed</span><span className="progress-insight__hint">Every session counts</span></div>
        <div className="progress-insight"><span className="progress-insight__value">{thisWeek}</span><span className="progress-insight__label">this week</span><span className="progress-insight__hint">Your weekly rhythm</span></div>
        <div className="progress-insight"><span className="progress-insight__value">{currentStreak} day{currentStreak === 1 ? '' : 's'}</span><span className="progress-insight__label">current streak</span><span className="progress-insight__hint">Rest days are part of recovery</span></div>
        <div className="progress-insight"><span className="progress-insight__value">{accuracyChange === null ? '—' : `${accuracyChange > 0 ? '+' : ''}${accuracyChange}%`}</span><span className="progress-insight__label">accuracy change</span><span className="progress-insight__hint">Across your recorded journey</span></div>
      </div>

      <div className="progress-milestones" aria-label="Consistency milestones">
        <span>Milestones</span>
        {[1, 5, 10, 25].map((milestone) => <span key={milestone} className={completedSessions.length >= milestone ? 'progress-milestone is-earned' : 'progress-milestone'}>{completedSessions.length >= milestone ? '✓ ' : ''}{milestone} sessions</span>)}
      </div>

      {progress.length === 0 && !error ? (
        <EmptyState
          icon={<BarChart3 size={28} />}
          title="No progress data yet"
          description="Complete a session to start building your progress history. Your highlights above celebrate consistency, not perfection."
        />
      ) : (
        <div className="progress-grid">
          {Object.entries(grouped).map(([metricName, points]) => (
            <Card key={metricName} className="progress-chart-card">
              <div className="progress-chart-card__header">
                <h2>{formatMetricLabel(metricName)}</h2>
                <span className="progress-chart-card__latest">
                  <TrendingUp size={14} />
                  Latest: {points[points.length - 1]?.value}
                </span>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4defa" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6f6489' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6f6489' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid #e4defa',
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#7e14ff"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#7e14ff' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Progress;
