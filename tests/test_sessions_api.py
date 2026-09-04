import sys
from pathlib import Path

import pytest
from werkzeug.security import generate_password_hash

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1] / "backend"),
)

from app import create_app
from app.extensions import db
from app.models import Exercise, ExerciseAssignment, User


@pytest.fixture()
def app():
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        }
    )

    with app.app_context():
        db.session.remove()
        db.drop_all()
        db.create_all()

        yield app

        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def assignment_and_credentials(app):
    """Creates a therapist, a patient, an exercise, and an active
    assignment between them. Returns the assignment id plus the patient's
    login credentials, since /api/sessions requires an authenticated
    patient and an assignment_id (not a raw exercise_id)."""

    with app.app_context():
        therapist = User(
            name="Dr Therapist",
            email="therapist@example.com",
            password_hash=generate_password_hash("password123"),
            role="therapist",
        )

        patient = User(
            name="Session Patient",
            email="session@example.com",
            password_hash=generate_password_hash("password123"),
            role="patient",
        )

        exercise = Exercise(
            name="Shoulder Flexion",
            description="Controlled shoulder flexion exercise.",
            target_area="Shoulder",
            difficulty="Beginner",
        )

        db.session.add_all([therapist, patient, exercise])
        db.session.commit()

        assignment = ExerciseAssignment(
            patient_id=patient.id,
            therapist_id=therapist.id,
            exercise_id=exercise.id,
            target_sets=3,
            target_reps=10,
            status="active",
        )

        db.session.add(assignment)
        db.session.commit()

        return assignment.id, patient.email, "password123"


@pytest.fixture()
def logged_in_client(client, assignment_and_credentials):
    """A test client authenticated as the patient who owns the assignment."""

    _, email, password = assignment_and_credentials

    login_response = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )

    assert login_response.status_code == 200

    return client


def test_get_sessions_empty(logged_in_client):
    response = logged_in_client.get("/api/sessions")

    assert response.status_code == 200
    assert response.get_json() == {
        "sessions": [],
    }


def test_get_sessions_requires_auth(client):
    response = client.get("/api/sessions")

    assert response.status_code == 401


def test_create_session(logged_in_client, assignment_and_credentials):
    assignment_id, _, _ = assignment_and_credentials

    response = logged_in_client.post(
        "/api/sessions",
        json={"assignment_id": assignment_id},
    )

    assert response.status_code == 201

    data = response.get_json()

    assert data["session"]["id"] == 1
    assert data["session"]["status"] == "created"
    assert data["session"]["started_at"] is None
    assert data["session"]["completed_at"] is None


def test_create_session_requires_assignment_id(logged_in_client):
    response = logged_in_client.post(
        "/api/sessions",
        json={},
    )

    assert response.status_code == 400
    assert response.get_json() == {
        "error": "assignment_id is required",
    }


def test_create_session_rejects_unknown_assignment(logged_in_client):
    response = logged_in_client.post(
        "/api/sessions",
        json={"assignment_id": 999},
    )

    assert response.status_code == 404
    assert response.get_json() == {
        "error": "Assignment not found",
    }


def test_get_existing_session(logged_in_client, assignment_and_credentials):
    assignment_id, _, _ = assignment_and_credentials

    create_response = logged_in_client.post(
        "/api/sessions",
        json={"assignment_id": assignment_id},
    )

    session_id = create_response.get_json()["session"]["id"]

    response = logged_in_client.get(f"/api/sessions/{session_id}")

    assert response.status_code == 200

    data = response.get_json()

    assert data["session"]["id"] == session_id
    assert data["session"]["status"] == "created"


def test_get_nonexistent_session(logged_in_client):
    response = logged_in_client.get("/api/sessions/999")

    assert response.status_code == 404


def test_start_session(logged_in_client, assignment_and_credentials):
    assignment_id, _, _ = assignment_and_credentials

    create_response = logged_in_client.post(
        "/api/sessions",
        json={"assignment_id": assignment_id},
    )

    session_id = create_response.get_json()["session"]["id"]

    response = logged_in_client.patch(
        f"/api/sessions/{session_id}",
        json={"status": "started"},
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["session"]["status"] == "started"
    assert data["session"]["started_at"] is not None
    assert data["session"]["completed_at"] is None


def test_complete_session_sets_timestamps(logged_in_client, assignment_and_credentials):
    assignment_id, _, _ = assignment_and_credentials

    create_response = logged_in_client.post(
        "/api/sessions",
        json={"assignment_id": assignment_id},
    )

    session_id = create_response.get_json()["session"]["id"]

    response = logged_in_client.patch(
        f"/api/sessions/{session_id}",
        json={"status": "completed"},
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["session"]["status"] == "completed"
    assert data["session"]["started_at"] is not None
    assert data["session"]["completed_at"] is not None


def test_update_session_rejects_invalid_status(logged_in_client, assignment_and_credentials):
    assignment_id, _, _ = assignment_and_credentials

    create_response = logged_in_client.post(
        "/api/sessions",
        json={"assignment_id": assignment_id},
    )

    session_id = create_response.get_json()["session"]["id"]

    response = logged_in_client.patch(
        f"/api/sessions/{session_id}",
        json={"status": "invalid"},
    )

    assert response.status_code == 400


def test_update_session_requires_status(logged_in_client, assignment_and_credentials):
    assignment_id, _, _ = assignment_and_credentials

    create_response = logged_in_client.post(
        "/api/sessions",
        json={"assignment_id": assignment_id},
    )

    session_id = create_response.get_json()["session"]["id"]

    response = logged_in_client.patch(
        f"/api/sessions/{session_id}",
        json={},
    )

    assert response.status_code == 400
