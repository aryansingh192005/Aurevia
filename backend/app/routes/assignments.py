from flask import Blueprint, jsonify, request
from sqlalchemy.orm import selectinload

from app.extensions import db
from app.models import Exercise, ExerciseAssignment, PlanExercise, User
from app.services.auth import require_auth, require_role


assignments_bp = Blueprint(
    "assignments",
    __name__,
)


VALID_STATUSES = {
    "active",
    "paused",
    "completed",
}

_PLAN_ITEM_UNSET = object()


def serialize_assignment(assignment, plan_item=_PLAN_ITEM_UNSET):
    if plan_item is _PLAN_ITEM_UNSET:
        plan_item = db.session.scalar(
            db.select(PlanExercise).where(PlanExercise.assignment_id == assignment.id)
        )
    return {
        "id": assignment.id,
        "patient": {
            "id": assignment.patient.id,
            "name": assignment.patient.name,
            "email": assignment.patient.email,
        },
        "therapist": {
            "id": assignment.therapist.id,
            "name": assignment.therapist.name,
            "email": assignment.therapist.email,
        },
        "exercise": {
            "id": assignment.exercise.id,
            "name": assignment.exercise.name,
            "description": assignment.exercise.description,
            "target_area": assignment.exercise.target_area,
            "difficulty": assignment.exercise.difficulty,
        },
        "target_sets": assignment.target_sets,
        "target_reps": assignment.target_reps,
        "rest_seconds": plan_item.rest_seconds if plan_item else 30,
        "instructions": plan_item.instructions if plan_item else None,
        "status": assignment.status,
        "assigned_at": assignment.assigned_at.isoformat(),
    }


@assignments_bp.get("/assignments")
@require_auth
def get_assignments(user):
    assignment_query = db.select(ExerciseAssignment).options(
        selectinload(ExerciseAssignment.patient),
        selectinload(ExerciseAssignment.therapist),
        selectinload(ExerciseAssignment.exercise),
    )

    if user.role == "patient":
        assignment_query = assignment_query.where(
            ExerciseAssignment.patient_id == user.id
        )

    elif user.role == "therapist":
        assignment_query = assignment_query.where(
            ExerciseAssignment.therapist_id == user.id
        )

    else:
        return jsonify(
            {
                "error": "invalid user role",
            }
        ), 403

    assignments = db.session.scalars(
        assignment_query.order_by(ExerciseAssignment.assigned_at.desc())
    ).all()
    plan_items = db.session.scalars(
        db.select(PlanExercise).where(
            PlanExercise.assignment_id.in_([item.id for item in assignments])
        )
    ).all() if assignments else []
    plan_items_by_assignment = {
        item.assignment_id: item
        for item in plan_items
    }

    return jsonify(
        {
            "assignments": [
                serialize_assignment(
                    assignment,
                    plan_items_by_assignment.get(assignment.id),
                )
                for assignment in assignments
            ]
        }
    ), 200


@assignments_bp.post("/assignments")
@require_auth
@require_role("therapist")
def create_assignment(user):
    data = request.get_json(silent=True) or {}

    patient_id = data.get("patient_id")
    exercise_id = data.get("exercise_id")
    target_sets = data.get("target_sets")
    target_reps = data.get("target_reps")

    if patient_id is None or exercise_id is None:
        return jsonify(
            {
                "error": "patient_id and exercise_id are required",
            }
        ), 400

    try:
        patient_id = int(patient_id)
        exercise_id = int(exercise_id)
    except (TypeError, ValueError):
        return jsonify(
            {
                "error": "patient_id and exercise_id must be integers",
            }
        ), 400

    if target_sets is not None:
        try:
            target_sets = int(target_sets)
        except (TypeError, ValueError):
            return jsonify(
                {
                    "error": "target_sets must be an integer",
                }
            ), 400

        if target_sets <= 0:
            return jsonify(
                {
                    "error": "target_sets must be greater than zero",
                }
            ), 400

    if target_reps is not None:
        try:
            target_reps = int(target_reps)
        except (TypeError, ValueError):
            return jsonify(
                {
                    "error": "target_reps must be an integer",
                }
            ), 400

        if target_reps <= 0:
            return jsonify(
                {
                    "error": "target_reps must be greater than zero",
                }
            ), 400

    patient = db.session.get(User, patient_id)

    if patient is None:
        return jsonify(
            {
                "error": "patient not found",
            }
        ), 404

    if patient.role != "patient":
        return jsonify(
            {
                "error": "selected user is not a patient",
            }
        ), 400

    exercise = db.session.get(
        Exercise,
        exercise_id,
    )

    if exercise is None:
        return jsonify(
            {
                "error": "exercise not found",
            }
        ), 404

    assignment = ExerciseAssignment(
        patient_id=patient.id,
        therapist_id=user.id,
        exercise_id=exercise.id,
        target_sets=target_sets,
        target_reps=target_reps,
        status="active",
    )

    db.session.add(assignment)
    db.session.commit()

    return jsonify(
        {
            "assignment": serialize_assignment(
                assignment
            )
        }
    ), 201


@assignments_bp.get("/assignments/<int:assignment_id>")
@require_auth
def get_assignment(user, assignment_id):
    assignment = db.session.get(
        ExerciseAssignment,
        assignment_id,
    )

    if assignment is None:
        return jsonify(
            {
                "error": "assignment not found",
            }
        ), 404

    if (
        user.role == "patient"
        and assignment.patient_id != user.id
    ):
        return jsonify(
            {
                "error": "forbidden",
            }
        ), 403

    if (
        user.role == "therapist"
        and assignment.therapist_id != user.id
    ):
        return jsonify(
            {
                "error": "forbidden",
            }
        ), 403

    return jsonify(
        {
            "assignment": serialize_assignment(
                assignment
            )
        }
    ), 200


@assignments_bp.patch("/assignments/<int:assignment_id>")
@require_auth
@require_role("therapist")
def update_assignment(user, assignment_id):
    assignment = db.session.get(
        ExerciseAssignment,
        assignment_id,
    )

    if assignment is None:
        return jsonify(
            {
                "error": "assignment not found",
            }
        ), 404

    if assignment.therapist_id != user.id:
        return jsonify(
            {
                "error": "forbidden",
            }
        ), 403

    data = request.get_json(silent=True) or {}

    if "target_sets" in data:
        try:
            target_sets = int(data["target_sets"])
        except (TypeError, ValueError):
            return jsonify(
                {
                    "error": "target_sets must be an integer",
                }
            ), 400

        if target_sets <= 0:
            return jsonify(
                {
                    "error": "target_sets must be greater than zero",
                }
            ), 400

        assignment.target_sets = target_sets

    if "target_reps" in data:
        try:
            target_reps = int(data["target_reps"])
        except (TypeError, ValueError):
            return jsonify(
                {
                    "error": "target_reps must be an integer",
                }
            ), 400

        if target_reps <= 0:
            return jsonify(
                {
                    "error": "target_reps must be greater than zero",
                }
            ), 400

        assignment.target_reps = target_reps

    if "status" in data:
        status = data["status"]

        if not isinstance(status, str):
            return jsonify(
                {
                    "error": "status must be a string",
                }
            ), 400

        status = status.strip().lower()

        if status not in VALID_STATUSES:
            return jsonify(
                {
                    "error": (
                        "status must be active, "
                        "paused, or completed"
                    ),
                }
            ), 400

        assignment.status = status

    db.session.commit()

    return jsonify(
        {
            "assignment": serialize_assignment(
                assignment
            )
        }
    ), 200
