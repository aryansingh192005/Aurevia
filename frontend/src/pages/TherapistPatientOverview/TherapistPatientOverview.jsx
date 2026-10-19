import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Activity, ArrowLeft, CalendarClock, ClipboardList, FileBarChart } from 'lucide-react';

import api from '../../services/api';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import Spinner from '../../components/Spinner/Spinner';
import Alert from '../../components/Alert/Alert';
import EmptyState from '../../components/EmptyState/EmptyState';

import './TherapistPatientOverview.css';

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'Not available';
}

function TherapistPatientOverview() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadOverview() {
      try {
        const [patientResponse, assignmentResponse, planResponse, resultResponse] = await Promise.all([
          api.get('/patients'), api.get('/assignments'), api.get('/plans'), api.get('/session-results'),
        ]);
        if (!isMounted) return;
        const selectedPatient = (patientResponse.data.patients || []).find((item) => item.id === Number(patientId));
        if (!selectedPatient) {
          setError('This patient could not be found.');
          return;
        }
        setPatient(selectedPatient);
        setAssignments((assignmentResponse.data.assignments || []).filter((item) => item.patient.id === selectedPatient.id));
        setPlans((planResponse.data.plans || []).filter((item) => item.patient.id === selectedPatient.id));
        setResults((resultResponse.data.results || []).filter((item) => item.patient.id === selectedPatient.id));
      } catch (requestError) {
        if (isMounted) setError(requestError.response?.data?.error || 'Unable to load this patient overview.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadOverview();
    return () => { isMounted = false; };
  }, [patientId]);

  const recentResults = useMemo(() => [...results].sort((a, b) => new Date(b.session.completed_at || b.created_at) - new Date(a.session.completed_at || a.created_at)), [results]);
  const activeAssignments = assignments.filter((item) => item.status === 'active');
  const activePlans = plans.filter((item) => item.status === 'active');

  if (loading) return <Spinner label="Loading patient overview..." fullPage />;

  return <div className="patient-overview-page">
    <PageHeader
      eyebrow="Care Team · Patient overview"
      title={patient?.name || 'Patient overview'}
      description={patient?.email || 'Review this patient’s current plan and submitted exercise results.'}
      actions={<><Link to="/therapist/patients"><Button variant="secondary" icon={<ArrowLeft size={16} />}>Patients</Button></Link>{patient && <Link to={`/therapist/assign-exercise?patient_id=${patient.id}`}><Button icon={<ClipboardList size={16} />}>Assign exercise</Button></Link>}</>}
    />
    {error && <Alert variant="error">{error}</Alert>}
    {patient && <>
      <div className="patient-overview-stats" aria-label="Patient care summary">
        <Card><ClipboardList size={18} /><strong>{activeAssignments.length}</strong><span>active exercises</span></Card>
        <Card><Activity size={18} /><strong>{activePlans.length}</strong><span>active care plans</span></Card>
        <Card><FileBarChart size={18} /><strong>{new Set(results.map((result) => result.session.id)).size}</strong><span>saved session results</span></Card>
        <Card><CalendarClock size={18} /><strong>{formatDate(recentResults[0]?.session.completed_at)}</strong><span>latest submitted result</span></Card>
      </div>

      <section className="patient-overview-section">
        <div className="patient-overview-section__heading"><div><h2>Exercise assignments</h2><p>Exercises currently available to this patient.</p></div></div>
        {assignments.length === 0 ? <EmptyState icon={<ClipboardList size={24} />} title="No exercises assigned" description="Assign an exercise to start this patient’s program." /> : <div className="patient-overview-list">{assignments.map((item) => <Card key={item.id} className="patient-overview-item"><div><h3>{item.exercise.name}</h3><p>{item.target_sets ?? '—'} sets · {item.target_reps ?? '—'} reps · {item.exercise.target_area || 'General'}</p>{item.instructions && <p className="patient-overview-cue">{item.instructions}</p>}</div><StatusBadge status={item.status === 'active' ? 'success' : item.status === 'paused' ? 'warning' : 'neutral'}>{item.status}</StatusBadge></Card>)}</div>}
      </section>

      <section className="patient-overview-section">
        <div className="patient-overview-section__heading"><div><h2>Care plans</h2><p>Therapist-written routines and guidance.</p></div></div>
        {plans.length === 0 ? <EmptyState icon={<ClipboardList size={24} />} title="No care plans yet" description="Create a structured care plan for this patient." /> : <div className="patient-overview-list">{plans.map((plan) => <Card key={plan.id} className="patient-overview-plan"><div className="patient-overview-item"><div><h3>{plan.title}</h3><p>{plan.days_per_week} sessions per week{plan.end_date ? ` · Review by ${formatDate(plan.end_date)}` : ''}</p></div><StatusBadge status={plan.status === 'active' ? 'success' : plan.status === 'paused' ? 'warning' : 'neutral'}>{plan.status}</StatusBadge></div>{plan.notes && <p className="patient-overview-cue">{plan.notes}</p>}<ul>{plan.items.map((item) => <li key={item.id}><strong>{item.exercise.name}</strong> · {item.sets} sets × {item.reps} reps{item.instructions ? ` · ${item.instructions}` : ''}</li>)}</ul></Card>)}</div>}
      </section>

      <section className="patient-overview-section">
        <div className="patient-overview-section__heading"><div><h2>Recent session results</h2><p>Submitted summaries are informational and do not replace clinical judgment.</p></div><Link to="/therapist/sessions">All results</Link></div>
        {recentResults.length === 0 ? <EmptyState icon={<FileBarChart size={24} />} title="No submitted results yet" description="Results will appear here after the patient completes and submits an exercise session." /> : <div className="patient-overview-list">{recentResults.slice(0, 8).map((result) => { const checkIn = result.result_data?.patient_check_in; return <Card key={result.id} className="patient-overview-result"><div><h3>{result.exercise.name}</h3><p>Session #{result.session.id} · {formatDate(result.session.completed_at)}</p></div><div className="patient-overview-result__metrics">{Object.entries(result.result_data || {}).filter(([key, value]) => ['repetitions', 'accuracy'].includes(key) && typeof value === 'number').map(([key, value]) => <span key={key}><strong>{key === 'accuracy' ? `${value}%` : value}</strong> {key === 'accuracy' ? 'accuracy' : 'reps'}</span>)}</div>{checkIn && <div className="patient-overview-checkin"><strong>Patient check-in · self-reported</strong><span>Discomfort {checkIn.discomfort_rating}/10 · Effort {checkIn.effort_rating}/10</span>{checkIn.note && <p>{checkIn.note}</p>}</div>}</Card>; })}</div>}
      </section>
    </>}
  </div>;
}

export default TherapistPatientOverview;
