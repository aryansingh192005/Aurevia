import { Link, Navigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Camera,
  ClipboardCheck,
  MoveUpRight,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

import './Home.css';

const FEATURES = [
  {
    icon: Camera,
    title: 'AI Motion Tracking',
    description:
      'Real-time pose tracking measures key joint angles through your camera while you move, rep by rep.',
  },
  {
    icon: Activity,
    title: 'Live Form Feedback',
    description:
      'Supportive movement cues help you stay aware of your form as you work through each exercise.',
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
      'Your therapist can set your exercises, targets, and instructions while you focus on moving comfortably.',
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
    description: 'See movement-analysis estimates, form cues, and reps as you exercise.',
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

  if (isAuthenticated) {
    return <Navigate to={primaryCtaTo} replace />;
  }

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero__content animate-in">
          <span className="hero__badge">
            <span className="hero__badge-dot" />
            THERAPY THAT MEETS YOU AT HOME
          </span>

          <h1>
            Your recovery,
            <span className="text-gradient-light"> in motion.</span>
          </h1>

          <p>
            A more connected way to keep up with your rehabilitation. Follow your
            therapist’s plan, move at your own pace, and see each session add up.
          </p>

          <div className="hero__actions">
            <Link to={primaryCtaTo} className="hero__cta-primary">
              {primaryCtaLabel}
              <ArrowRight size={18} />
            </Link>

            {!isAuthenticated && (
              <Link to="/login" className="hero__cta-secondary">
                I already have an account <MoveUpRight size={15} />
              </Link>
            )}
          </div>

          <div className="hero__trust">
            <ShieldCheck size={16} />
            <span>Therapist-guided. Designed around your progress.</span>
          </div>
        </div>

        <div className="hero-visual" role="img" aria-label="Illustration of Aurevia exercise tracking">
          <div className="hero-visual__orb hero-visual__orb--one" />
          <div className="hero-visual__orb hero-visual__orb--two" />
          <div className="motion-lines" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <div className="session-preview">
            <div className="session-preview__top"><span><Activity size={16} /> EXAMPLE SESSION</span><span className="session-preview__signal">Movement summary</span></div>
            <div className="session-preview__body">
              <div className="session-preview__figure" aria-hidden="true">
                <span className="figure-halo" />
                <span className="figure-head" />
                <span className="figure-torso" />
                <span className="figure-arm figure-arm--left" />
                <span className="figure-arm figure-arm--right" />
                <span className="figure-leg figure-leg--left" />
                <span className="figure-leg figure-leg--right" />
                <span className="figure-joint joint--shoulder" /><span className="figure-joint joint--elbow" />
                <span className="figure-joint joint--hip" /><span className="figure-joint joint--knee" />
              </div>
              <div className="session-preview__metric"><span>THIS SESSION</span><strong>08 <small>/ 12 reps</small></strong><div className="preview-progress"><i /></div><p>Easy does it. You’re doing great.</p></div>
            </div>
            <div className="session-preview__bottom"><span>Sample feedback</span><span>Illustrative preview</span></div>
          </div>
          <div className="floating-note"><span><BarChart3 size={17} /></span><div><strong>Every session counts</strong><small>Progress you can look back on</small></div></div>
          <div className="hero-visual__caption">MOVE WITH CONFIDENCE <span>✳</span> GROW AT YOUR PACE</div>
        </div>
      </section>

      <section className="section-features">
        <div className="section-heading">
          <span className="section-heading__eyebrow">Why Aurevia</span>
          <h2>Recovery, made measurable</h2>
          <p>
            Keep your plan, movement feedback, and session history together in one
            thoughtful space built to support the work you’re already doing.
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
          <h2>A little structure goes a long way</h2>
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
          <h2>Progress feels better when it’s shared</h2>
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
