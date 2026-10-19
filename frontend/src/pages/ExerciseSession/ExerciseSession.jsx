import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const existingSessionId = searchParams.get('session_id');
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
  const [trainingConsent, setTrainingConsent] = useState(false);
  const [includePatientCheckIn, setIncludePatientCheckIn] = useState(false);
  const [discomfortRating, setDiscomfortRating] = useState(0);
  const [effortRating, setEffortRating] = useState(5);
  const [patientNote, setPatientNote] = useState('');
  const [startCountdown, setStartCountdown] = useState(null);
  const [completedSets, setCompletedSets] = useState(0);
  const [resting, setResting] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadAssignment() {
      try {
        const [response, sessionResponse] = await Promise.all([
          api.get(`/assignments/${assignmentId}`),
          existingSessionId ? api.get(`/sessions/${existingSessionId}`) : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        setAssignment(response.data.assignment);
        if (sessionResponse) {
          const existingSession = sessionResponse.data.session;
          if (existingSession.assignment_id !== response.data.assignment.id) {
            setError('This session does not belong to the selected exercise.');
          } else if (!['created', 'started'].includes(existingSession.status)) {
            setError('This session is already complete. Start a new session from your assigned exercises.');
          } else {
            setSession(existingSession);
            setTrainingConsent(Boolean(existingSession.movement_recording_consent));
          }
        }
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
  }, [assignmentId, existingSessionId]);

  async function createSession() {
    if (!assignment) return;

    setIsCreating(true);
    setError('');

    try {
      const response = await api.post('/sessions', {
        assignment_id: assignment.id,
      });

      setSession(response.data.session);
      setSearchParams({ session_id: response.data.session.id }, { replace: true });
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
      for (let count = 3; count > 0; count -= 1) {
        setStartCountdown(count);
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
      }
      setStartCountdown(null);
      const response = await api.patch(`/sessions/${session.id}`, {
        status: 'started',
        movement_recording_consent: trainingConsent,
      });

      setSession(response.data.session);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          'Unable to start rehabilitation session.',
      );
    } finally {
      setStartCountdown(null);
      setIsStarting(false);
    }
  }

  function handleLiveUpdate(stats) {
    setLiveStats(stats);
    if (!session || session.status !== 'started' || resting) return;
    const targetReps = Math.max(1, assignment?.target_reps || 10);
    const targetSets = Math.max(1, assignment?.target_sets || 1);
    const setCount = Math.min(targetSets, Math.floor((stats.reps || 0) / targetReps));
    if (setCount > completedSets) {
      setCompletedSets(setCount);
      if (setCount < targetSets && assignment?.rest_seconds > 0) {
        setRestRemaining(assignment.rest_seconds);
        setResting(true);
      }
    }
  }

  useEffect(() => {
    if (!resting) return undefined;
    const timer = window.setTimeout(() => {
      if (restRemaining <= 1) {
        setRestRemaining(0);
        setResting(false);
      } else {
        setRestRemaining(restRemaining - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resting, restRemaining]);

  async function completeSession() {
    if (!session) return;

    setResting(false);
    setRestRemaining(0);
    setIsCompleting(true);
    setError('');

    // Capture the AI-tracked summary the moment the patient finishes,
    // including any in-flight per-repetition model predictions.
    const summary = await poseCameraRef.current?.getSummary();
    if (summary) {
      setFinalResult(summary);
    }

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

  async function withdrawRecordingConsent() {
    try {
      await api.patch(`/sessions/${session.id}`, {
        status: 'started',
        movement_recording_consent: false,
      });
      setTrainingConsent(false);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to update your recording preference.');
    }
  }

  async function submitResult() {
    if (!session || session.status !== 'completed') return;

    setIsSubmittingResult(true);
    setError('');

    const resultData = {
      ...(finalResult || {}),
      ...(includePatientCheckIn ? {
        patient_check_in: {
          discomfort_rating: Number(discomfortRating),
          effort_rating: Number(effortRating),
          note: patientNote.trim(),
        },
      } : {}),
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
  const targetSetCount = Math.max(1, assignment.target_sets || 1);
  const targetRepCount = Math.max(1, assignment.target_reps || 10);
  const repsInSet = resting || completedSets >= targetSetCount
    ? targetRepCount
    : (liveStats?.reps || 0) % targetRepCount;

  return (
    <div className="exercise-session">
      <Link to="/patient/exercises" className="session-back-link">
        <ChevronLeft size={16} /> Back to Exercises
      </Link>

      <div className="session-hero">
        <h1>{exercise.name}</h1>
        <p>Your rehabilitation exercise session. AI feedback supports movement practice; it does not diagnose or replace your therapist.</p>
      </div>

      <div className="session-layout">
        <Card className="session-details">
          <h2>Exercise Details</h2>
          <p className="session-details__description">{exercise.description}</p>
          {assignment.instructions && <div className="session-plan-cue"><strong>Your therapist’s cue</strong><p>{assignment.instructions}</p></div>}

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
                active={isLive && !isCompleting && !resting}
                onUpdate={handleLiveUpdate}
                sessionId={session.id}
                logRecordings={trainingConsent}
                paused={resting}
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
              <label className="session-consent">
                <input
                  type="checkbox"
                  checked={trainingConsent}
                  onChange={(event) => setTrainingConsent(event.target.checked)}
                />
                <span>
                  <strong>Help improve Aurevia (optional)</strong>
                  <small>
                     Save joint-angle repetitions linked to this session for therapist review and possible AI improvements.
                    Your camera video stays on this device. Live prediction still works if you leave this unchecked.
                  </small>
                </span>
              </label>
              <Button onClick={beginRehabilitation} loading={isStarting} icon={<PlayCircle size={16} />}>
                {startCountdown ? `Get ready · ${startCountdown}` : 'Begin Rehabilitation'}
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

              <div className="session-set-progress" role="status" aria-live="polite">
                <strong>Set {Math.min(completedSets + 1, targetSetCount)} of {targetSetCount}</strong>
                <span>{repsInSet} of {targetRepCount} reps this set</span>
              </div>

              {resting && <div className="session-rest-card" role="status" aria-live="assertive"><Timer size={20} /><div><strong>Rest and reset</strong><span>Next set in {restRemaining} seconds. Take a comfortable breath.</span></div></div>}

              <p className="session-panel__disclosure">
                Your camera video is processed on this device. Joint angles are sent to Aurevia for live exercise analysis.
                {trainingConsent ? ' You opted in to saving joint-angle repetitions linked to this session for therapist review and possible AI improvement.' : ' Repetitions are not saved for AI training.'}
              </p>
              {trainingConsent && <button type="button" className="session-consent-withdraw" onClick={withdrawRecordingConsent}>Stop saving repetitions for AI improvement</button>}

              {liveStats && (
                <div className="live-stats">
                  <div>
                    <span className="live-stats__value">{liveStats.reps ?? 0}</span>
                    <span className="live-stats__label">Reps</span>
                  </div>
                  <div>
                    <span className="live-stats__value">{liveStats.correctReps ?? 0}</span>
                    <span className="live-stats__label">Range correct</span>
                  </div>
                  <div>
                    <span className="live-stats__value">{liveStats.incorrectReps ?? 0}</span>
                    <span className="live-stats__label">Range incomplete</span>
                  </div>
                  {liveStats.aiPredictions > 0 && (
                    <div>
                      <span className="live-stats__value">{liveStats.aiCorrectReps}/{liveStats.aiPredictions}</span>
                      <span className="live-stats__label">LSTM correct</span>
                    </div>
                  )}
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
                    <>
                      <div className="live-stats live-stats--summary">
                        <div>
                          <span className="live-stats__value">{finalResult.repetitions}</span>
                          <span className="live-stats__label">Total Reps</span>
                        </div>
                        <div>
                          <span className="live-stats__value">{finalResult.accuracy}%</span>
                          <span className="live-stats__label">AI-labeled correct reps</span>
                        </div>
                      </div>
                      <p className="session-analysis-note">
                        {finalResult.analysis_source === 'lstm'
                          ? 'Analysis source: LSTM model.'
                          : finalResult.analysis_source === 'heuristic'
                            ? 'Analysis source: pose-based estimate.'
                            : 'Analysis source not recorded.'}{' '}
                        This is an estimate, not a clinical measure.
                      </p>
                    </>
                  ) : (
                    <p className="session-panel__note">
                      No AI tracking data was captured — camera may not have been active.
                    </p>
                  )}

                  <div className="session-checkin">
                    <label className="session-checkin__toggle"><input type="checkbox" checked={includePatientCheckIn} onChange={(event) => setIncludePatientCheckIn(event.target.checked)} /><span><strong>Share an optional check-in with your therapist</strong><small>Your answers are your own report and are separate from Aurevia’s movement analysis. You can skip this.</small></span></label>
                    {includePatientCheckIn && <div className="session-checkin__fields">
                      <label><span>Discomfort after the exercise <strong>{discomfortRating}/10</strong></span><input type="range" min="0" max="10" step="1" value={discomfortRating} onChange={(event) => setDiscomfortRating(event.target.value)} /><small><span>None</span><span>Very strong</span></small></label>
                      <label><span>How hard the exercise felt <strong>{effortRating}/10</strong></span><input type="range" min="0" max="10" step="1" value={effortRating} onChange={(event) => setEffortRating(event.target.value)} /><small><span>Very easy</span><span>Very hard</span></small></label>
                      <label className="session-checkin__note">Optional note<textarea rows="2" maxLength="1000" value={patientNote} onChange={(event) => setPatientNote(event.target.value)} placeholder="Anything you want your therapist to know?" /></label>
                    </div>}
                  </div>

                  <Button
                    onClick={submitResult}
                    loading={isSubmittingResult}
                    icon={<Award size={16} />}
                  >
                    {finalResult ? 'Save session result' : 'Save session details'}
                  </Button>
                </>
              ) : (
                <>
                  <Alert variant="success">
                    {finalResult
                      ? 'Session result saved successfully.'
                      : 'Session details saved. No movement analysis was recorded.'}
                  </Alert>
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
