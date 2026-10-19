import os

from dotenv import load_dotenv


load_dotenv()


class Config:
    """Base Aurevia application configuration."""

    ENVIRONMENT = os.getenv(
        "AUREVIA_ENV",
        os.getenv("FLASK_ENV", "development"),
    ).strip().lower()
    SECRET_KEY = os.getenv("AUREVIA_SECRET_KEY") or (
        "development-only-secret-key" if ENVIRONMENT != "production" else None
    )

    DATABASE_URL = os.getenv(
        "AUREVIA_DATABASE_URL",
        "sqlite:///aurevia.db",
    ) or "sqlite:///aurevia.db"

    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    FLASK_ENV = ENVIRONMENT
    THERAPIST_REGISTRATION_CODE = os.getenv("AUREVIA_THERAPIST_REGISTRATION_CODE")

    DEBUG = ENVIRONMENT == "development"

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = ENVIRONMENT == "production"
    MAX_CONTENT_LENGTH = 1024 * 1024
