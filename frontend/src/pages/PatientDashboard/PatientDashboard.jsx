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
  CalendarDays,
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
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.completed_at || b.started_at || b.created_at) - new Date(a.completed_at || a.started_at || a.created_at))
    .slice(0, 4);
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

      <div className="patient-dashboard-layout">
        <Card className="dashboard-next-card">
          <div className="dashboard-next-card__content">
            <span className="dashboard-section-label">YOUR PLAN</span>
            <h2>{resumableSession ? 'Pick up where you left off' : nextAssignment ? 'Your next exercise' : 'Your plan is ready when you are'}</h2>
            <p>{resumableSession
              ? `Continue your ${nextAssignment.exercise.name} session. Your progress so far is saved.`
              : nextAssignment
                ? `Your therapist has assigned ${nextAssignment.exercise.name}. Take it at a comfortable pace.`
                : 'When your therapist assigns an exercise, it will appear here with everything you need to begin.'}</p>
            {nextAssignment && <div className="dashboard-plan-meta">
              {nextAssignment.target_sets && <span>{nextAssignment.target_sets} sets</span>}
              {nextAssignment.target_reps && <span>{nextAssignment.target_reps} reps per set</span>}
              {nextAssignment.exercise?.target_area && <span>{nextAssignment.exercise.target_area}</span>}
            </div>}
            <Link to={nextAssignment ? nextExercisePath : '/patient/exercises'} className="dashboard-primary-link">
              {resumableSession ? 'Resume session' : nextAssignment ? 'View exercise' : 'View my exercises'} <ArrowRight size={16} />
            </Link>
          </div>
          <div className="dashboard-next-card__aside" aria-hidden="true"><Dumbbell size={27} /><span>{activeAssignments.length} active</span></div>
        </Card>

        <Card className="dashboard-recent-card">
          <div className="dashboard-section-heading">
            <div><span className="dashboard-section-label">YOUR ACTIVITY</span><h2>Recent sessions</h2></div>
            <Link to="/sessions" className="dashboard-subtle-link">View history <ArrowRight size={14} /></Link>
          </div>
          {recentSessions.length ? <div className="dashboard-activity-list">
            {recentSessions.map((session) => <div className="dashboard-activity-row" key={session.id}>
              <span className="dashboard-activity-icon"><CalendarDays size={16} /></span>
              <div className="dashboard-activity-main"><strong>{session.exercise?.name || 'Exercise session'}</strong><span>{session.completed_at || session.started_at ? new Date(session.completed_at || session.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date not recorded'}</span></div>
              <span className={`dashboard-activity-status ${session.status === 'completed' ? 'is-complete' : ''}`}>{session.status === 'completed' ? 'Completed' : session.status.replace('_', ' ')}</span>
            </div>)}
          </div> : <p className="dashboard-activity-empty">Your sessions will appear here after you begin an exercise.</p>}
        </Card>
      </div>

      <div className="dashboard-grid dashboard-quick-links">
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
