import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ShieldCheck, Trash2 } from 'lucide-react';

import api from '../../services/api';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Alert from '../../components/Alert/Alert';
import { useAuth } from '../../context/AuthContext';
import './Privacy.css';

function Privacy() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState('');

  async function exportData() {
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await api.get('/privacy/export');
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `aurevia-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Your Aurevia data export has been downloaded.');
    } catch (e) { setError(e.response?.data?.error || 'Could not export your data.'); }
    finally { setBusy(false); }
  }

  async function deleteMotionData() {
    const confirmed = window.confirm('Delete all saved joint-angle repetitions from your sessions? This cannot be undone. Your session summaries and progress history will stay.');
    if (!confirmed) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await api.delete('/privacy/movement-recordings');
      setMessage(`${response.data.deleted} saved repetition${response.data.deleted === 1 ? '' : 's'} deleted. ${response.data.message}`);
    } catch (e) { setError(e.response?.data?.error || 'Could not delete saved repetitions.'); }
    finally { setBusy(false); }
  }

  async function deleteAccount() {
    const confirmed = window.confirm('Permanently delete your Aurevia account and all associated care plans, assignments, session history, feedback, progress, and saved movement data? This cannot be undone.');
    if (!confirmed) return;
    setBusy(true); setError('');
    try {
      await api.delete('/privacy/account', { data: { password } });
      await logout();
      navigate('/', { replace: true });
    } catch (e) { setError(e.response?.data?.error || 'Could not delete your account.'); }
    finally { setBusy(false); }
  }

  return <div className="privacy-page">
    <PageHeader eyebrow="Your information" title="Privacy & data" description="See what Aurevia stores, download your information, and remove optional AI-training recordings." />
    {error && <Alert variant="error">{error}</Alert>}{message && <Alert variant="success">{message}</Alert>}
    <Card className="privacy-card"><div className="privacy-card__icon"><ShieldCheck size={21} /></div><div className="privacy-card__body"><h2>Camera and movement data</h2><p>Camera video is processed in your browser and is not uploaded. Joint angles are sent to Aurevia for live exercise prediction and session analysis. Saving repetition sequences for therapist review and AI improvement is optional and off unless you opt in before a session.</p><p>Session summaries and progress records remain in your account history. You can export your data or remove saved joint-angle repetitions below.</p></div></Card>
    <div className="privacy-actions"><Card className="privacy-action-card"><Download size={20} /><div><h2>Download my data</h2><p>Save a JSON copy of your profile, care plans, sessions, progress, feedback, and any saved movement sequences.</p></div><Button variant="secondary" loading={busy} onClick={exportData}>Download export</Button></Card><Card className="privacy-action-card privacy-action-card--delete"><Trash2 size={20} /><div><h2>Remove saved repetitions</h2><p>Delete optional joint-angle sequences from your sessions. This does not remove session summaries, assignments, progress, or therapist notes.</p></div><Button variant="danger" loading={busy} onClick={deleteMotionData}>Delete recordings</Button></Card></div>
    <Card className="privacy-account-delete"><div><h2>Delete my account</h2><p>Permanently remove your patient account and all its care plans, assignments, session history, feedback, progress, and saved movement data.</p></div><label>Current password<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label><Button variant="danger" loading={busy} disabled={!password} onClick={deleteAccount}>Delete account permanently</Button></Card>
  </div>;
}

export default Privacy;
