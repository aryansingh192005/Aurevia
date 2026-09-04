import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Camera,
  ClipboardCheck,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

import './Home.css';

const FEATURES = [
  {
    icon: Camera,
    title: 'AI Motion Tracking',
    description:
      'Real-time pose estimation reads joint angles through your camera and understands how you move, rep by rep.',
  },
  {
    icon: Activity,
    title: 'Live Form Feedback',
    description:
      'Instant, judgment-free cues help you correct form in the moment instead of finding out at your next appointment.',
  },
  {
    icon: BarChart3,
    title: 'Progress You Can See',
    description:
      'Every session becomes a data point, so recovery trends are visible to you and your therapist over time.',
  },
  {
    icon: ClipboardCheck,
    title: 'Therapist-Guided Plans',
    description:
      'Licensed therapists assign and adjust your exact exercise program, sets, and reps — the AI just keeps you honest.',
  },
];

const STEPS = [
  {
    title: 'Get assigned a plan',
    description: 'Your therapist prescribes exercises tailored to your recovery goals.',
  },
  {
    title: 'Move in front of the camera',
    description: 'Aurevia tracks your joints in real time and counts every rep.',
  },
  {
    title: 'Get instant feedback',
    description: 'See accuracy, form, and reps the moment you finish a set.',
  },
  {
    title: 'Track real progress',
    description: 'Your therapist reviews results and adapts your program as you improve.',
  },
];

function Home() {
  const { isAuthenticated, user } = useAuth();

  const primaryCtaTo = isAuthenticated
    ? (user?.role === 'therapist' ? '/therapist/dashboard' : '/patient/dashboard')
    : '/register';

  const primaryCtaLabel = isAuthenticated ? 'Go to Dashboard' : 'Start Your Recovery';

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero__glow" aria-hidden="true" />

        <div className="hero__content animate-in">
          <span className="hero__badge">
            <Sparkles size={14} />
            Global AI Hackathon 2025 — Winning Build
          </span>

          <h1>
            Rehabilitation that
            <span className="text-gradient-light"> watches your form</span>,
            not just your reps.
          </h1>

          <p>
            Aurevia pairs licensed therapist programs with real-time AI pose
            analysis, so every squat, stretch, and rep gets measured — turning
            physical therapy into something you can actually see progress in.
          </p>

          <div className="hero__actions">
            <Link to={primaryCtaTo} className="hero__cta-primary">
              {primaryCtaLabel}
              <ArrowRight size={18} />
            </Link>

            {!isAuthenticated && (
              <Link to="/login" className="hero__cta-secondary">
                I already have an account
              </Link>
            )}
          </div>

          <div className="hero__trust">
            <ShieldCheck size={16} />
            <span>Built for patients and licensed therapists, together.</span>
          </div>
        </div>
      </section>

      <section className="section-features">
        <div className="section-heading">
          <span className="section-heading__eyebrow">Why Aurevia</span>
          <h2>Recovery, made measurable</h2>
          <p>
            Traditional rehab relies on memory and self-reporting. Aurevia
            replaces guesswork with a camera, an AI model, and real numbers.
          </p>
        </div>

        <div className="features-grid">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div className="feature-card" key={title}>
              <div className="feature-card__icon">
                <Icon size={22} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-steps">
        <div className="section-heading">
          <span className="section-heading__eyebrow">How it works</span>
          <h2>From prescription to progress in four steps</h2>
        </div>

        <div className="steps-grid">
          {STEPS.map((step, index) => (
            <div className="step-card" key={step.title}>
              <span className="step-card__number">{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-cta">
        <div className="cta-panel">
          <Users size={28} />
          <h2>Patients and therapists, on the same page</h2>
          <p>
            Create your free account to start assigning exercises, tracking
            sessions, or beginning your own rehabilitation journey today.
          </p>
          <Link to={isAuthenticated ? primaryCtaTo : '/register'} className="hero__cta-primary">
            {isAuthenticated ? primaryCtaLabel : 'Create your account'}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
