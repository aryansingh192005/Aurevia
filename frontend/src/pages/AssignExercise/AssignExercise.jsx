import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../../services/api';

function AssignExercise() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [exercises, setExercises] = useState([]);

  const [formData, setFormData] = useState({
    patient_id: '',
    exercise_id: '',
    target_sets: 3,
    target_reps: 10,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [patientsResponse, exercisesResponse] =
          await Promise.all([
            api.get('/patients'),
            api.get('/exercises'),
          ]);

        if (!isMounted) {
          return;
        }

        setPatients(
          patientsResponse.data.patients || [],
        );

        setExercises(
          exercisesResponse.data.exercises || [],
        );
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        const message =
          requestError.response?.data?.error ||
          'Unable to load assignment data.';

        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await api.post(
        '/assignments',
        {
          patient_id: Number(formData.patient_id),
          exercise_id: Number(formData.exercise_id),
          target_sets: Number(formData.target_sets),
          target_reps: Number(formData.target_reps),
        },
      );

      const assignment =
        response.data.assignment;

      setSuccess(
        `${assignment.exercise.name} assigned successfully to ${assignment.patient.name}.`,
      );

      setFormData({
        patient_id: '',
        exercise_id: '',
        target_sets: 3,
        target_reps: 10,
      });
    } catch (requestError) {
      const message =
        requestError.response?.data?.error ||
        'Unable to assign exercise.';

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section>
        <h1>Assign Exercise</h1>
        <p>Loading assignment options...</p>
      </section>
    );
  }

  if (error && patients.length === 0) {
    return (
      <section>
        <h1>Assign Exercise</h1>
        <p role="alert">{error}</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Assign Exercise</h1>

      <p>
        Prescribe a rehabilitation exercise to a
        patient.
      </p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="patient_id">
            Patient
          </label>

          <select
            id="patient_id"
            name="patient_id"
            value={formData.patient_id}
            onChange={handleChange}
            required
          >
            <option value="">
              Select a patient
            </option>

            {patients.map((patient) => (
              <option
                key={patient.id}
                value={patient.id}
              >
                {patient.name} ({patient.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="exercise_id">
            Exercise
          </label>

          <select
            id="exercise_id"
            name="exercise_id"
            value={formData.exercise_id}
            onChange={handleChange}
            required
          >
            <option value="">
              Select an exercise
            </option>

            {exercises.map((exercise) => (
              <option
                key={exercise.id}
                value={exercise.id}
              >
                {exercise.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="target_sets">
            Target Sets
          </label>

          <input
            id="target_sets"
            name="target_sets"
            type="number"
            min="1"
            value={formData.target_sets}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="target_reps">
            Target Repetitions
          </label>

          <input
            id="target_reps"
            name="target_reps"
            type="number"
            min="1"
            value={formData.target_reps}
            onChange={handleChange}
            required
          />
        </div>

        {error && (
          <p role="alert">
            {error}
          </p>
        )}

        {success && (
          <p role="status">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'Assigning...'
            : 'Assign Exercise'}
        </button>
      </form>

      <button
        type="button"
        onClick={() =>
          navigate('/therapist/dashboard')
        }
      >
        Back to Dashboard
      </button>
    </section>
  );
}

export default AssignExercise;