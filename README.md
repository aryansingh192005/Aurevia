# Aurevia

Aurevia is a web-based telerehabilitation prototype for patients and therapists. Patients follow therapist-assigned exercises, use a webcam for live pose tracking, receive repetition and range-of-motion feedback, and review their session history. Therapists can assign exercises, review patient session results, inspect repetition sequences, and label reviewed examples for future model training.

## What is implemented

- React application with patient and therapist workspaces.
- Flask API with role-aware authentication, exercise assignments, sessions, progress history, and therapist review endpoints.
- MySQL support for persistent deployment and SQLite as the zero-configuration local-development fallback.
- Database migrations managed by Flask-Migrate/Alembic.
- In-browser MediaPipe pose tracking. Camera frames stay in the browser; the app sends derived 8-angle sequences to the API when repetition recording is enabled.
- A trained LSTM model at `ai/models/lstm/exercise_quality_lstm.keras`, expecting 30 frames by 8 angles in the documented feature order.
- A Docker Compose deployment with MySQL, the API, and the static web app.

## Requirements

For local development, install Python 3.11 or newer, Node.js 22, and npm. MySQL is optional for local use: when `AUREVIA_DATABASE_URL` is blank, the API uses `backend/instance/aurevia.db`. Docker Desktop with Compose is needed for the containerized stack.

## Run locally on Windows

From the repository root, create and install the Python environment:

```powershell
py -3.11 -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Copy `.env.example` to `.env` if you do not already have a local `.env`. Set `AUREVIA_SECRET_KEY` to a private random value. To use MySQL, set `AUREVIA_DATABASE_URL`, for example:

```text
mysql+pymysql://aurevia:your-password@127.0.0.1:3306/aurevia
```

Do not commit `.env`. With no database URL, the local SQLite database is created automatically when the API first accesses it.

Apply migrations and (optionally) load demo data:

```powershell
cd backend
.\.venv\Scripts\python.exe -m flask --app run:app db upgrade
.\.venv\Scripts\python.exe seed.py
```

The demo seed is for local development only. It creates `patient@aurevia.test` and `therapist@aurevia.test`, both with password `Password123`, plus sample exercises. **Never use these demo accounts on an internet-facing deployment.**

Start the API in one terminal:

```powershell
.\.venv\Scripts\python.exe run.py
```

In a second terminal, start the web app:

```powershell
cd ..\frontend
npm ci
npm run dev
```

Open the Vite URL printed in the terminal. The frontend proxies `/api` requests to `http://127.0.0.1:5000`. Camera access works on localhost or on an HTTPS site. The Vite scripts copy MediaPipe WASM and the pose model from the checked-in project assets into ignored `frontend/public` folders before starting/building; do not add those generated copies to Git.

## Deploy with Docker Compose

Create a separate deployment environment file and replace every placeholder with private values. Generate a different random value for the secret key and therapist invitation code (at least 32 and 24 characters respectively). Use long, distinct alphanumeric values for the database passwords because the database URL is assembled from them.

```powershell
Copy-Item .env.docker.example .env.docker
```

You can generate random values in PowerShell with `python -c "import secrets; print(secrets.token_urlsafe(48))"`. Generate and copy a separate value for each secret.

Then build and start the stack:

```powershell
docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker ps
```

The web app is available at `http://localhost:8080` by default (change `AUREVIA_HTTP_PORT` to choose another local port). The API applies migrations during startup, waits for MySQL readiness, and exposes `/api/health` and `/api/health/ready`. MySQL data persists in the `aurevia_mysql` volume. Back up that volume and test restoring it before relying on it for real records.

For public internet access, put the stack behind an HTTPS reverse proxy, restrict who can reach the container ports, configure backups and monitoring, and use secrets managed by your hosting platform. The Compose file is a deployable single-host starting point; it does not provision a domain, TLS certificate, cloud database, or production operations plan.

### Therapist account setup

Patient registration is public. Therapist self-registration is protected by `AUREVIA_THERAPIST_REGISTRATION_CODE`. Set a private code in `.env` (local) or `.env.docker` (Compose) and share it only with intended therapists. Leave it unset to disable self-registration. An administrator can create a therapist directly from a trusted terminal without enabling public therapist registration:

```powershell
cd backend
.\.venv\Scripts\python.exe create_therapist.py
```

For the Docker deployment, use `docker compose --env-file .env.docker exec backend python create_therapist.py`. The password is entered without echoing it and is never printed. Never expose an invitation code in client-side code or commit it.

## AI and data contract

Every LSTM input is exactly 30 temporal frames by 8 joint angles. Preserve this order in training, browser preprocessing, exports, and inference:

1. `left_elbow_angle`
2. `right_elbow_angle`
3. `left_shoulder_angle`
4. `right_shoulder_angle`
5. `left_hip_angle`
6. `right_hip_angle`
7. `left_knee_angle`
8. `right_knee_angle`

The shipped LSTM is a binary correct/incorrect classifier. It is not a general exercise recognizer, a diagnostic system, or a validated clinical assessment. The benchmark training data covers a limited set of gestures, so performance on other movements can be weaker. The app uses a transparent range-of-motion heuristic for live rep counting and keeps model predictions separately. Treat scores as informational feedback and use therapist judgment for care decisions.

The camera feed is processed in the browser and is not uploaded. Completed repetitions send derived joint-angle sequences to the API when the LSTM is available, so it can return live predictions. Separately, patients can opt in before a session to store those sequences and heuristic labels with their session for therapist review and possible training export; that stored data is linked to the patient account. Session summaries are saved when submitted. Do not enter real patient information until your hosting, consent, access, retention, backup, and applicable privacy requirements are in place.

## Tests and production build

From the repository root:

```powershell
backend\.venv\Scripts\python.exe -m pytest -q
```

From `frontend`:

```powershell
npm run build
npm run lint
```

The LSTM contract tests do not measure clinical model quality. A real-camera check still requires a browser with webcam permission, a running API and database, and an exercise assignment for the patient. Check `/api/ai/status` after signing in to confirm the backend reports the model as available.

## Project map

- `frontend/src` — React screens, API client, and browser-side pose analysis.
- `backend/app` — Flask routes, models, authentication, and configuration.
- `backend/migrations` — schema history.
- `ai/features`, `ai/preprocessing`, `ai/inference`, `ai/training` — model contract and lifecycle.
- `ai/models` — checked-in LSTM and pose landmarker model assets.
- `tests` — backend, preprocessing, feature, and model-contract tests.
- `deploy` and `Dockerfile.*` — static web server and container deployment files.
