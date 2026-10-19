from flask import Blueprint, jsonify
from sqlalchemy import text

from app.extensions import db


health_bp = Blueprint(
    "health",
    __name__,
)


@health_bp.get("/health")
def health_check():
    return jsonify(
        {
            "status": "ok",
            "service": "Aurevia API",
        }
    )


@health_bp.get("/health/ready")
def readiness_check():
    try:
        db.session.execute(text("SELECT 1"))
    except Exception:
        db.session.rollback()
        return jsonify({"status": "not_ready", "service": "Aurevia API"}), 503

    return jsonify({"status": "ready", "service": "Aurevia API"}), 200
