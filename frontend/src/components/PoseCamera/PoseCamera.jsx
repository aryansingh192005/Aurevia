import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { AlertTriangle, Camera, Loader2, Timer } from 'lucide-react';

import { RepCounter, SKELETON_EDGES, extractJointAngles } from '../../ai/poseAnalysis';
import api from '../../services/api';

import './PoseCamera.css';

const WASM_BASE = '/vendor/mediapipe/wasm';
const MODEL_URL = '/models/pose_landmarker_lite.task';

/**
 * Runs live, in-browser AI pose estimation over the user's webcam feed
 * using MediaPipe Tasks Vision, draws a skeleton overlay, and drives a
 * RepCounter to produce a real result_data payload. Camera video and pose
 * estimation stay in the browser; derived joint-angle sequences can be sent
 * to the API for optional recording and live LSTM inference.
 */
const PoseCamera = forwardRef(function PoseCamera(
  { targetArea, active, onUpdate, sessionId, logRecordings = false, paused = false },
  ref,
) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const repCounterRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);
  const modelAvailableRef = useRef(false);
  const logRecordingsRef = useRef(logRecordings);
  const predictionTrackerRef = useRef({ results: [], pending: [] });
  const recordingRequestsRef = useRef([]);
  const latestUpdateRef = useRef(null);

  const [status, setStatus] = useState('loading'); // loading | ready | denied | error
  const [errorMessage, setErrorMessage] = useState('');
  const [liveFeedback, setLiveFeedback] = useState('Loading AI model...');
  const [modelAvailable, setModelAvailable] = useState(null);
  const [aiPredictions, setAiPredictions] = useState([]);

  useEffect(() => {
    logRecordingsRef.current = logRecordings;
  }, [logRecordings]);

  // Saving a training recording is opt-in. Live LSTM inference remains
  // available regardless of that choice.
  function logRep({ repIndex, sequence, label, confidence }) {
    if (logRecordingsRef.current && sessionId) {
      const recordingRequest = api
        .post(`/sessions/${sessionId}/recordings`, {
          rep_index: repIndex,
          sequence,
          heuristic_label: label,
          heuristic_confidence: confidence,
        })
        .catch(() => {
          // Training-data logging must never interrupt a live session.
        });
      recordingRequestsRef.current.push(recordingRequest);
    }

    if (!modelAvailableRef.current || !sessionId) return;

    const predictionRequest = api
      .post(`/sessions/${sessionId}/predict`, { sequence })
      .then(({ data }) => {
        predictionTrackerRef.current.results.push(data.prediction);
        const predictions = predictionTrackerRef.current.results;
        setAiPredictions([...predictions]);
        if (latestUpdateRef.current) {
          onUpdate?.({
            ...latestUpdateRef.current,
            aiPredictions: predictions.length,
            aiCorrectReps: predictions.filter((item) => item.label === 'correct').length,
            aiIncorrectReps: predictions.filter((item) => item.label === 'incorrect').length,
          });
        }
      })
      .catch(() => {
        // Continue using the movement-range heuristic if inference fails.
      });

    predictionTrackerRef.current.pending.push(predictionRequest);
  }

  // Load the pose landmarker model once.
  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_BASE);

        const options = {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: 'VIDEO',
          numPoses: 1,
        };
        let landmarker;
        try {
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            ...options,
            baseOptions: { ...options.baseOptions, delegate: 'GPU' },
          });
        } catch {
          landmarker = await PoseLandmarker.createFromOptions(vision, options);
        }

        if (cancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        try {
          const response = await api.get('/ai/status');
          modelAvailableRef.current = Boolean(response.data.available);
          setModelAvailable(modelAvailableRef.current);
        } catch {
          modelAvailableRef.current = false;
          setModelAvailable(false);
        }
        repCounterRef.current = new RepCounter(targetArea, { onRepComplete: logRep });
        setStatus('ready');
      } catch (setupError) {
        if (cancelled) return;
        setStatus('error');
        setErrorMessage(
          setupError?.message || 'Unable to load the AI pose model in this browser.',
        );
      }
    }

    setup();

    return () => {
      cancelled = true;
      landmarkerRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start/stop the webcam + detection loop based on `active`.
  useEffect(() => {
    if (status !== 'ready') return undefined;

    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();

        detectLoop();
      } catch {
        if (cancelled) return;
        setStatus('denied');
      }
    }

    function detectLoop() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || !canvas || !landmarker || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(detectLoop);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      const result = landmarker.detectForVideo(video, performance.now());

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const landmarks = result.landmarks?.[0];

      if (landmarks) {
        drawSkeleton(ctx, landmarks, canvas.width, canvas.height);

        const angles = extractJointAngles(landmarks);
        const update = repCounterRef.current.update(angles);
        latestUpdateRef.current = update;

        setLiveFeedback(update.feedback);
        const predictions = predictionTrackerRef.current.results;
        onUpdate?.({
          ...update,
          aiPredictions: predictions.length,
          aiCorrectReps: predictions.filter((item) => item.label === 'correct').length,
          aiIncorrectReps: predictions.filter((item) => item.label === 'incorrect').length,
        });
      } else {
        setLiveFeedback('Step back so your full body is visible.');
      }

      rafRef.current = requestAnimationFrame(detectLoop);
    }

    if (active) {
      startCamera();
    }

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, active]);

  function drawSkeleton(ctx, landmarks, width, height) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#7e14ff';

    SKELETON_EDGES.forEach(([aIdx, bIdx]) => {
      const a = landmarks[aIdx];
      const b = landmarks[bIdx];
      if (!a || !b) return;

      ctx.beginPath();
      ctx.moveTo(a.x * width, a.y * height);
      ctx.lineTo(b.x * width, b.y * height);
      ctx.stroke();
    });

    ctx.fillStyle = '#47bfff';
    landmarks.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  useImperativeHandle(ref, () => ({
    getSummary: async () => {
      await Promise.allSettled([
        ...predictionTrackerRef.current.pending,
        ...recordingRequestsRef.current,
      ]);
      const heuristic = repCounterRef.current?.summary();
      if (!heuristic) return null;

      const predictions = predictionTrackerRef.current.results;
      if (predictions.length === heuristic.repetitions && predictions.length > 0) {
        const correct = predictions.filter((item) => item.label === 'correct').length;
        const accuracy = Math.round((correct / predictions.length) * 100);
        return {
          repetitions: predictions.length,
          correct_repetitions: correct,
          incorrect_repetitions: predictions.length - correct,
          accuracy,
          analysis_source: 'lstm',
          feedback: `LSTM analysis: ${correct} of ${predictions.length} repetitions classified as correct.`,
        };
      }

      return { ...heuristic, analysis_source: 'heuristic' };
    },
  }));

  return (
    <div className="pose-camera">
      <div className="pose-camera__stage">
        <video ref={videoRef} className="pose-camera__video" muted playsInline />
        <canvas ref={canvasRef} className="pose-camera__canvas" />

        {status === 'loading' && (
          <div className="pose-camera__overlay">
            <Loader2 size={28} className="pose-camera__spin" />
            <p>Loading AI pose model...</p>
          </div>
        )}

        {status === 'denied' && (
          <div className="pose-camera__overlay">
            <Camera size={28} />
            <p>Camera access was denied. Allow camera permissions to enable live tracking.</p>
            <button type="button" onClick={() => setStatus('ready')}>
              Try camera again
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="pose-camera__overlay">
            <AlertTriangle size={28} />
            <p>{errorMessage}</p>
          </div>
        )}

        {status === 'ready' && !active && (
          <div className="pose-camera__overlay pose-camera__overlay--dim">
            {paused ? <Timer size={28} /> : <Camera size={28} />}
            <p>{paused ? 'Rest break. The camera is paused; resume when the timer ends.' : 'Camera will start once you begin the exercise.'}</p>
          </div>
        )}
      </div>

      {status === 'ready' && active && (
        <>
          <div className="pose-camera__feedback">{liveFeedback}</div>
          {modelAvailable === false && (
            <div className="pose-camera__feedback">
              Trained LSTM unavailable; using movement-range feedback.
            </div>
          )}
          {modelAvailable && aiPredictions.length > 0 && (
            <div className="pose-camera__feedback">
              LSTM predictions received: {aiPredictions.length}
            </div>
          )}
        </>
      )}
    </div>
  );
});

export default PoseCamera;
