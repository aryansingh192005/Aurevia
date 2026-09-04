import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Dumbbell, Hash, User } from 'lucide-react';

import api from '../../services/api';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import FormField from '../../components/FormField/FormField';
import Button from '../../components/Button/Button';
import Alert from '../../components/Alert/Alert';
import Spinner from '../../components/Spinner/Spinner';

import './AssignExercise.css';

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
        const [patientsResponse, exercisesResponse] = await Promise.all([
          api.get('/patients'),
          api.get('/exercises'),
        ]);

        if (!isMounted) return;

        setPatients(patientsResponse.data.patients || []);
        setExercises(exercisesResponse.data.exercises || []);
      } catch (requestError) {
        if (!isMounted) return;

        setError(
          requestError.response?.data?.error || 'Unable to load assignment data.',
        );
      } finally {
        if (isMounted) setIsLoading(false);
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
      const response = await api.post('/assignments', {
        patient_id: Number(formData.patient_id),
        exercise_id: Number(formData.exercise_id),
        target_sets: Number(formData.target_sets),
        target_reps: Number(formData.target_reps),
      });

      const assignment = response.data.assignment;

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
      setError(requestError.response?.data?.error || 'Unable to assign exercise.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <Spinner label="Loading assignment options..." fullPage />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Care Plan"
        title="Assign Exercise"
        description="Prescribe a rehabilitation exercise to a patient."
      />

      {patients.length === 0 && error ? (
        <Alert variant="error">{error}</Alert>
      ) : (
        <Card className="assign-form-card">
          <form onSubmit={handleSubmit}>
            <FormField label="Patient" htmlFor="patient_id">
              <div className="select-with-icon">
                <User size={17} />
                <select
                  id="patient_id"
                  name="patient_id"
                  value={formData.patient_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} ({patient.email})
                    </option>
                  ))}
                </select>
              </div>
            </FormField>

            <FormField label="Exercise" htmlFor="exercise_id">
              <div className="select-with-icon">
                <Dumbbell size={17} />
                <select
                  id="exercise_id"
                  name="exercise_id"
                  value={formData.exercise_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select an exercise</option>
                  {exercises.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>

            <div className="assign-form-row">
              <FormField label="Target Sets" htmlFor="target_sets">
                <div className="select-with-icon">
                  <Hash size={17} />
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
              </FormField>

              <FormField label="Target Repetitions" htmlFor="target_reps">
                <div className="select-with-icon">
                  <Hash size={17} />
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
              </FormField>
            </div>

            {error && <Alert variant="error">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <div className="assign-form-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/therapist/dashboard')}
              >
                Back to Dashboard
              </Button>

              <Button type="submit" loading={isSubmitting} icon={<ClipboardCheck size={16} />}>
                Assign Exercise
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

export default AssignExercise;
