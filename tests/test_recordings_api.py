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
from app.models import Exercise, ExerciseAssignment, RehabilitationSession, User


FEATURE_COUNT = 8


def sample_sequence(length=30):
    return [[float(i % 90) for _ in range(FEATURE_COUNT)] for i in range(length)]


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
def fixture_data(app):
    with app.app_context():
        therapist = User(
            name="Dr Therapist",
            email="therapist@example.com",
            password_hash=generate_password_hash("password123"),
            role="therapist",
        )

        patient = User(
            name="Rec Patient",
            email="patient@example.com",
            password_hash=generate_password_hash("password123"),
            role="patient",
        )

        exercise = Exercise(name="Bicep Curl", target_area="elbow")

        db.session.add_all([therapist, patient, exercise])
        db.session.commit()

        assignment = ExerciseAssignment(
            patient_id=patient.id,
            therapist_id=therapist.id,
            exercise_id=exercise.id,
            status="active",
        )

        db.session.add(assignment)
        db.session.commit()

        session = RehabilitationSession(
            user_id=patient.id,
            exercise_id=exercise.id,
            status="started",
        )

        db.session.add(session)
        db.session.commit()

        return {
            "session_id": session.id,
            "patient_email": "patient@example.com",
            "therapist_email": "therapist@example.com",
        }


def login(client, email):
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "password123"},
    )
    assert response.status_code == 200


def test_create_recording_as_patient(client, fixture_data):
    login(client, fixture_data["patient_email"])

    response = client.post(
        f"/api/sessions/{fixture_data['session_id']}/recordings",
        json={
            "rep_index": 1,
            "sequence": sample_sequence(),
            "heuristic_label": "correct",
            "heuristic_confidence": 0.9,
        },
    )

    assert response.status_code == 201

    data = response.get_json()["recording"]
    assert data["rep_index"] == 1
    assert data["heuristic_label"] == "correct"
    assert data["therapist_label"] is None


def test_create_recording_rejects_wrong_feature_count(client, fixture_data):
    login(client, fixture_data["patient_email"])

    response = client.post(
        f"/api/sessions/{fixture_data['session_id']}/recordings",
        json={
            "rep_index": 1,
            "sequence": [[1, 2, 3]],
            "heuristic_label": "correct",
        },
    )

    assert response.status_code == 400


def test_therapist_can_list_and_review_recordings(client, fixture_data):
    login(client, fixture_data["patient_email"])

    create_response = client.post(
        f"/api/sessions/{fixture_data['session_id']}/recordings",
        json={
            "rep_index": 1,
            "sequence": sample_sequence(),
            "heuristic_label": "incorrect",
        },
    )

    recording_id = create_response.get_json()["recording"]["id"]

    client.post("/api/auth/logout")
    login(client, fixture_data["therapist_email"])

    list_response = client.get("/api/recordings?status=pending")
    assert list_response.status_code == 200
    assert len(list_response.get_json()["recordings"]) == 1

    review_response = client.patch(
        f"/api/recordings/{recording_id}",
        json={"therapist_label": "correct"},
    )

    assert review_response.status_code == 200
    assert review_response.get_json()["recording"]["therapist_label"] == "correct"

    export_response = client.get("/api/recordings/export")
    assert export_response.status_code == 200

    exported = export_response.get_json()
    assert exported["count"] == 1
    assert exported["examples"][0]["label"] == "correct"


def test_patient_cannot_review_recordings(client, fixture_data):
    login(client, fixture_data["patient_email"])

    response = client.get("/api/recordings")

    assert response.status_code == 403
