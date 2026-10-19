import { useEffect, useMemo, useState } from 'react';
import { Bell, CalendarDays, CheckCircle2, Clock3, Dumbbell, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import api from '../../services/api';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Alert from '../../components/Alert/Alert';
import Spinner from '../../components/Spinner/Spinner';
import { useAuth } from '../../context/AuthContext';
import './PatientPlans.css';

function PatientPlans() {
  const { user } = useAuth();
  const reminderKey = `aurevia.dailyReminder.${user?.id || 'patient'}`;
  const [plans, setPlans] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reminderTime, setReminderTime] = useState(() => localStorage.getItem(reminderKey) || '18:00');
  const [reminderEnabled, setReminderEnabled] = useState(() => localStorage.getItem(reminderKey) !== null);

  useEffect(() => {
    Promise.all([api.get('/plans'), api.get('/sessions')])
      .then(([planRes, sessionRes]) => { setPlans(planRes.data.plans || []); setSessions(sessionRes.data.sessions || []); })
      .catch((e) => setError(e.response?.data?.error || 'Could not load your care plan.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!reminderEnabled || !('Notification' in window) || Notification.permission !== 'granted') return undefined;
    const checkReminder = () => {
      const now = new Date();
      const [hour, minute] = reminderTime.split(':').map(Number);
      const key = `aurevia.reminder.sent.${user?.id || 'patient'}.${now.toLocaleDateString()}`;
      if (now.getHours() === hour && now.getMinutes() === minute && localStorage.getItem(key) !== 'yes') {
        new Notification('Aurevia movement reminder', { body: 'Your care plan is ready when you are. Take it at your own pace.' });
        localStorage.setItem(key, 'yes');
      }
    };
    const timer = window.setInterval(checkReminder, 30000);
    return () => window.clearInterval(timer);
  }, [reminderEnabled, reminderTime, user?.id]);

  const activePlans = plans.filter((plan) => plan.status === 'active');
  const pastPlans = plans.filter((plan) => plan.status !== 'active');
  const streak = useMemo(() => {
    const days = new Set(sessions.filter((s) => s.status === 'completed' && s.completed_at).map((s) => new Date(s.completed_at).toLocaleDateString()));
    let count = 0;
    const date = new Date();
    if (!days.has(date.toLocaleDateString())) date.setDate(date.getDate() - 1);
    while (days.has(date.toLocaleDateString())) { count += 1; date.setDate(date.getDate() - 1); }
    return count;
  }, [sessions]);

  async function enableReminder() {
    if (!('Notification' in window)) { setError('This browser does not support desktop reminders.'); return; }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { setError('Notifications were not enabled. You can still use your plan without them.'); return; }
    localStorage.setItem(reminderKey, reminderTime);
    setReminderEnabled(true);
    setError('');
  }

  function disableReminder() { localStorage.removeItem(reminderKey); setReminderEnabled(false); }

  if (loading) return <Spinner label="Loading your care plan..." fullPage />;
  return <div className="patient-plans-page">
    <PageHeader eyebrow="Your routine" title="My care plan" description="A plan shaped by your therapist. Progress at a comfortable pace and pause whenever you need." />
    {error && <Alert variant="info">{error}</Alert>}
    <div className="plan-motivation-row">
      <Card className="plan-streak"><span className="plan-streak__icon"><Sparkles size={20} /></span><div><strong>{streak} day{streak === 1 ? '' : 's'}</strong><span>current movement streak</span></div><p>Consistency matters more than perfection. Rest days are part of recovery.</p></Card>
      <Card className="plan-reminder"><div className="plan-reminder__heading"><Bell size={19} /><div><h2>Gentle reminder</h2><p>Device-only reminder while Aurevia is open in this browser.</p></div></div><div className="plan-reminder__controls"><input aria-label="Reminder time" type="time" value={reminderTime} onChange={(e) => { setReminderTime(e.target.value); if (reminderEnabled) localStorage.setItem(reminderKey, e.target.value); }} /><Button variant="secondary" onClick={reminderEnabled ? disableReminder : enableReminder}>{reminderEnabled ? 'Turn off' : 'Set reminder'}</Button></div></Card>
    </div>
    {activePlans.length === 0 ? <Card className="patient-plan-empty"><CalendarDays size={28} /><h2>No active care plan yet</h2><p>Your therapist’s plan will appear here. Assigned exercises are still available in My Exercises.</p><Link to="/patient/exercises"><Button variant="secondary">View my exercises</Button></Link></Card> : activePlans.map((plan) => <Card className="patient-plan-card" key={plan.id}>
      <div className="patient-plan-card__header"><div><span className="patient-plan-eyebrow"><CheckCircle2 size={14} /> Therapist-designed routine</span><h2>{plan.title}</h2><p>{plan.days_per_week} sessions per week{plan.end_date ? ` · Review by ${new Date(`${plan.end_date}T12:00:00`).toLocaleDateString()}` : ''}</p></div>{plan.therapist?.name && <span className="patient-plan-therapist">With {plan.therapist.name}</span>}</div>
      {plan.notes && <div className="patient-plan-note">{plan.notes}</div>}
      <div className="patient-plan-exercises">{plan.items.map((item) => {
        const completed = sessions.filter((session) => session.assignment_id === item.assignment_id && session.status === 'completed').length;
        return <article className="patient-plan-exercise" key={item.id}><div className="patient-plan-exercise__icon"><Dumbbell size={18} /></div><div className="patient-plan-exercise__main"><h3>{item.exercise.name}</h3><p>{item.sets} sets · {item.reps} reps · {item.days_per_week} days/week</p>{item.instructions && <p className="patient-plan-exercise__cue">{item.instructions}</p>}<span className="patient-plan-exercise__done">{completed > 0 ? `${completed} completed session${completed === 1 ? '' : 's'}` : 'Ready when you are'}</span></div><span className="patient-plan-rest"><Clock3 size={14} /> {item.rest_seconds}s rest</span><Link to={`/patient/exercises/${item.assignment_id}/start`}><Button>Start exercise</Button></Link></article>;
      })}</div>
      <p className="patient-plan-safety">Stop if you feel pain, dizziness, or unwell, and contact your therapist for guidance.</p>
    </Card>)}
    {pastPlans.length > 0 && <details className="patient-plan-history">
      <summary>Past care plans <span>{pastPlans.length}</span></summary>
      <div className="patient-plan-history__list">{pastPlans.map((plan) => <Card className="patient-plan-history__item" key={plan.id}>
        <div className="patient-plan-history__heading"><div><h2>{plan.title}</h2><p>With {plan.therapist?.name || 'your therapist'} · {plan.items.length} exercises</p></div><span className={`patient-plan-status patient-plan-status--${plan.status}`}>{plan.status}</span></div>
        {plan.notes && <p className="patient-plan-history__notes">{plan.notes}</p>}
        <ul>{plan.items.map((item) => <li key={item.id}><strong>{item.exercise.name}</strong> · {item.sets} sets × {item.reps} reps{item.instructions ? ` · ${item.instructions}` : ''}</li>)}</ul>
      </Card>)}</div>
    </details>}
  </div>;
}

export default PatientPlans;
