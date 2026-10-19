from datetime import date

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import Exercise, ExerciseAssignment, PlanExercise, RehabilitationPlan, User
from app.services.auth import require_auth, require_role

plans_bp = Blueprint("plans", __name__)


def plan_to_dict(plan):
    return {
        "id": plan.id,
        "title": plan.title,
        "notes": plan.notes,
        "status": plan.status,
        "days_per_week": plan.days_per_week,
        "start_date": plan.start_date.isoformat() if plan.start_date else None,
        "end_date": plan.end_date.isoformat() if plan.end_date else None,
        "patient": {"id": plan.patient.id, "name": plan.patient.name},
        "therapist": {"id": plan.therapist.id, "name": plan.therapist.name},
        "items": [
            {
                "id": item.id,
                "assignment_id": item.assignment_id,
                "exercise": {
                    "id": item.exercise.id,
                    "name": item.exercise.name,
                    "description": item.exercise.description,
                    "target_area": item.exercise.target_area,
                    "difficulty": item.exercise.difficulty,
                },
                "position": item.position,
                "sets": item.sets,
                "reps": item.reps,
                "rest_seconds": item.rest_seconds,
                "days_per_week": item.days_per_week,
                "instructions": item.instructions,
            }
            for item in plan.items
        ],
        "created_at": plan.created_at.isoformat(),
    }


@plans_bp.get("/plans")
@require_auth
def list_plans(user):
    query = RehabilitationPlan.query
    if user.role == "patient":
        query = query.filter_by(patient_id=user.id)
    elif user.role == "therapist":
        query = query.filter_by(therapist_id=user.id)
    else:
        return jsonify({"error": "forbidden"}), 403
    plans = query.order_by(RehabilitationPlan.created_at.desc()).all()
    return jsonify({"plans": [plan_to_dict(plan) for plan in plans]}), 200


@plans_bp.post("/plans")
@require_auth
@require_role("therapist")
def create_plan(user):
    data = request.get_json(silent=True) or {}
    patient_id = data.get("patient_id")
    title = data.get("title")
    items = data.get("exercises")
    if not isinstance(patient_id, int) or not isinstance(title, str) or not title.strip():
        return jsonify({"error": "patient_id and a plan title are required"}), 400
    if not isinstance(items, list) or not items or len(items) > 20:
        return jsonify({"error": "add between 1 and 20 exercises to the plan"}), 400
    notes = data.get("notes", "")
    if not isinstance(notes, str) or len(notes) > 2000:
        return jsonify({"error": "therapist notes must be 2000 characters or fewer"}), 400
    patient = db.session.get(User, patient_id)
    if not patient or patient.role != "patient":
        return jsonify({"error": "patient not found"}), 404
    try:
        frequency = int(data.get("days_per_week", 3))
        start_date = date.fromisoformat(data["start_date"]) if data.get("start_date") else None
        end_date = date.fromisoformat(data["end_date"]) if data.get("end_date") else None
    except (TypeError, ValueError):
        return jsonify({"error": "check the weekly frequency and plan dates"}), 400
    if frequency < 1 or frequency > 7 or (start_date and end_date and end_date < start_date):
        return jsonify({"error": "weekly frequency must be 1–7 and end date must follow start date"}), 400

    plan = RehabilitationPlan(
        patient_id=patient.id,
        therapist_id=user.id,
        title=title.strip()[:140],
        notes=notes.strip() or None,
        days_per_week=frequency,
        start_date=start_date,
        end_date=end_date,
    )
    db.session.add(plan)
    db.session.flush()

    seen = set()
    for position, item in enumerate(items):
        if not isinstance(item, dict):
            db.session.rollback()
            return jsonify({"error": "each exercise entry must be an object"}), 400
        instructions = item.get("instructions", "")
        if not isinstance(instructions, str) or len(instructions) > 500:
            db.session.rollback()
            return jsonify({"error": "exercise instructions must be 500 characters or fewer"}), 400
        try:
            exercise_id = int(item.get("exercise_id"))
            sets = int(item.get("sets", 3))
            reps = int(item.get("reps", 10))
            rest = int(item.get("rest_seconds", 30))
            days = int(item.get("days_per_week", frequency))
        except (TypeError, ValueError):
            db.session.rollback()
            return jsonify({"error": "exercise targets must be whole numbers"}), 400
        exercise = db.session.get(Exercise, exercise_id)
        if not exercise or exercise_id in seen or not 1 <= sets <= 50 or not 1 <= reps <= 100 or not 1 <= days <= 7 or not 0 <= rest <= 600:
            db.session.rollback()
            return jsonify({"error": "check selected exercises, targets, and rest times"}), 400
        seen.add(exercise_id)
        assignment = ExerciseAssignment(
            patient_id=patient.id,
            therapist_id=user.id,
            exercise_id=exercise.id,
            target_sets=sets,
            target_reps=reps,
            status="active",
        )
        db.session.add(assignment)
        db.session.flush()
        db.session.add(PlanExercise(
            plan_id=plan.id,
            exercise_id=exercise.id,
            assignment_id=assignment.id,
            position=position,
            sets=sets,
            reps=reps,
            rest_seconds=rest,
            days_per_week=days,
            instructions=instructions.strip() or None,
        ))
    db.session.commit()
    return jsonify({"plan": plan_to_dict(plan)}), 201


@plans_bp.put("/plans/<int:plan_id>")
@require_auth
@require_role("therapist")
def edit_plan(user, plan_id):
    plan = db.session.get(RehabilitationPlan, plan_id)
    if not plan:
        return jsonify({"error": "plan not found"}), 404
    if plan.therapist_id != user.id:
        return jsonify({"error": "forbidden"}), 403
    if plan.status == "completed":
        return jsonify({"error": "completed plans cannot be edited"}), 409

    data = request.get_json(silent=True) or {}
    title = data.get("title")
    items = data.get("exercises")
    notes = data.get("notes", "")
    if not isinstance(title, str) or not title.strip():
        return jsonify({"error": "a plan title is required"}), 400
    if len(title) > 140:
        return jsonify({"error": "plan title must be 140 characters or fewer"}), 400
    if not isinstance(notes, str) or len(notes) > 2000:
        return jsonify({"error": "therapist notes must be 2000 characters or fewer"}), 400
    if not isinstance(items, list) or not items or len(items) > 20:
        return jsonify({"error": "add between 1 and 20 exercises to the plan"}), 400
    try:
        frequency = int(data.get("days_per_week", plan.days_per_week))
        start_date = date.fromisoformat(data["start_date"]) if data.get("start_date") else None
        end_date = date.fromisoformat(data["end_date"]) if data.get("end_date") else None
    except (TypeError, ValueError):
        return jsonify({"error": "check the weekly frequency and plan dates"}), 400
    if frequency < 1 or frequency > 7 or (start_date and end_date and end_date < start_date):
        return jsonify({"error": "weekly frequency must be 1–7 and end date must follow start date"}), 400

    existing_items = {item.exercise_id: item for item in plan.items}
    kept_exercise_ids = set()
    normalized_items = []
    for position, item in enumerate(items):
        if not isinstance(item, dict):
            return jsonify({"error": "each exercise entry must be an object"}), 400
        instructions = item.get("instructions", "")
        if not isinstance(instructions, str) or len(instructions) > 500:
            return jsonify({"error": "exercise instructions must be 500 characters or fewer"}), 400
        try:
            exercise_id = int(item.get("exercise_id"))
            sets = int(item.get("sets", 3))
            reps = int(item.get("reps", 10))
            rest = int(item.get("rest_seconds", 30))
            days = int(item.get("days_per_week", frequency))
        except (TypeError, ValueError):
            return jsonify({"error": "exercise targets must be whole numbers"}), 400
        exercise = db.session.get(Exercise, exercise_id)
        if not exercise or exercise_id in kept_exercise_ids or not 1 <= sets <= 50 or not 1 <= reps <= 100 or not 1 <= days <= 7 or not 0 <= rest <= 600:
            return jsonify({"error": "check selected exercises, targets, and rest times"}), 400
        kept_exercise_ids.add(exercise_id)
        normalized_items.append((position, exercise, sets, reps, rest, days, instructions.strip() or None))

    plan.title = title.strip()
    plan.notes = notes.strip() or None
    plan.days_per_week = frequency
    plan.start_date = start_date
    plan.end_date = end_date

    for position, exercise, sets, reps, rest, days, instructions in normalized_items:
        plan_item = existing_items.get(exercise.id)
        if plan_item:
            plan_item.position = position
            plan_item.sets = sets
            plan_item.reps = reps
            plan_item.rest_seconds = rest
            plan_item.days_per_week = days
            plan_item.instructions = instructions
            plan_item.assignment.target_sets = sets
            plan_item.assignment.target_reps = reps
        else:
            assignment = ExerciseAssignment(
                patient_id=plan.patient_id,
                therapist_id=plan.therapist_id,
                exercise_id=exercise.id,
                target_sets=sets,
                target_reps=reps,
                status=plan.status,
            )
            db.session.add(assignment)
            db.session.flush()
            db.session.add(PlanExercise(
                plan_id=plan.id,
                exercise_id=exercise.id,
                assignment_id=assignment.id,
                position=position,
                sets=sets,
                reps=reps,
                rest_seconds=rest,
                days_per_week=days,
                instructions=instructions,
            ))

    for exercise_id, plan_item in existing_items.items():
        if exercise_id not in kept_exercise_ids:
            plan_item.assignment.status = "completed"
            db.session.delete(plan_item)

    db.session.commit()
    return jsonify({"plan": plan_to_dict(plan)}), 200


@plans_bp.patch("/plans/<int:plan_id>")
@require_auth
@require_role("therapist")
def update_plan_status(user, plan_id):
    plan = db.session.get(RehabilitationPlan, plan_id)
    if not plan:
        return jsonify({"error": "plan not found"}), 404
    if plan.therapist_id != user.id:
        return jsonify({"error": "forbidden"}), 403
    status = (request.get_json(silent=True) or {}).get("status")
    if status not in {"active", "paused", "completed"}:
        return jsonify({"error": "status must be active, paused, or completed"}), 400
    plan.status = status
    for item in plan.items:
        item.assignment.status = status
    db.session.commit()
    return jsonify({"plan": plan_to_dict(plan)}), 200
