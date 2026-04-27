"""
Database initialization — creates all tables and seeds initial data.
Run: cd backend && venv/Scripts/python -m app.db.init
"""

import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

from app.db.base import Base
from app.models import user, employee, attendance, payroll, leave  # registers all models
from app.models.leave import LeaveType
from app.models.user import User
from app.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_connection(engine):
    try:
        print("Verifying database connection...")
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("  OK — database is reachable")
    except Exception as e:
        print(f"  FAILED: {e}")
        print("  Make sure PostgreSQL is running and DATABASE_URL is correct in backend/.env")
        sys.exit(1)


def create_tables(engine):
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("  OK — all tables created")


def seed_data(engine):
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        print("Seeding initial data...")

        # Admin user
        if not db.query(User).filter(User.email == "admin@hrms.com").first():
            admin = User(
                email="admin@hrms.com",
                hashed_password=pwd_context.hash("Admin@123"),
                full_name="System Administrator",
                role="admin",
                is_active=True,
            )
            db.add(admin)
            print("  Created admin  -> email: admin@hrms.com  password: Admin@123")
        else:
            print("  Admin already exists")

        # Manager user
        if not db.query(User).filter(User.email == "manager@hrms.com").first():
            mgr = User(
                email="manager@hrms.com",
                hashed_password=pwd_context.hash("Manager@123"),
                full_name="HR Manager",
                role="manager",
                is_active=True,
            )
            db.add(mgr)
            print("  Created manager -> email: manager@hrms.com  password: Manager@123")

        # Leave types
        defaults = [
            ("Casual Leave", 12),
            ("Earned Leave", 15),
            ("Sick Leave", 10),
        ]
        for name, days in defaults:
            if not db.query(LeaveType).filter(LeaveType.name == name).first():
                db.add(LeaveType(name=name, max_days_per_year=days))
        print("  Leave types seeded")

        db.commit()
        print("\nDone. Your app is ready!")
        print("  Frontend : http://localhost:3000")
        print("  Backend  : http://localhost:8000")
        print("  API docs : http://localhost:8000/docs")
    except Exception as e:
        db.rollback()
        print(f"  ERROR: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 45)
    print("HRMS Modern - Database Init")
    print("=" * 45)
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    verify_connection(engine)
    create_tables(engine)
    seed_data(engine)
    print("=" * 45)
