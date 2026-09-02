from flask import Blueprint, jsonify, request

from sqlalchemy.exc import IntegrityError
from werkzeug.security import (
    check_password_hash,
    generate_password_hash,
)

from app.extensions import db
from app.models import User
from app.services.auth import (
    get_current_user,
    login_user,
    logout_user,
    require_auth,
)


auth_bp = Blueprint(
    "auth",
    __name__,
)


VALID_ROLES = {
    "patient",
    "therapist",
}


def serialize_user(user):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at.isoformat(),
    }


@auth_bp.post("/auth/register")
def register():
    data = request.get_json(silent=True) or {}

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "patient")

    if not name or not email or not password:
        return jsonify(
            {
                "error": "name, email, and password are required",
            }
        ), 400

    name = name.strip()
    email = email.strip().lower()

    if isinstance(role, str):
        role = role.strip().lower()
    else:
        role = ""

    if not name or not email:
        return jsonify(
            {
                "error": "name and email cannot be empty",
            }
        ), 400

    if role not in VALID_ROLES:
        return jsonify(
            {
                "error": "role must be patient or therapist",
            }
        ), 400

    if len(password) < 8:
        return jsonify(
            {
                "error": "password must be at least 8 characters",
            }
        ), 400

    existing_user = db.session.scalar(
        db.select(User).where(User.email == email)
    )

    if existing_user:
        return jsonify(
            {
                "error": "email is already registered",
            }
        ), 409

    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        role=role,
    )

    db.session.add(user)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()

        return jsonify(
            {
                "error": "email is already registered",
            }
        ), 409

    login_user(user)

    return jsonify(
        {
            "user": serialize_user(user),
        }
    ), 201


@auth_bp.post("/auth/login")
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify(
            {
                "error": "email and password are required",
            }
        ), 400

    email = email.strip().lower()

    if not email:
        return jsonify(
            {
                "error": "email cannot be empty",
            }
        ), 400

    user = db.session.scalar(
        db.select(User).where(User.email == email)
    )

    if not user or not check_password_hash(
        user.password_hash,
        password,
    ):
        return jsonify(
            {
                "error": "invalid email or password",
            }
        ), 401

    login_user(user)

    return jsonify(
        {
            "user": serialize_user(user),
        }
    ), 200


@auth_bp.get("/auth/me")
@require_auth
def me(user):
    return jsonify(
        {
            "user": serialize_user(user),
        }
    ), 200


@auth_bp.post("/auth/logout")
@require_auth
def logout(user):
    logout_user()

    return jsonify(
        {
            "message": "logged out successfully",
        }
    ), 200