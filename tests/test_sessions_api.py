import sys
from pathlib import Path

import pytest

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1] / "backend"),
)

from app import create_app
from app.extensions import db
from app.models import Exercise, User


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
def user_and_exercise(app):
    with app.app_context():
        user = User(
            name="Session User",
            email="session@example.com",
            password_hash="test-password-hash",
        )

        exercise = Exercise(
            name="Shoulder Flexion",
            description="Controlled shoulder flexion exercise.",
            target_area="Shoulder",
            difficulty="Beginner",
        )

        db.session.add_all([user, exercise])
        db.session.commit()

        return user.id, exercise.id


def test_get_sessions_empty(client):
    response = client.get("/api/sessions")

    assert response.status_code == 200
    assert response.get_json() == {
        "sessions": [],
    }


def test_create_session(client, user_and_exercise):
    user_id, exercise_id = user_and_exercise

    response = client.post(
        "/api/sessions",
        json={
            "user_id": user_id,
            "exercise_id": exercise_id,
        },
    )

    assert response.status_code == 201

    data = response.get_json()

    assert data["session"]["id"] == 1
    assert data["session"]["user_id"] == user_id
    assert data["session"]["exercise_id"] == exercise_id
    assert data["session"]["status"] == "created"
    assert data["session"]["started_at"] is None
    assert data["session"]["completed_at"] is None


def test_create_session_rejects_unknown_user(client, user_and_exercise):
    _, exercise_id = user_and_exercise

    response = client.post(
        "/api/sessions",
        json={
            "user_id": 999,
            "exercise_id": exercise_id,
        },
    )

    assert response.status_code == 404
    assert response.get_json() == {
        "error": "User not found",
    }


def test_create_session_rejects_unknown_exercise(client, user_and_exercise):
    user_id, _ = user_and_exercise

    response = client.post(
        "/api/sessions",
        json={
            "user_id": user_id,
            "exercise_id": 999,
        },
    )

    assert response.status_code == 404
    assert response.get_json() == {
        "error": "Exercise not found",
    }


def test_get_existing_session(client, user_and_exercise):
    user_id, exercise_id = user_and_exercise

    create_response = client.post(
        "/api/sessions",
        json={
            "user_id": user_id,
            "exercise_id": exercise_id,
        },
    )

    session_id = create_response.get_json()["session"]["id"]

    response = client.get(
        f"/api/sessions/{session_id}",
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["session"]["id"] == session_id
    assert data["session"]["user_id"] == user_id
    assert data["session"]["exercise_id"] == exercise_id
    assert data["session"]["status"] == "created"


def test_get_nonexistent_session(client):
    response = client.get("/api/sessions/999")

    assert response.status_code == 404
    assert response.get_json() == {
        "error": "Session not found",
    }


def test_start_session(client, user_and_exercise):
    user_id, exercise_id = user_and_exercise

    create_response = client.post(
        "/api/sessions",
        json={
            "user_id": user_id,
            "exercise_id": exercise_id,
        },
    )

    session_id = create_response.get_json()["session"]["id"]

    response = client.patch(
        f"/api/sessions/{session_id}",
        json={
            "status": "started",
        },
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["session"]["status"] == "started"
    assert data["session"]["started_at"] is not None
    assert data["session"]["completed_at"] is None


def test_complete_session_sets_timestamps(client, user_and_exercise):
    user_id, exercise_id = user_and_exercise

    create_response = client.post(
        "/api/sessions",
        json={
            "user_id": user_id,
            "exercise_id": exercise_id,
        },
    )

    session_id = create_response.get_json()["session"]["id"]

    response = client.patch(
        f"/api/sessions/{session_id}",
        json={
            "status": "completed",
        },
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["session"]["status"] == "completed"
    assert data["session"]["started_at"] is not None
    assert data["session"]["completed_at"] is not None


def test_update_session_rejects_invalid_status(client, user_and_exercise):
    user_id, exercise_id = user_and_exercise

    create_response = client.post(
        "/api/sessions",
        json={
            "user_id": user_id,
            "exercise_id": exercise_id,
        },
    )

    session_id = create_response.get_json()["session"]["id"]

    response = client.patch(
        f"/api/sessions/{session_id}",
        json={
            "status": "invalid",
        },
    )

    assert response.status_code == 400
    assert response.get_json() == {
        "error": "Invalid session status",
    }


def test_update_session_requires_status(client, user_and_exercise):
    user_id, exercise_id = user_and_exercise

    create_response = client.post(
        "/api/sessions",
        json={
            "user_id": user_id,
            "exercise_id": exercise_id,
        },
    )

    session_id = create_response.get_json()["session"]["id"]

    response = client.patch(
        f"/api/sessions/{session_id}",
        json={},
    )

    assert response.status_code == 400
    assert response.get_json() == {
        "error": "status is required",
    }
