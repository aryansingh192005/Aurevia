from flask import Blueprint, jsonify

from app.models import ProgressRecord
from app.services.auth import require_auth


progress_bp = Blueprint(
    "progress",
    __name__,
)


def progress_to_dict(record):
    return {
        "id": record.id,
        "user_id": record.user_id,
        "session_id": record.session_id,
        "metric_name": record.metric_name,
        "metric_value": record.metric_value,
        "recorded_at": record.recorded_at.isoformat(),
    }


@progress_bp.get("/progress")
@require_auth
def get_progress(user):
    records = (
        ProgressRecord.query
        .filter(
            ProgressRecord.user_id == user.id
        )
        .order_by(
            ProgressRecord.recorded_at.desc()
        )
        .all()
    )

    return jsonify(
        {
            "progress": [
                progress_to_dict(record)
                for record in records
            ]
        }
    ), 200