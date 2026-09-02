from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models import Exercise, User


app = create_app()


with app.app_context():
    patient = db.session.scalar(
        db.select(User).where(
            User.email == "patient@aurevia.test"
        )
    )

    if patient is None:
        patient = User(
            name="Test Patient",
            email="patient@aurevia.test",
            password_hash=generate_password_hash(
                "Password123"
            ),
            role="patient",
        )

        db.session.add(patient)

    therapist = db.session.scalar(
        db.select(User).where(
            User.email == "therapist@aurevia.test"
        )
    )

    if therapist is None:
        therapist = User(
            name="Test Therapist",
            email="therapist@aurevia.test",
            password_hash=generate_password_hash(
                "Password123"
            ),
            role="therapist",
        )

        db.session.add(therapist)

    exercises = [
        {
            "name": "Knee Extension",
            "description": (
                "Controlled knee extension exercise "
                "for lower-limb rehabilitation."
            ),
            "target_area": "Knee",
            "difficulty": "Beginner",
        },
        {
            "name": "Shoulder Flexion",
            "description": (
                "Controlled arm elevation exercise "
                "for shoulder mobility."
            ),
            "target_area": "Shoulder",
            "difficulty": "Beginner",
        },
        {
            "name": "Hip Abduction",
            "description": (
                "Hip abduction exercise for "
                "lower-body rehabilitation."
            ),
            "target_area": "Hip",
            "difficulty": "Intermediate",
        },
    ]

    for exercise_data in exercises:
        existing_exercise = db.session.scalar(
            db.select(Exercise).where(
                Exercise.name == exercise_data["name"]
            )
        )

        if existing_exercise is None:
            db.session.add(
                Exercise(**exercise_data)
            )

    db.session.commit()

    print("Development data seeded successfully.")
    print()
    print("Patient:")
    print("  Email: patient@aurevia.test")
    print("  Password: Password123")
    print()
    print("Therapist:")
    print("  Email: therapist@aurevia.test")
    print("  Password: Password123")
    print()
    print("Exercises:")
    
    for exercise in db.session.scalars(
        db.select(Exercise).order_by(Exercise.id)
    ):
        print(
            f"  {exercise.id}: "
            f"{exercise.name}"
        )