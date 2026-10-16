import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models import Exercise, RehabilitationSession, User


def make_app():
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        }
    )
    with app.app_context():
        db.create_all()
        patient = User(
            name="Patient",
            email="patient@example.com",
            password_hash=generate_password_hash("password123"),
            role="patient",
        )
        exercise = Exercise(name="Test exercise")
        db.session.add_all([patient, exercise])
        db.session.flush()
        rehab_session = RehabilitationSession(
            user_id=patient.id,
            exercise_id=exercise.id,
            status="started",
        )
        db.session.add(rehab_session)
        db.session.commit()
        app.config["TEST_SESSION_ID"] = rehab_session.id
    return app


def login(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "patient@example.com", "password": "password123"},
    )
    assert response.status_code == 200


def valid_sequence():
    return [[float(frame + feature) for feature in range(8)] for frame in range(30)]


def test_prediction_rejects_invalid_sequence():
    app = make_app()
    client = app.test_client()
    login(client)

    response = client.post(
        f"/api/sessions/{app.config['TEST_SESSION_ID']}/predict",
        json={"sequence": [[0.0] * 8] * 29},
    )

    assert response.status_code == 400


def test_prediction_returns_model_result(monkeypatch):
    app = make_app()
    client = app.test_client()
    login(client)

    monkeypatch.setattr("app.routes.ai.is_model_available", lambda: True)
    monkeypatch.setattr(
        "app.routes.ai.predict",
        lambda sequence: {"label": "correct", "confidence": 0.91},
    )

    response = client.post(
        f"/api/sessions/{app.config['TEST_SESSION_ID']}/predict",
        json={"sequence": valid_sequence()},
    )

    assert response.status_code == 200
    assert response.get_json() == {
        "prediction": {"label": "correct", "confidence": 0.91}
    }


def test_prediction_reports_missing_model(monkeypatch):
    app = make_app()
    client = app.test_client()
    login(client)

    monkeypatch.setattr("app.routes.ai.is_model_available", lambda: False)

    response = client.post(
        f"/api/sessions/{app.config['TEST_SESSION_ID']}/predict",
        json={"sequence": valid_sequence()},
    )

    assert response.status_code == 503
