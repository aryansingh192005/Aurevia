import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Dumbbell,
  History,
  ListChecks,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatCard from '../../components/StatCard/StatCard';
import Card from '../../components/Card/Card';
import Spinner from '../../components/Spinner/Spinner';
import Alert from '../../components/Alert/Alert';

import './PatientDashboard.css';

function PatientDashboard() {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [assignmentsResult, sessionsResult] = await Promise.allSettled([
          api.get('/assignments'),
          api.get('/sessions'),
        ]);

        if (!isMounted) return;

        const unavailable = [];
        if (assignmentsResult.status === 'fulfilled') {
          setAssignments(assignmentsResult.value.data.assignments || []);
        } else {
          unavailable.push('assigned exercises');
        }
        if (sessionsResult.status === 'fulfilled') {
          setSessions(sessionsResult.value.data.sessions || []);
        } else {
          unavailable.push('session history');
        }
        if (unavailable.length > 0) {
          setError(`Could not load ${unavailable.join(' and ')}. Refresh the page or open that section to try again.`);
        }
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
  const completedSessions = sessions.filter((session) => session.status === 'completed');
  const nextAssignment = activeAssignments[0];
  const resumableSession = nextAssignment
    ? sessions.find((session) => (
      session.assignment_id === nextAssignment.id
      && ['created', 'started'].includes(session.status)
    ))
    : null;
  const nextExercisePath = nextAssignment
    ? `/patient/exercises/${nextAssignment.id}/start${resumableSession ? `?session_id=${resumableSession.id}` : ''}`
    : '/patient/exercises';

  if (isLoading) {
    return <Spinner label="Loading your dashboard..." fullPage />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Patient Dashboard"
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
        description="Your rehabilitation journey at a glance."
      />

      {error && <Alert variant="error">{error}</Alert>}

      <div className="stats-row">
        <StatCard
          icon={<Dumbbell size={22} />}
          label="Active Exercises"
          value={activeAssignments.length}
          tone="primary"
        />
        <StatCard
          icon={<CheckCircle2 size={22} />}
          label="Completed Sessions"
          value={completedSessions.length}
          tone="success"
        />
        <StatCard
          icon={<Activity size={22} />}
          label="Total Sessions"
          value={sessions.length}
          tone="accent"
        />
      </div>

      <div className="dashboard-grid">
        <Card hoverable className="dashboard-tile">
          <Link to="/patient/exercises" className="dashboard-tile__link">
            <div className="dashboard-tile__icon dashboard-tile__icon--primary">
              <ListChecks size={22} />
            </div>
            <h2>Assigned Exercises</h2>
            <p>View exercises assigned by your therapist.</p>
            <span className="dashboard-tile__cta">
              View Exercises <ArrowRight size={15} />
            </span>
          </Link>
        </Card>

        <Card hoverable className="dashboard-tile">
          <Link to={nextExercisePath} className="dashboard-tile__link">
            <div className="dashboard-tile__icon dashboard-tile__icon--energy">
              <Dumbbell size={22} />
            </div>
            <h2>{resumableSession ? 'Resume Your Session' : nextAssignment ? 'Your Next Exercise' : 'Explore Your Exercises'}</h2>
            <p>
              {resumableSession
                ? `Continue ${nextAssignment.exercise.name}${nextAssignment.target_sets ? ` · ${nextAssignment.target_sets} sets` : ''}${nextAssignment.target_reps ? ` · ${nextAssignment.target_reps} reps per set` : ''}.`
                : nextAssignment
                  ? `Start ${nextAssignment.exercise.name}${nextAssignment.target_sets ? ` · ${nextAssignment.target_sets} sets` : ''}${nextAssignment.target_reps ? ` · ${nextAssignment.target_reps} reps per set` : ''}.`
                  : 'View exercises assigned by your therapist and start when you are ready.'}
            </p>
            <span className="dashboard-tile__cta">
              {resumableSession ? 'Resume Session' : nextAssignment ? 'Start Exercise' : 'View Exercises'} <ArrowRight size={15} />
            </span>
          </Link>
        </Card>

        <Card hoverable className="dashboard-tile">
          <Link to="/sessions" className="dashboard-tile__link">
            <div className="dashboard-tile__icon dashboard-tile__icon--accent">
              <History size={22} />
            </div>
            <h2>Session History</h2>
            <p>Review your completed rehabilitation sessions.</p>
            <span className="dashboard-tile__cta">
              View Sessions <ArrowRight size={15} />
            </span>
          </Link>
        </Card>

        <Card hoverable className="dashboard-tile">
          <Link to="/progress" className="dashboard-tile__link">
            <div className="dashboard-tile__icon dashboard-tile__icon--success">
              <BarChart3 size={22} />
            </div>
            <h2>Progress</h2>
            <p>Track your rehabilitation progress over time.</p>
            <span className="dashboard-tile__cta">
              View Progress <ArrowRight size={15} />
            </span>
          </Link>
        </Card>
      </div>
    </div>
  );
}

export default PatientDashboard;
