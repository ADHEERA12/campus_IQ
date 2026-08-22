from database.database import SessionLocal
from database.models import User, Student, Attendance

from datetime import date

from auth import get_password_hash
def seed_database():
    db = SessionLocal()

    try:
        # Prevent duplicate data if the script is run again
        if db.query(User).count() > 0:
            print("Database already contains data.")
            return

        # -------------------------
        # Create users
        # -------------------------

        parent = User(
            name="Mr. Sharma",
            username="sharma_parent",
            password=get_password_hash("temp123"),
            role="parent"
        )

        student_user = User(
            name="Rahul",
            username="rahul_student",
            password=get_password_hash("temp123"),
            role="student"
        )

        teacher = User(
            name="Mrs. Iyer",
            username="iyer_teacher",
            password=get_password_hash("temp123"),
            role="teacher"
        )

        principal = User(
            name="Mr. Rao",
            username="rao_principal",
            password=get_password_hash("temp123"),
            role="principal"
        )

        db.add_all([
            parent,
            student_user,
            teacher,
            principal
        ])

        db.commit()

        # -------------------------
        # Create Rahul
        # -------------------------

        rahul = Student(
            name="Rahul",
            user_id=student_user.id,
            parent_id=parent.id,
            teacher_id=teacher.id,
            attendance_percentage=91.2
        )

        db.add(rahul)
        db.commit()

        # -------------------------
        # Attendance records
        # -------------------------

        attendance_records = [
            Attendance(
                student_id=rahul.id,
                date=date(2026, 8, 18),
                status="present"
            ),
            Attendance(
                student_id=rahul.id,
                date=date(2026, 8, 19),
                status="present"
            )
        ]

        db.add_all(attendance_records)
        db.commit()

        print("Database seeded successfully!")

    except Exception as e:
        db.rollback()
        print("Error:", e)

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()