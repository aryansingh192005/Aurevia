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


def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 201

    data = response.get_json()

    assert data["user"]["id"] == 1
    assert data["user"]["name"] == "Test User"
    assert data["user"]["email"] == "test@example.com"
    assert "created_at" in data["user"]


def test_register_requires_name_email_and_password(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 400
    assert response.get_json() == {
        "error": "name, email, and password are required",
    }


def test_register_rejects_short_password(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "short",
        },
    )

    assert response.status_code == 400
    assert response.get_json() == {
        "error": "password must be at least 8 characters",
    }


def test_register_rejects_duplicate_email(client):
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "TestPassword123!",
    }

    first_response = client.post(
        "/api/auth/register",
        json=payload,
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/api/auth/register",
        json={
            **payload,
            "name": "Another User",
        },
    )

    assert second_response.status_code == 409
    assert second_response.get_json() == {
        "error": "email is already registered",
    }


def test_login_user(client):
    register_response = client.post(
        "/api/auth/register",
        json={
            "name": "Login User",
            "email": "login@example.com",
            "password": "TestPassword123!",
        },
    )

    assert register_response.status_code == 201

    response = client.post(
        "/api/auth/login",
        json={
            "email": "login@example.com",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["user"]["email"] == "login@example.com"
    assert data["user"]["name"] == "Login User"
    assert data["user"]["id"] == 1


def test_login_rejects_wrong_password(client):
    client.post(
        "/api/auth/register",
        json={
            "name": "Login User",
            "email": "login@example.com",
            "password": "TestPassword123!",
        },
    )

    response = client.post(
        "/api/auth/login",
        json={
            "email": "login@example.com",
            "password": "WrongPassword123!",
        },
    )

    assert response.status_code == 401
    assert response.get_json() == {
        "error": "invalid email or password",
    }


def test_login_rejects_unknown_email(client):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "unknown@example.com",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 401
    assert response.get_json() == {
        "error": "invalid email or password",
    }
