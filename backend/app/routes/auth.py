from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db
from app.models import User


auth_bp = Blueprint(
    "auth",
    __name__,
)


@auth_bp.post("/auth/register")
def register():
    data = request.get_json(silent=True) or {}

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify(
            {
                "error": "name, email, and password are required",
            }
        ), 400

    name = name.strip()
    email = email.strip().lower()

    if not name or not email:
        return jsonify(
            {
                "error": "name and email cannot be empty",
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

    return jsonify(
        {
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "created_at": user.created_at.isoformat(),
            }
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

    return jsonify(
        {
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "created_at": user.created_at.isoformat(),
            }
        }
    ), 200