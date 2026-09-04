import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Mail, Users } from 'lucide-react';

import api from '../../services/api';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import EmptyState from '../../components/EmptyState/EmptyState';
import Spinner from '../../components/Spinner/Spinner';
import Alert from '../../components/Alert/Alert';
import Button from '../../components/Button/Button';

import './TherapistPatients.css';

function TherapistPatients() {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadPatients() {
      try {
        const response = await api.get('/patients');

        if (!isMounted) return;

        setPatients(response.data.patients || []);
      } catch (requestError) {
        if (!isMounted) return;

        setError(requestError.response?.data?.error || 'Unable to load patients.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPatients();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <Spinner label="Loading patients..." fullPage />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Care Team"
        title="Patients"
        description="Patients available for rehabilitation management."
        actions={
          <Link to="/therapist/assign-exercise">
            <Button icon={<ClipboardList size={16} />}>Assign Exercise</Button>
          </Link>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      {patients.length === 0 && !error ? (
        <EmptyState
          icon={<Users size={28} />}
          title="No patients found"
          description="There are currently no registered patients."
        />
      ) : (
        <div className="patient-grid">
          {patients.map((patient) => (
            <Card key={patient.id} hoverable className="patient-card">
              <span className="patient-card__avatar">
                {patient.name.charAt(0).toUpperCase()}
              </span>
              <div className="patient-card__info">
                <h2>{patient.name}</h2>
                <span>
                  <Mail size={13} /> {patient.email}
                </span>
              </div>
              <span className="patient-card__id">#{patient.id}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default TherapistPatients;
