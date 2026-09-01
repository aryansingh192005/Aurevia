from flask import Flask

from app.config.settings import Config
from app.extensions import db, migrate

from app.routes.exercises import exercises_bp
from app.routes.sessions import sessions_bp


def create_app(config=None):
    app = Flask(__name__)

    if config is None:
        app.config.from_object(Config)
    else:
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

    return app