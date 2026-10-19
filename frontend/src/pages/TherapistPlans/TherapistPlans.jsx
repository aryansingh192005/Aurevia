import { useEffect, useState } from 'react';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';

import api from '../../services/api';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Alert from '../../components/Alert/Alert';
import Spinner from '../../components/Spinner/Spinner';
import './TherapistPlans.css';

const blankItem = () => ({ exercise_id: '', sets: 3, reps: 10, rest_seconds: 30, days_per_week: 3, instructions: '' });

function TherapistPlans() {
  const [patients, setPatients] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ patient_id: '', title: '', notes: '', days_per_week: 3, start_date: '', end_date: '' });
  const [items, setItems] = useState([blankItem()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([api.get('/patients'), api.get('/exercises'), api.get('/plans')])
      .then(([patientRes, exerciseRes, planRes]) => {
        setPatients(patientRes.data.patients || []);
        setExercises(exerciseRes.data.exercises || []);
        setPlans(planRes.data.plans || []);
      })
      .catch((e) => setError(e.response?.data?.error || 'Could not load care plan data.'))
      .finally(() => setLoading(false));
  }, []);

  function updateItem(index, key, value) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const response = await api.post('/plans', {
        ...form,
        patient_id: Number(form.patient_id),
        days_per_week: Number(form.days_per_week),
        exercises: items.map((item) => ({
          ...item,
          exercise_id: Number(item.exercise_id),
          sets: Number(item.sets), reps: Number(item.reps),
          rest_seconds: Number(item.rest_seconds), days_per_week: Number(item.days_per_week),
        })),
      });
      setPlans((current) => [response.data.plan, ...current]);
      setSuccess(`Care plan created for ${response.data.plan.patient.name}.`);
      setForm({ patient_id: '', title: '', notes: '', days_per_week: 3, start_date: '', end_date: '' });
      setItems([blankItem()]);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not create this care plan.');
    } finally { setSaving(false); }
  }

  async function setStatus(plan, status) {
    try {
      const response = await api.patch(`/plans/${plan.id}`, { status });
      setPlans((current) => current.map((item) => item.id === plan.id ? response.data.plan : item));
    } catch (e) { setError(e.response?.data?.error || 'Could not update this plan.'); }
  }

  if (loading) return <Spinner label="Loading care plans..." fullPage />;
  return <div className="care-plans-page">
    <PageHeader eyebrow="Personalized rehabilitation" title="Care plans" description="Build a structured routine with targets, rest, and therapist guidance for each exercise." />
    {error && <Alert variant="error">{error}</Alert>}{success && <Alert variant="success">{success}</Alert>}
    <Card className="plan-builder">
      <div className="plan-builder__intro"><ClipboardList size={20} /><div><h2>Create a care plan</h2><p>Every exercise becomes an assignment the patient can start from My Exercises.</p></div></div>
      <form onSubmit={submit} className="plan-form">
        <div className="plan-form__grid">
          <label>Patient<select required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}><option value="">Choose a patient</option>{patients.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
          <label>Plan name<input required maxLength="140" placeholder="e.g. Shoulder mobility · Week 1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label>Sessions per week<input type="number" min="1" max="7" required value={form.days_per_week} onChange={(e) => setForm({ ...form, days_per_week: e.target.value })} /></label>
          <label>Start date<input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></label>
          <label>Review date<input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></label>
          <label className="plan-form__wide">Therapist notes<textarea rows="2" maxLength="2000" placeholder="Goals, precautions, or advice for the patient" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        </div>
        <div className="plan-exercises-heading"><h3>Plan exercises</h3><Button type="button" variant="secondary" icon={<Plus size={15} />} onClick={() => setItems([...items, blankItem()])}>Add exercise</Button></div>
        {items.map((item, index) => <div className="plan-exercise-row" key={index}>
          <label className="plan-exercise-row__exercise">Exercise<select required value={item.exercise_id} onChange={(e) => updateItem(index, 'exercise_id', e.target.value)}><option value="">Choose exercise</option>{exercises.map((ex) => <option value={ex.id} key={ex.id}>{ex.name}</option>)}</select></label>
          <label>Sets<input type="number" min="1" max="50" required value={item.sets} onChange={(e) => updateItem(index, 'sets', e.target.value)} /></label>
          <label>Reps<input type="number" min="1" max="100" required value={item.reps} onChange={(e) => updateItem(index, 'reps', e.target.value)} /></label>
          <label>Rest (sec)<input type="number" min="0" max="600" value={item.rest_seconds} onChange={(e) => updateItem(index, 'rest_seconds', e.target.value)} /></label>
          <label>Days / week<input type="number" min="1" max="7" value={item.days_per_week} onChange={(e) => updateItem(index, 'days_per_week', e.target.value)} /></label>
          <label className="plan-exercise-row__instructions">Patient instructions<input maxLength="500" placeholder="Optional cue or adaptation" value={item.instructions} onChange={(e) => updateItem(index, 'instructions', e.target.value)} /></label>
          {items.length > 1 && <button className="plan-remove" type="button" aria-label="Remove exercise" onClick={() => setItems(items.filter((_, i) => i !== index))}><Trash2 size={17} /></button>}
        </div>)}
        <Button type="submit" loading={saving} icon={<ClipboardList size={16} />}>Publish care plan</Button>
      </form>
    </Card>
    <section className="care-plans-list"><h2>Your plans</h2>{plans.length === 0 ? <p className="care-plans-empty">New plans will appear here after you publish them.</p> : plans.map((plan) => <Card key={plan.id} className="care-plan-card"><div><span className={`care-plan-status care-plan-status--${plan.status}`}>{plan.status}</span><h3>{plan.title}</h3><p>{plan.patient.name} · {plan.items.length} exercises · {plan.days_per_week} days/week</p>{plan.notes && <p className="care-plan-card__notes">{plan.notes}</p>}</div><div className="care-plan-card__actions">{plan.status === 'active' ? <Button variant="secondary" onClick={() => setStatus(plan, 'paused')}>Pause</Button> : plan.status === 'paused' ? <Button variant="secondary" onClick={() => setStatus(plan, 'active')}>Resume</Button> : null}{plan.status !== 'completed' && <Button variant="secondary" onClick={() => setStatus(plan, 'completed')}>Complete plan</Button>}</div></Card>)}</section>
  </div>;
}

export default TherapistPlans;
