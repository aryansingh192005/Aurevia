from app import create_app
from app.extensions import db
from app import models  # noqa: F401


app = create_app()


with app.app_context():
    db.create_all()
    print("Aurevia database tables created successfully.")
    print("Tables:", sorted(db.metadata.tables.keys()))