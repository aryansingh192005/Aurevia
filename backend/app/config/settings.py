import os


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

    FLASK_ENV = os.getenv(
        "FLASK_ENV",
        "development",
    )

    DEBUG = FLASK_ENV == "development"