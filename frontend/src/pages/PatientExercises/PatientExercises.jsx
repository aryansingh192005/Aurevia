import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Flame, PlayCircle, Target } from 'lucide-react';

import api from '../../services/api';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import EmptyState from '../../components/EmptyState/EmptyState';
import Spinner from '../../components/Spinner/Spinner';
import Alert from '../../components/Alert/Alert';
import Button from '../../components/Button/Button';

import './PatientExercises.css';

const STATUS_TONE = {
  active: 'success',
  paused: 'warning',
  completed: 'neutral',
};

function PatientExercises() {
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadAssignments() {
      try {
        const response = await api.get('/assignments');

        if (!isMounted) return;

        setAssignments(response.data.assignments || []);
      } catch (requestError) {
        if (!isMounted) return;

        setError(
          requestError.response?.data?.error ||
            'Unable to load assigned exercises.',
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAssignments();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <Spinner label="Loading your exercises..." fullPage />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="My Program"
        title="Assigned Exercises"
        description="Exercises assigned to you by your therapist."
      />

      {error && <Alert variant="error">{error}</Alert>}

      {assignments.length === 0 && !error ? (
        <EmptyState
          icon={<Dumbbell size={28} />}
          title="No exercises assigned yet"
          description="Your therapist has not assigned any rehabilitation exercises yet. Check back soon."
        />
      ) : (
        <div className="exercise-grid">
          {assignments.map((assignment) => (
            <Card key={assignment.id} hoverable className="exercise-card">
              <div className="exercise-card__header">
                <h2>{assignment.exercise.name}</h2>
                <StatusBadge status={STATUS_TONE[assignment.status] || 'neutral'}>
                  {assignment.status}
                </StatusBadge>
              </div>

              <p className="exercise-card__description">{assignment.exercise.description}</p>

              <div className="exercise-card__meta">
                <span>
                  <Target size={14} /> {assignment.exercise.target_area || 'General'}
                </span>
                <span>
                  <Flame size={14} /> {assignment.exercise.difficulty || 'Any level'}
                </span>
              </div>

              <div className="exercise-card__targets">
                <div>
                  <span className="exercise-card__target-value">
                    {assignment.target_sets ?? '—'}
                  </span>
                  <span className="exercise-card__target-label">Sets</span>
                </div>
                <div>
                  <span className="exercise-card__target-value">
                    {assignment.target_reps ?? '—'}
                  </span>
                  <span className="exercise-card__target-label">Reps</span>
                </div>
              </div>

              <Link to={`/patient/exercises/${assignment.id}/start`}>
                <Button fullWidth icon={<PlayCircle size={16} />}>
                  Start Exercise
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default PatientExercises;
