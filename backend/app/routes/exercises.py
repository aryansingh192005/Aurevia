from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import Exercise


exercises_bp = Blueprint(
    "exercises",
    __name__,
)


def exercise_to_dict(exercise):
    return {
        "id": exercise.id,
        "name": exercise.name,
        "description": exercise.description,
        "target_area": exercise.target_area,
        "difficulty": exercise.difficulty,
        "created_at": exercise.created_at.isoformat(),
        "updated_at": exercise.updated_at.isoformat(),
    }


@exercises_bp.get("/exercises")
def get_exercises():
    exercises = Exercise.query.order_by(Exercise.id.asc()).all()

    return jsonify(
        {
            "exercises": [
                exercise_to_dict(exercise)
                for exercise in exercises
            ]
        }
    )


@exercises_bp.get("/exercises/<int:exercise_id>")
def get_exercise(exercise_id):
    exercise = db.session.get(Exercise, exercise_id)

    if exercise is None:
        return jsonify(
            {
                "error": "Exercise not found",
            }
        ), 404

    return jsonify(
        {
            "exercise": exercise_to_dict(exercise),
        }
    )


@exercises_bp.post("/exercises")
def create_exercise():
    data = request.get_json(silent=True) or {}

    name = data.get("name")

    if not isinstance(name, str) or not name.strip():
        return jsonify(
            {
                "error": "name is required",
            }
        ), 400

    exercise = Exercise(
        name=name.strip(),
        description=data.get("description"),
        target_area=data.get("target_area"),
        difficulty=data.get("difficulty"),
    )

    db.session.add(exercise)
    db.session.commit()

    return jsonify(
        {
            "exercise": exercise_to_dict(exercise),
        }
    ), 201