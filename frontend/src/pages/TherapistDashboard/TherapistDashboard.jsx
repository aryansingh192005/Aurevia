import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ClipboardList,
  FileBarChart,
  ListChecks,
  Users,
  CalendarDays,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatCard from '../../components/StatCard/StatCard';
import Card from '../../components/Card/Card';
import Spinner from '../../components/Spinner/Spinner';

import '../PatientDashboard/PatientDashboard.css';

function TherapistDashboard() {
  const { user } = useAuth();

  const [patients, setPatients] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [patientsRes, assignmentsRes, resultsRes] = await Promise.all([
          api.get('/patients'),
          api.get('/assignments'),
          api.get('/session-results'),
        ]);

        if (!isMounted) return;

        setPatients(patientsRes.data.patients || []);
        setAssignments(assignmentsRes.data.assignments || []);
        setResults(resultsRes.data.results || []);
      } catch {
        // Best-effort summary; sub-pages surface their own errors.
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeAssignments = assignments.filter((assignment) => assignment.status === 'active');
  const recentResults = [...results]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  if (isLoading) {
    return <Spinner label="Loading your dashboard..." fullPage />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Therapist Dashboard"
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
        description="Manage your patients and rehabilitation programs."
      />

      <div className="stats-row">
        <StatCard
          icon={<Users size={22} />}
          label="Total Patients"
          value={patients.length}
          tone="primary"
        />
        <StatCard
          icon={<ClipboardList size={22} />}
          label="Active Assignments"
          value={activeAssignments.length}
          tone="accent"
        />
        <StatCard
          icon={<FileBarChart size={22} />}
          label="Session Results"
          value={results.length}
          tone="success"
        />
      </div>

      <div className="therapist-dashboard-layout">
        <Card className="dashboard-recent-card therapist-activity-card">
          <div className="dashboard-section-heading">
            <div><span className="dashboard-section-label">CARE TEAM</span><h2>Recent patient activity</h2></div>
            <Link to="/therapist/sessions" className="dashboard-subtle-link">All results <ArrowRight size={14} /></Link>
          </div>
          {recentResults.length ? <div className="dashboard-activity-list">
            {recentResults.map((result) => <div className="dashboard-activity-row" key={result.id}>
              <span className="dashboard-activity-icon"><CalendarDays size={16} /></span>
              <div className="dashboard-activity-main"><strong>{result.patient?.name || 'Patient'} <span className="dashboard-activity-separator">·</span> {result.exercise?.name || 'Exercise session'}</strong><span>{result.created_at ? new Date(result.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date not recorded'}</span></div>
              <span className="dashboard-activity-status">Session #{result.session?.id ?? '—'}</span>
            </div>)}
          </div> : <p className="dashboard-activity-empty">Completed patient sessions and their summaries will appear here.</p>}
        </Card>
        <Card className="therapist-roster-card">
          <div className="dashboard-section-heading">
            <div><span className="dashboard-section-label">YOUR PATIENTS</span><h2>Patient list</h2></div>
            <Link to="/therapist/patients" className="dashboard-subtle-link">View all <ArrowRight size={14} /></Link>
          </div>
          {patients.length ? <div className="therapist-roster-list">{patients.slice(0, 5).map((patient) => {
            const count = activeAssignments.filter((assignment) => assignment.patient?.id === patient.id).length;
            return <div className="therapist-roster-row" key={patient.id}><span className="therapist-roster-avatar">{patient.name?.charAt(0)?.toUpperCase() || 'P'}</span><div><strong>{patient.name}</strong><span>{count} active exercise{count === 1 ? '' : 's'}</span></div></div>;
          })}</div> : <p className="dashboard-activity-empty">Registered patients will appear here.</p>}
        </Card>
      </div>

      <div className="dashboard-grid dashboard-quick-links">
        <Card hoverable className="dashboard-tile">
          <Link to="/therapist/patients" className="dashboard-tile__link">
            <div className="dashboard-tile__icon dashboard-tile__icon--primary">
              <Users size={22} />
            </div>
            <h2>Patients</h2>
            <p>View and manage your assigned patients.</p>
            <span className="dashboard-tile__cta">
              View Patients <ArrowRight size={15} />
            </span>
          </Link>
        </Card>

        <Card hoverable className="dashboard-tile">
          <Link to="/therapist/assign-exercise" className="dashboard-tile__link">
            <div className="dashboard-tile__icon dashboard-tile__icon--energy">
              <ListChecks size={22} />
            </div>
            <h2>Assign Exercise</h2>
            <p>Prescribe rehabilitation exercises to your patients.</p>
            <span className="dashboard-tile__cta">
              Assign Exercise <ArrowRight size={15} />
            </span>
          </Link>
        </Card>

        <Card hoverable className="dashboard-tile">
          <Link to="/therapist/sessions" className="dashboard-tile__link">
            <div className="dashboard-tile__icon dashboard-tile__icon--accent">
              <FileBarChart size={22} />
            </div>
            <h2>Session Results</h2>
            <p>Review patient rehabilitation sessions.</p>
            <span className="dashboard-tile__cta">
              View Results <ArrowRight size={15} />
            </span>
          </Link>
        </Card>
      </div>
    </div>
  );
}

export default TherapistDashboard;
