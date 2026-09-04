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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      try {
        const response = await api.get('/progress');

        if (!isMounted) return;

        setProgress(response.data.progress || []);
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

      {progress.length === 0 && !error ? (
        <EmptyState
          icon={<BarChart3 size={28} />}
          title="No progress data yet"
          description="Complete a rehabilitation session to start building your progress history."
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
