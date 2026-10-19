import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ClipboardList, Eye, Mail, Search, Users } from 'lucide-react';

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
  const [assignments, setAssignments] = useState([]);
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadPatients() {
      try {
        const [response, assignmentResponse, resultResponse] = await Promise.all([
          api.get('/patients'), api.get('/assignments'), api.get('/session-results'),
        ]);

        if (!isMounted) return;

        setPatients(response.data.patients || []);
        setAssignments(assignmentResponse.data.assignments || []);
        setResults(resultResponse.data.results || []);
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

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return patients.filter((patient) => !query || `${patient.name} ${patient.email}`.toLocaleLowerCase().includes(query));
  }, [patients, search]);

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
      ) : patients.length > 0 && (
        <>
          <div className="patient-directory-tools">
            <label className="patient-search"><Search size={17} /><span className="visually-hidden">Search patients</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by patient name or email" /></label>
            <span className="patient-directory-count">{filteredPatients.length} of {patients.length} patients</span>
          </div>
          {filteredPatients.length === 0 ? <EmptyState icon={<Search size={26} />} title="No matching patients" description="Try another name or email address." /> :
        <div className="patient-grid">
          {filteredPatients.map((patient) => {
            const activeExerciseCount = assignments.filter((assignment) => assignment.patient.id === patient.id && assignment.status === 'active').length;
            const patientResults = results.filter((result) => result.patient.id === patient.id);
            const savedSessions = new Set(patientResults.map((result) => result.session.id));
            const latestCompletedAt = patientResults.map((result) => result.session.completed_at).filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0];
            return (
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
              <div className="patient-card__summary"><span><ClipboardList size={14} /> {activeExerciseCount} active exercise{activeExerciseCount === 1 ? '' : 's'}</span><span><Activity size={14} /> {savedSessions.size} saved session result{savedSessions.size === 1 ? '' : 's'}</span>{latestCompletedAt && <small>Latest result {new Date(latestCompletedAt).toLocaleDateString()}</small>}</div>
              <div className="patient-card__actions"><Link to={`/therapist/patients/${patient.id}`}><Button variant="secondary" fullWidth icon={<Eye size={15} />}>Overview</Button></Link><Link to={`/therapist/assign-exercise?patient_id=${patient.id}`}><Button variant="secondary" fullWidth icon={<ClipboardList size={15} />}>Assign exercise</Button></Link></div>
            </Card>
          );})}
        </div>}
        </>
      )}
    </div>
  );
}

export default TherapistPatients;
