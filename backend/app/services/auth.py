from functools import wraps

from flask import jsonify, session

from app.extensions import db
from app.models import User


def get_current_user():
    """Return the currently authenticated user."""

    user_id = session.get("user_id")

    if user_id is None:
        return None

    return db.session.get(User, user_id)


def login_user(user):
    """Create an authenticated Flask session."""

    session.clear()
    session["user_id"] = user.id


def logout_user():
    """Clear the current authentication session."""

    session.clear()


def require_auth(view_function):
    """Require an authenticated user."""

    @wraps(view_function)
    def wrapped_view(*args, **kwargs):
        user = get_current_user()

        if user is None:
            return jsonify(
                {
                    "error": "authentication required",
                }
            ), 401

        return view_function(user, *args, **kwargs)

    return wrapped_view


def require_role(*allowed_roles):
    """Require an authenticated user with an allowed role."""

    def decorator(view_function):
        @wraps(view_function)
        def wrapped_view(user, *args, **kwargs):
            if user.role not in allowed_roles:
                return jsonify(
                    {
                        "error": "forbidden",
                    }
                ), 403

            return view_function(user, *args, **kwargs)

        return wrapped_view

    return decorator