from app.main import app
from app.database import SessionLocal
from app.models.project import Project
from app.models.user import User

with SessionLocal() as db:
    users_count = db.query(User).count()
    projects_count = db.query(Project).count()
    print(f"[OK] Backend operational! Total seeded users: {users_count}, Total seeded projects: {projects_count}")
