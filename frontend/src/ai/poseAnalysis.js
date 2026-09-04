// Mirrors ai/features/pose_features.py and ai/features/landmark_features.py
// so the browser computes the same 8-dimensional joint-angle feature vector
// as Aurevia's Python prototype, using MediaPipe Pose landmark indices.

export const LANDMARKS = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

// Pairs used to draw a simplified skeleton overlay.
export const SKELETON_EDGES = [
  [LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER],
  [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_ELBOW],
  [LANDMARKS.LEFT_ELBOW, LANDMARKS.LEFT_WRIST],
  [LANDMARKS.RIGHT_SHOULDER, LANDMARKS.RIGHT_ELBOW],
  [LANDMARKS.RIGHT_ELBOW, LANDMARKS.RIGHT_WRIST],
  [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_HIP],
  [LANDMARKS.RIGHT_SHOULDER, LANDMARKS.RIGHT_HIP],
  [LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP],
  [LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE],
  [LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE],
  [LANDMARKS.RIGHT_HIP, LANDMARKS.RIGHT_KNEE],
  [LANDMARKS.RIGHT_KNEE, LANDMARKS.RIGHT_ANKLE],
];

/**
 * Calculate the angle ABC in degrees, where B is the vertex.
 * Ports pose_features.calculate_angle exactly (3D vectors, dot product).
 */
export function calculateAngle(a, b, c) {
  if (!a || !b || !c) return NaN;

  const ba = [a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0)];
  const bc = [c.x - b.x, c.y - b.y, (c.z ?? 0) - (b.z ?? 0)];

  const magBa = Math.sqrt(ba[0] ** 2 + ba[1] ** 2 + ba[2] ** 2);
  const magBc = Math.sqrt(bc[0] ** 2 + bc[1] ** 2 + bc[2] ** 2);

  if (magBa === 0 || magBc === 0) return NaN;

  const dot = ba[0] * bc[0] + ba[1] * bc[1] + ba[2] * bc[2];
  let cosine = dot / (magBa * magBc);
  cosine = Math.max(-1, Math.min(1, cosine));

  return (Math.acos(cosine) * 180) / Math.PI;
}

function angleAt(landmarks, aIdx, bIdx, cIdx) {
  return calculateAngle(landmarks[aIdx], landmarks[bIdx], landmarks[cIdx]);
}

/**
 * Extract the same 8-dimensional joint-angle feature vector as
 * ai/features/landmark_features.extract_joint_angles.
 */
export function extractJointAngles(landmarks) {
  const L = LANDMARKS;

  return {
    left_elbow_angle: angleAt(landmarks, L.LEFT_SHOULDER, L.LEFT_ELBOW, L.LEFT_WRIST),
    right_elbow_angle: angleAt(landmarks, L.RIGHT_SHOULDER, L.RIGHT_ELBOW, L.RIGHT_WRIST),
    left_shoulder_angle: angleAt(landmarks, L.LEFT_ELBOW, L.LEFT_SHOULDER, L.LEFT_HIP),
    right_shoulder_angle: angleAt(landmarks, L.RIGHT_ELBOW, L.RIGHT_SHOULDER, L.RIGHT_HIP),
    left_hip_angle: angleAt(landmarks, L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_KNEE),
    right_hip_angle: angleAt(landmarks, L.RIGHT_SHOULDER, L.RIGHT_HIP, L.RIGHT_KNEE),
    left_knee_angle: angleAt(landmarks, L.LEFT_HIP, L.LEFT_KNEE, L.LEFT_ANKLE),
    right_knee_angle: angleAt(landmarks, L.RIGHT_HIP, L.RIGHT_KNEE, L.RIGHT_ANKLE),
  };
}

// Maps an exercise's target_area to the primary joint-angle metric(s) used
// for rep counting, plus the angle range that defines a full, correct rep.
const AREA_PROFILES = {
  arm: { metrics: ['left_elbow_angle', 'right_elbow_angle'], downAngle: 70, upAngle: 160 },
  elbow: { metrics: ['left_elbow_angle', 'right_elbow_angle'], downAngle: 70, upAngle: 160 },
  shoulder: { metrics: ['left_shoulder_angle', 'right_shoulder_angle'], downAngle: 25, upAngle: 130 },
  hip: { metrics: ['left_hip_angle', 'right_hip_angle'], downAngle: 90, upAngle: 165 },
  knee: { metrics: ['left_knee_angle', 'right_knee_angle'], downAngle: 90, upAngle: 165 },
  leg: { metrics: ['left_knee_angle', 'right_knee_angle'], downAngle: 90, upAngle: 165 },
  default: { metrics: ['left_elbow_angle', 'right_elbow_angle'], downAngle: 70, upAngle: 160 },
};

export function getAreaProfile(targetArea) {
  if (!targetArea) return AREA_PROFILES.default;

  const key = targetArea.toLowerCase();

  const match = Object.keys(AREA_PROFILES).find((profileKey) => key.includes(profileKey));

  return AREA_PROFILES[match] || AREA_PROFILES.default;
}

// Fixed-length feature order every logged sequence uses, matching
// backend/app/models/movement_recording.py MovementRecording.FEATURE_NAMES.
export const FEATURE_ORDER = [
  'left_elbow_angle',
  'right_elbow_angle',
  'left_shoulder_angle',
  'right_shoulder_angle',
  'left_hip_angle',
  'right_hip_angle',
  'left_knee_angle',
  'right_knee_angle',
];

// Every logged rep is resampled to this many frames before being sent to
// the backend, so every training example has the same fixed shape
// regardless of how long the rep actually took (matches how public rehab
// datasets like UI-PRMD/KIMORE are typically prepared for an LSTM).
export const RECORDING_SEQUENCE_LENGTH = 30;

/**
 * Linearly resample a variable-length list of frames (each a plain
 * {feature: value} object) to a fixed number of frames, and flatten each
 * frame to FEATURE_ORDER. Missing/non-finite values are filled with 0 so a
 * single tracking dropout frame doesn't poison the whole sequence.
 */
export function resampleSequence(frames, targetLength = RECORDING_SEQUENCE_LENGTH) {
  if (frames.length === 0) return [];

  const toVector = (frame) =>
    FEATURE_ORDER.map((key) => (Number.isFinite(frame[key]) ? frame[key] : 0));

  if (frames.length === 1) {
    return Array.from({ length: targetLength }, () => toVector(frames[0]));
  }

  const resampled = [];

  for (let i = 0; i < targetLength; i += 1) {
    const position = (i / (targetLength - 1)) * (frames.length - 1);
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.min(lowerIndex + 1, frames.length - 1);
    const weight = position - lowerIndex;

    const lower = toVector(frames[lowerIndex]);
    const upper = toVector(frames[upperIndex]);

    resampled.push(lower.map((value, idx) => value + (upper[idx] - value) * weight));
  }

  return resampled;
}

/**
 * A simple, explainable rep counter: tracks a "down" -> "up" cycle across
 * the primary joint angle(s) for the exercise's target area, and scores
 * form quality by how close the rep's range of motion came to the
 * expected range. Also buffers every frame within the current rep so a
 * completed rep can be logged as a labeled training example for a future
 * LSTM model (see onRepComplete).
 */
export class RepCounter {
  constructor(targetArea, { onRepComplete } = {}) {
    this.profile = getAreaProfile(targetArea);
    this.stage = 'up';
    this.reps = 0;
    this.correctReps = 0;
    this.incorrectReps = 0;
    this.minAngleThisRep = Infinity;
    this.maxAngleThisRep = -Infinity;
    this.lastFeedback = 'Get into position and start moving.';
    this.currentRepFrames = [];
    this.onRepComplete = onRepComplete;
  }

  primaryAngle(angles) {
    const values = this.profile.metrics
      .map((metric) => angles[metric])
      .filter((value) => Number.isFinite(value));

    if (values.length === 0) return null;

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  update(angles) {
    const angle = this.primaryAngle(angles);

    if (angle === null) {
      return { reps: this.reps, feedback: 'Make sure your full body is visible in frame.' };
    }

    this.minAngleThisRep = Math.min(this.minAngleThisRep, angle);
    this.maxAngleThisRep = Math.max(this.maxAngleThisRep, angle);
    this.currentRepFrames.push(angles);

    const { downAngle, upAngle } = this.profile;

    if (this.stage === 'up' && angle <= downAngle + 12) {
      this.stage = 'down';
      this.lastFeedback = 'Good, now extend back up.';
    } else if (this.stage === 'down' && angle >= upAngle - 12) {
      this.stage = 'up';
      this.reps += 1;

      const reachedDown = this.minAngleThisRep <= downAngle + 20;
      const reachedUp = this.maxAngleThisRep >= upAngle - 20;

      let label;

      if (reachedDown && reachedUp) {
        this.correctReps += 1;
        this.lastFeedback = 'Nice rep! Full range of motion.';
        label = 'correct';
      } else {
        this.incorrectReps += 1;
        this.lastFeedback = reachedDown
          ? 'Try extending further at the top.'
          : 'Try going deeper into the movement.';
        label = 'incorrect';
      }

      // Confidence is a simple proxy, not a model probability: how far
      // past the pass/fail threshold the rep's range of motion landed
      // (positive = comfortably past, negative = right on the edge),
      // clamped to [0.5, 1]. Used only to prioritize which reps a
      // therapist should review first — borderline reps first.
      const downMargin = downAngle - this.minAngleThisRep; // + if deep enough
      const upMargin = this.maxAngleThisRep - upAngle; // + if high enough
      const margin = Math.min(downMargin, upMargin);
      const confidence = Math.max(0.5, Math.min(1, 0.75 + margin / 60));

      this.onRepComplete?.({
        repIndex: this.reps,
        sequence: resampleSequence(this.currentRepFrames),
        label,
        confidence: Number(confidence.toFixed(2)),
      });

      this.currentRepFrames = [];
      this.minAngleThisRep = Infinity;
      this.maxAngleThisRep = -Infinity;
    }

    return {
      reps: this.reps,
      correctReps: this.correctReps,
      incorrectReps: this.incorrectReps,
      stage: this.stage,
      angle,
      feedback: this.lastFeedback,
    };
  }

  summary() {
    const totalReps = this.reps;
    const accuracy = totalReps > 0
      ? Math.round((this.correctReps / totalReps) * 100)
      : 0;

    return {
      repetitions: totalReps,
      correct_repetitions: this.correctReps,
      incorrect_repetitions: this.incorrectReps,
      accuracy,
      feedback: totalReps > 0
        ? `Completed ${totalReps} reps with ${accuracy}% form accuracy, tracked live via AI pose estimation.`
        : 'No repetitions were detected during this session.',
    };
  }
}
