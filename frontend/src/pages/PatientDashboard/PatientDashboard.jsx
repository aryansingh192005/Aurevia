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

import './PatientDashboard.css';

function PatientDashboard() {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [assignmentsRes, sessionsRes] = await Promise.all([
          api.get('/assignments'),
          api.get('/sessions'),
        ]);

        if (!isMounted) return;

        setAssignments(assignmentsRes.data.assignments || []);
        setSessions(sessionsRes.data.sessions || []);
      } catch {
        // Dashboard summary is best-effort; individual pages surface errors.
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
          <Link to="/patient/exercises" className="dashboard-tile__link">
            <div className="dashboard-tile__icon dashboard-tile__icon--energy">
              <Dumbbell size={22} />
            </div>
            <h2>Start Exercise</h2>
            <p>Begin your next rehabilitation session.</p>
            <span className="dashboard-tile__cta">
              Start Now <ArrowRight size={15} />
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
