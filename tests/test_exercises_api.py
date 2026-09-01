import sys
from pathlib import Path

import pytest

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1] / "backend"),
)

from app import create_app
from app.extensions import db


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


def test_get_exercises_empty(client):
    response = client.get("/api/exercises")

    assert response.status_code == 200
    assert response.get_json() == {
        "exercises": [],
    }


def test_create_exercise(client):
    response = client.post(
        "/api/exercises",
        json={
            "name": "Shoulder Flexion",
            "description": "Controlled shoulder flexion exercise.",
            "target_area": "Shoulder",
            "difficulty": "Beginner",
        },
    )

    assert response.status_code == 201

    data = response.get_json()

    assert data["exercise"]["id"] == 1
    assert data["exercise"]["name"] == "Shoulder Flexion"
    assert data["exercise"]["target_area"] == "Shoulder"
    assert data["exercise"]["difficulty"] == "Beginner"


def test_create_exercise_requires_name(client):
    response = client.post(
        "/api/exercises",
        json={
            "description": "Exercise without a name.",
        },
    )

    assert response.status_code == 400
    assert response.get_json() == {
        "error": "name is required",
    }


def test_get_existing_exercise(client):
    create_response = client.post(
        "/api/exercises",
        json={
            "name": "Knee Extension",
            "description": "Controlled knee extension exercise.",
            "target_area": "Knee",
            "difficulty": "Beginner",
        },
    )

    assert create_response.status_code == 201

    exercise_id = create_response.get_json()["exercise"]["id"]

    response = client.get(
        f"/api/exercises/{exercise_id}",
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["exercise"]["id"] == exercise_id
    assert data["exercise"]["name"] == "Knee Extension"


def test_get_nonexistent_exercise(client):
    response = client.get("/api/exercises/999")

    assert response.status_code == 404
    assert response.get_json() == {
        "error": "Exercise not found",
    }