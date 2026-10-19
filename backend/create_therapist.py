"""Create a therapist account from an administrator-controlled terminal."""

from getpass import getpass

from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models import User


def main():
    name = input("Therapist name: ").strip()
    email = input("Therapist email: ").strip().lower()
    password = getpass("Temporary password (8-128 characters): ")
    confirmation = getpass("Confirm password: ")

    if not name or len(name) > 120:
        raise SystemExit("Name is required and must be at most 120 characters.")
    if not email or len(email) > 255:
        raise SystemExit("Email is required and must be at most 255 characters.")
    if not 8 <= len(password) <= 128:
        raise SystemExit("Password must contain between 8 and 128 characters.")
    if password != confirmation:
        raise SystemExit("The passwords do not match.")

    app = create_app()
    with app.app_context():
        if db.session.scalar(db.select(User).where(User.email == email)):
            raise SystemExit("That email is already registered.")

        therapist = User(
            name=name,
            email=email,
            password_hash=generate_password_hash(password),
            role="therapist",
        )
        db.session.add(therapist)
        db.session.commit()

    print(f"Therapist account created for {email}.")


if __name__ == "__main__":
    main()
