from flask import Flask

from app.config.settings import Config
from app.extensions import db


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    from app import models  # noqa: F401

    from app.routes.health import health_bp

    app.register_blueprint(
        health_bp,
        url_prefix="/api",
    )

    return app