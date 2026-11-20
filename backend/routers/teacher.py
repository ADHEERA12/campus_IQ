
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import models
from auth import get_db, require_role


router = APIRouter(tags=["Teacher"])


@router.get("/teacher/students")
def get_teacher_students(
    current_user=Depends(require_role("teacher")),
    db: Session = Depends(get_db),
):

    students = db.query(models.Student).filter(
        models.Student.teacher_id == current_user.id
    ).all()

    return {
        "teacher_id": current_user.id,
        "teacher_name": current_user.name,
        "students": [
            {
                "id": student.id,
                "name": student.name,
                "attendance_percentage":
                    student.attendance_percentage or 0.0,
            }
            for student in students
        ],
    }
