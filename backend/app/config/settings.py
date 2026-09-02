import os

from dotenv import load_dotenv


load_dotenv()


class Config:
    """Base Aurevia application configuration."""

    SECRET_KEY = os.getenv(
        "AUREVIA_SECRET_KEY",
        "development-only-secret-key",
    )

    DATABASE_URL = os.getenv(
        "AUREVIA_DATABASE_URL",
        "",
    )

    SQLALCHEMY_DATABASE_URI = DATABASE_URL

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    FLASK_ENV = os.getenv(
        "FLASK_ENV",
        "development",
    )

    DEBUG = FLASK_ENV == "development"

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = False