from flask import Flask

from app.config.settings import Config
from app.extensions import db, migrate

from app.routes.exercises import exercises_bp
from app.routes.sessions import sessions_bp

from app.routes.assignments import assignments_bp
from app.routes.patients import patients_bp

from app.routes.progress import progress_bp
from app.routes.recordings import recordings_bp

def create_app(config=None):
    app = Flask(__name__)

    app.config.from_object(Config)

    if config is not None:
        app.config.from_mapping(config)

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

    return app