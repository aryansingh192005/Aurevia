from flask import Blueprint, jsonify

from app.models import User
from app.services.auth import require_auth, require_role


patients_bp = Blueprint(
    "patients",
    __name__,
)


@patients_bp.get("/patients")
@require_auth
@require_role("therapist")
def get_patients(user):
    patients = (
        User.query
        .filter(User.role == "patient")
        .order_by(User.name.asc())
        .all()
    )

    return jsonify(
        {
            "patients": [
                {
                    "id": patient.id,
                    "name": patient.name,
                    "email": patient.email,
                }
                for patient in patients
            ]
        }
    ), 200