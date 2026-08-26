# Aurevia Database Design

## 1. Purpose

The Aurevia database stores application-level rehabilitation data and
derived AI analysis results.

The database is not intended to store raw camera frames or every
intermediate pose feature generated during real-time analysis.

The AI pipeline processes pose data independently and stores relevant
session-level results in the application database.

---

## 2. Current AI Data Flow

Aurevia's current pose-analysis pipeline is:

Camera / Video
    ↓
MediaPipe Pose Landmarker
    ↓
Pose Landmarks
    ↓
Joint-Angle Feature Extraction
    ↓
8-dimensional Feature Vector
    ↓
30-frame Temporal Sequence
    ↓
AI Inference
    ↓
Derived Rehabilitation Result

### Current Feature Vector

The current prototype extracts eight joint-angle features:

1. left_elbow_angle
2. right_elbow_angle
3. left_shoulder_angle
4. right_shoulder_angle
5. left_hip_angle
6. right_hip_angle
7. left_knee_angle
8. right_knee_angle

### Current Temporal Representation

Aurevia currently builds fixed-length sequences containing:

- Sequence length: 30 frames
- Features per frame: 8
- Sequence shape: `(30, 8)`

These are AI-processing representations and are not currently treated
as independent database entities.

---

## 3. Database Design Principles

The database should:

- Store persistent application data.
- Store rehabilitation session metadata.
- Store exercise definitions.
- Store derived AI results.
- Support longitudinal progress tracking.
- Maintain relationships between users, exercises, sessions, and results.
- Avoid storing unnecessary raw video or frame-level data.
- Allow AI result structures to evolve as the research model develops.

The database should not assume AI outputs that have not yet been
implemented or validated.

---

## 4. Core Entities

### 4.1 Users

Stores application users.

Proposed fields:

| Field | Description |
|---|---|
| id | Unique user identifier |
| name | User's display/full name |
| email | User's unique email address |
| password_hash | Securely hashed password |
| created_at | Account creation timestamp |
| updated_at | Last account update timestamp |

Future role support may distinguish between different user types.
The exact role model will be finalized before authentication is
implemented.

---

### 4.2 Exercises

Stores the rehabilitation exercise catalogue.

Proposed fields:

| Field | Description |
|---|---|
| id | Unique exercise identifier |
| name | Exercise name |
| description | Exercise instructions/description |
| target_area | Body area targeted by the exercise |
| difficulty | Exercise difficulty level |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

The exercise entity should describe the exercise itself rather than
store temporary AI-analysis data.

---

### 4.3 Rehabilitation Sessions

Represents an individual rehabilitation session.

Proposed fields:

| Field | Description |
|---|---|
| id | Unique session identifier |
| user_id | User performing the session |
| exercise_id | Exercise performed |
| started_at | Session start timestamp |
| completed_at | Session completion timestamp |
| status | Current session lifecycle state |
| created_at | Session record creation timestamp |

### Session Relationship

Each user can have multiple rehabilitation sessions.

Each exercise can be associated with multiple rehabilitation sessions.

Conceptually:

User `1:N` RehabilitationSession

Exercise `1:N` RehabilitationSession

---

## 5. Session Results

Session results contain derived AI-analysis information associated
with a rehabilitation session.

Proposed fields:

| Field | Description |
|---|---|
| id | Unique result identifier |
| session_id | Associated rehabilitation session |
| result_type | Type/category of AI result |
| result_data | Structured result data |
| created_at | Result creation timestamp |

### Result Data Strategy

Aurevia should initially allow structured AI output to be stored as
JSON rather than prematurely creating separate database columns for
every possible metric.

This is intentional because the current AI prototype does not yet
implement validated outputs such as:

- form score
- accuracy score
- repetition count
- range-of-motion score
- clinical score

These fields should not be treated as established outputs until the
corresponding AI functionality has been implemented and validated.

Stable, validated metrics may later be promoted to dedicated database
columns if required.

---

## 6. Progress Records

Stores longitudinal rehabilitation measurements.

Proposed fields:

| Field | Description |
|---|---|
| id | Unique progress-record identifier |
| user_id | User associated with the record |
| session_id | Session that produced the measurement |
| metric_name | Name of the tracked metric |
| metric_value | Numeric value of the metric |
| recorded_at | Measurement timestamp |

This structure allows Aurevia to track validated rehabilitation
metrics over multiple sessions.

The exact metrics will be determined after the AI inference and
evaluation stages.

---

## 7. Entity Relationships

The initial relationship model is:

```text
User
 │
 ├───────────────< RehabilitationSession >─────────────── Exercise
 │                              │
 │                              │
 │                              ▼
 │                       SessionResult
 │
 └───────────────< ProgressRecord