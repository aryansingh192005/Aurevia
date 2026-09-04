import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  Flame,
  PlayCircle,
  Target,
  Timer,
} from 'lucide-react';

import api from '../../services/api';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Alert from '../../components/Alert/Alert';
import Spinner from '../../components/Spinner/Spinner';
import PoseCamera from '../../components/PoseCamera/PoseCamera';

import './ExerciseSession.css';

const STEPS = ['created', 'started', 'completed'];

function stepIndex(status) {
  const index = STEPS.indexOf(status);
  return index === -1 ? -1 : index;
}

function ExerciseSession() {
  const { assignmentId } = useParams();
  const poseCameraRef = useRef(null);

  const [assignment, setAssignment] = useState(null);
  const [session, setSession] = useState(null);
  const [liveStats, setLiveStats] = useState(null);
  const [finalResult, setFinalResult] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);

  const [resultSubmitted, setResultSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadAssignment() {
      try {
        const response = await api.get(`/assignments/${assignmentId}`);

        if (!isMounted) return;

        setAssignment(response.data.assignment);
      } catch (requestError) {
        if (!isMounted) return;

        setError(
          requestError.response?.data?.error ||
            'Unable to load this exercise assignment.',
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAssignment();

    return () => {
      isMounted = false;
    };
  }, [assignmentId]);

  async function createSession() {
    if (!assignment) return;

    setIsCreating(true);
    setError('');

    try {
      const response = await api.post('/sessions', {
        assignment_id: assignment.id,
      });

      setSession(response.data.session);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          'Unable to create rehabilitation session.',
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function beginRehabilitation() {
    if (!session) return;

    setIsStarting(true);
    setError('');

    try {
      const response = await api.patch(`/sessions/${session.id}`, {
        status: 'started',
      });

      setSession(response.data.session);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          'Unable to start rehabilitation session.',
      );
    } finally {
      setIsStarting(false);
    }
  }

  async function completeSession() {
    if (!session) return;

    // Capture the AI-tracked summary the moment the patient finishes,
    // before the camera unmounts.
    const summary = poseCameraRef.current?.getSummary();
    if (summary) {
      setFinalResult(summary);
    }

    setIsCompleting(true);
    setError('');

    try {
      const response = await api.patch(`/sessions/${session.id}`, {
        status: 'completed',
      });

      setSession(response.data.session);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          'Unable to complete rehabilitation session.',
      );
    } finally {
      setIsCompleting(false);
    }
  }

  async function submitResult() {
    if (!session || session.status !== 'completed') return;

    setIsSubmittingResult(true);
    setError('');

    const resultData = finalResult || {
      repetitions: 0,
      correct_repetitions: 0,
      incorrect_repetitions: 0,
      accuracy: 0,
      feedback: 'No AI tracking data was captured for this session.',
    };

    try {
      await api.post(`/sessions/${session.id}/results`, {
        result_type: 'exercise_analysis',
        result_data: resultData,
      });

      setResultSubmitted(true);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          'Unable to submit exercise result.',
      );
    } finally {
      setIsSubmittingResult(false);
    }
  }

  if (isLoading) {
    return <Spinner label="Loading your exercise..." fullPage />;
  }

  if (error && !assignment) {
    return (
      <div className="session-error">
        <Alert variant="error">{error}</Alert>
        <Link to="/patient/exercises">
          <Button variant="secondary" icon={<ChevronLeft size={16} />}>
            Back to Exercises
          </Button>
        </Link>
      </div>
    );
  }

  if (!assignment) return null;

  const exercise = assignment.exercise;
  const activeStep = session ? stepIndex(session.status) : -1;
  const isLive = Boolean(session && session.status === 'started');

  return (
    <div className="exercise-session">
      <Link to="/patient/exercises" className="session-back-link">
        <ChevronLeft size={16} /> Back to Exercises
      </Link>

      <div className="session-hero">
        <h1>{exercise.name}</h1>
        <p>Your rehabilitation exercise session.</p>
      </div>

      <div className="session-layout">
        <Card className="session-details">
          <h2>Exercise Details</h2>
          <p className="session-details__description">{exercise.description}</p>

          <div className="session-details__meta">
            <div>
              <Target size={16} />
              <span>
                <strong>Target Area</strong>
                {exercise.target_area || 'General'}
              </span>
            </div>
            <div>
              <Flame size={16} />
              <span>
                <strong>Difficulty</strong>
                {exercise.difficulty || 'Any level'}
              </span>
            </div>
            <div>
              <Award size={16} />
              <span>
                <strong>Target Sets</strong>
                {assignment.target_sets ?? 'Not specified'}
              </span>
            </div>
            <div>
              <Timer size={16} />
              <span>
                <strong>Target Reps</strong>
                {assignment.target_reps ?? 'Not specified'}
              </span>
            </div>
          </div>

          {(session?.status === 'started' || session?.status === 'completed') && (
            <div className="session-ai-camera">
              <PoseCamera
                ref={poseCameraRef}
                targetArea={exercise.target_area}
                active={isLive}
                onUpdate={setLiveStats}
                sessionId={session.id}
              />
            </div>
          )}
        </Card>

        <Card className="session-flow">
          <ol className="session-stepper">
            {['Create', 'Perform', 'Complete'].map((label, index) => (
              <li
                key={label}
                className={
                  activeStep > index || (activeStep === index && session?.status === 'completed')
                    ? 'is-done'
                    : activeStep === index
                      ? 'is-active'
                      : ''
                }
              >
                <span className="session-stepper__dot">
                  {activeStep > index ? <CheckCircle2 size={14} /> : index + 1}
                </span>
                {label}
              </li>
            ))}
          </ol>

          {error && <Alert variant="error">{error}</Alert>}

          {!session && (
            <div className="session-panel">
              <h3>Ready to Begin?</h3>
              <p>Create a rehabilitation session for this assigned exercise.</p>
              <Button onClick={createSession} loading={isCreating} icon={<PlayCircle size={16} />}>
                Create Session
              </Button>
            </div>
          )}

          {session && session.status === 'created' && (
            <div className="session-panel">
              <h3>Session Created</h3>
              <p>
                Session <strong>#{session.id}</strong> is ready. Position yourself in front of
                your camera, full body visible, then begin when set.
              </p>
              <Button onClick={beginRehabilitation} loading={isStarting} icon={<PlayCircle size={16} />}>
                Begin Rehabilitation
              </Button>
            </div>
          )}

          {session && session.status === 'started' && (
            <div className="session-panel">
              <div className="session-live-indicator">
                <span className="session-live-dot" />
                Session #{session.id} in progress
              </div>

              <p>
                Aurevia's AI is tracking your joints live through your camera and counting
                reps automatically.
              </p>

              <p className="session-panel__disclosure">
                Only joint-angle measurements (no video or images) from this session may be
                used, in de-identified form, to help improve Aurevia's exercise-evaluation AI.
              </p>

              {liveStats && (
                <div className="live-stats">
                  <div>
                    <span className="live-stats__value">{liveStats.reps ?? 0}</span>
                    <span className="live-stats__label">Reps</span>
                  </div>
                  <div>
                    <span className="live-stats__value">{liveStats.correctReps ?? 0}</span>
                    <span className="live-stats__label">Correct</span>
                  </div>
                  <div>
                    <span className="live-stats__value">{liveStats.incorrectReps ?? 0}</span>
                    <span className="live-stats__label">Off-form</span>
                  </div>
                </div>
              )}

              <Button onClick={completeSession} loading={isCompleting} variant="energy" icon={<CheckCircle2 size={16} />}>
                Finish Session
              </Button>
            </div>
          )}

          {session && session.status === 'completed' && (
            <div className="session-panel">
              <h3>Session Completed</h3>
              <p>
                Completed at{' '}
                {session.completed_at
                  ? new Date(session.completed_at).toLocaleString()
                  : 'not available'}
                .
              </p>

              {!resultSubmitted ? (
                <>
                  {finalResult ? (
                    <div className="live-stats live-stats--summary">
                      <div>
                        <span className="live-stats__value">{finalResult.repetitions}</span>
                        <span className="live-stats__label">Total Reps</span>
                      </div>
                      <div>
                        <span className="live-stats__value">{finalResult.accuracy}%</span>
                        <span className="live-stats__label">Accuracy</span>
                      </div>
                    </div>
                  ) : (
                    <p className="session-panel__note">
                      No AI tracking data was captured — camera may not have been active.
                    </p>
                  )}

                  <Button
                    onClick={submitResult}
                    loading={isSubmittingResult}
                    icon={<Award size={16} />}
                  >
                    Submit AI Result
                  </Button>
                </>
              ) : (
                <>
                  <Alert variant="success">Result saved successfully.</Alert>
                  <Link to="/sessions">
                    <Button variant="secondary">View Session History</Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default ExerciseSession;
