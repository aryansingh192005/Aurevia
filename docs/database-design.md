# Aurevia data model

Aurevia persists account, prescription, exercise-session, progress, and therapist-reviewed movement data. Schema changes are versioned under `backend/migrations/versions` and applied with `flask db upgrade`.

## Stored entities

- **Users** have a patient or therapist role, a unique email, a password hash, and timestamps.
- **Exercises** are shared definitions with a name, instructions, target area, and difficulty. Read access is public; creation requires an authenticated therapist.
- **Exercise assignments** connect a therapist, patient, and exercise, with target sets/repetitions and an active/paused/completed status.
- **Rehabilitation sessions** belong to a patient and exercise and move through `created → started → completed`.
- **Session results** contain one submitted session summary as JSON. Numeric summary metrics are also written as progress records.
- **Movement recordings** store an opt-in, completed repetition as a JSON sequence, its heuristic label, and an optional therapist-reviewed label. Recording sequences have exactly 30 frames and 8 values per frame.

## Movement-data contract

Each movement sequence has shape `(30, 8)`, ordered as follows:

1. `left_elbow_angle`
2. `right_elbow_angle`
3. `left_shoulder_angle`
4. `right_shoulder_angle`
5. `left_hip_angle`
6. `right_hip_angle`
7. `left_knee_angle`
8. `right_knee_angle`

The browser sends a sequence to the API for LSTM inference when the model is available. It stores a separate training recording only when the patient opts in. The raw camera feed is not stored or sent by the browser pose pipeline. Stored sequences remain linked to a patient session; the current database does not anonymize them automatically.

## Access scope

Patients can access their own assignments, sessions, results, and progress. A therapist can access the sessions, results, and movement recordings of patients with an assignment from that therapist for the relevant exercise. Therapist account creation is protected by an administrator-managed invitation code. Exercise definitions are shared across therapists.

## Data lifecycle and operations

The API does not currently expose patient self-service data export/deletion or an automatic retention schedule. Production operators must define retention, backup, restore, and deletion procedures before using real patient data. Database backups contain sensitive records and must be protected accordingly.
