import { useEffect, useState } from 'react';
import { Activity, Flame, Target } from 'lucide-react';

import api from '../../services/api';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import EmptyState from '../../components/EmptyState/EmptyState';
import Spinner from '../../components/Spinner/Spinner';
import Alert from '../../components/Alert/Alert';

import './Exercises.css';

function Exercises() {
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadExercises() {
      try {
        const response = await api.get('/exercises');

        if (!isMounted) return;

        setExercises(response.data.exercises || []);
      } catch (requestError) {
        if (!isMounted) return;

        setError(
          requestError.response?.data?.error || 'Unable to load the exercise library.',
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadExercises();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <Spinner label="Loading exercise library..." fullPage />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Exercise Library"
        description="Browse the full catalogue of rehabilitation exercises available on Aurevia."
      />

      {error && <Alert variant="error">{error}</Alert>}

      {exercises.length === 0 && !error ? (
        <EmptyState
          icon={<Activity size={28} />}
          title="No exercises available"
          description="The exercise catalogue is empty right now. Check back soon."
        />
      ) : (
        <div className="library-grid">
          {exercises.map((exercise) => (
            <Card key={exercise.id} hoverable className="library-card">
              <h2>{exercise.name}</h2>
              <p>{exercise.description || 'No description provided yet.'}</p>

              <div className="library-card__meta">
                <span>
                  <Target size={14} /> {exercise.target_area || 'General'}
                </span>
                <span>
                  <Flame size={14} /> {exercise.difficulty || 'Any level'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Exercises;
