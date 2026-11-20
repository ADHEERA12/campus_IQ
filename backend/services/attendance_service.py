
from sqlalchemy.orm import Session

from database import models


def recalculate_student_attendance(
    student: models.Student,
    db: Session,
):

    records = db.query(models.Attendance).filter(
        models.Attendance.student_id == student.id
    ).all()

    total = len(records)

    present = sum(
        1 for record in records
        if record.status.lower() == "present"
    )

    percentage = (present / total * 100) if total else 0.0

    student.attendance_percentage = round(percentage, 2)

    return student.attendance_percentage


def calculate_attendance_goal(
    student: models.Student,
    db: Session,
    target_percentage: float,
):

    if target_percentage <= 0 or target_percentage > 100:
        raise ValueError("Target must be between 1 and 100")

    records = db.query(models.Attendance).filter(
        models.Attendance.student_id == student.id
    ).all()

    total = len(records)

    present = sum(
        1 for record in records
        if record.status.lower() == "present"
    )

    current_percentage = (
        (present / total) * 100 if total else 0.0
    )

    if current_percentage >= target_percentage:
        return {
            "current_percentage": round(current_percentage, 2),
            "target_percentage": target_percentage,
            "classes_needed": 0,
        }

    if total == 0:
        raise ValueError("No attendance records available")

    needed = 0

    while ((present + needed) / (total + needed) * 100) < target_percentage:
        needed += 1

    final_percentage = (
        (present + needed) / (total + needed) * 100
    )

    return {
        "student_id": student.id,
        "student_name": student.name,
        "current_percentage": round(current_percentage, 2),
        "target_percentage": target_percentage,
        "classes_needed": needed,
        "final_percentage": round(final_percentage, 2),
    }
