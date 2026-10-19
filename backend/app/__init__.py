from flask import Flask

from app.config.settings import Config
from app.extensions import db, migrate

from app.routes.exercises import exercises_bp
from app.routes.sessions import sessions_bp

from app.routes.assignments import assignments_bp
from app.routes.patients import patients_bp

from app.routes.progress import progress_bp
from app.routes.recordings import recordings_bp
from app.routes.ai import ai_bp

def create_app(config=None):
    app = Flask(__name__)

    app.config.from_object(Config)

    if config is not None:
        app.config.from_mapping(config)

    if app.config.get("FLASK_ENV") == "production":
        secret_key = app.config.get("SECRET_KEY")
        if not isinstance(secret_key, str) or len(secret_key) < 32:
            raise RuntimeError(
                "AUREVIA_SECRET_KEY must contain at least 32 characters in production."
            )

        therapist_code = app.config.get("THERAPIST_REGISTRATION_CODE")
        if therapist_code and (
            not isinstance(therapist_code, str) or len(therapist_code) < 24
        ):
            raise RuntimeError(
                "AUREVIA_THERAPIST_REGISTRATION_CODE must contain at least 24 characters when set."
            )

    db.init_app(app)
    migrate.init_app(app, db)

    from app import models  # noqa: F401

    from app.routes.health import health_bp
    from app.routes.auth import auth_bp

    app.register_blueprint(
        health_bp,
        url_prefix="/api",
    )

    app.register_blueprint(
        auth_bp,
        url_prefix="/api",
    )

    app.register_blueprint(
        exercises_bp,
        url_prefix="/api",
    )

    app.register_blueprint(
        sessions_bp,
        url_prefix="/api",
    )

    app.register_blueprint(
    assignments_bp,
    url_prefix="/api",
    )

    app.register_blueprint(
    patients_bp,
    url_prefix="/api",
)

    app.register_blueprint(
    progress_bp,
    url_prefix="/api",
)

    app.register_blueprint(
        recordings_bp,
        url_prefix="/api",
    )

    app.register_blueprint(ai_bp, url_prefix="/api")

    return app
