from flask import Flask

from app.config.settings import Config


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    from app.routes.health import health_bp

    app.register_blueprint(
        health_bp,
        url_prefix="/api",
    )

    return app