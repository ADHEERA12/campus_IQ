

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import models
from auth import get_db, require_role


router = APIRouter(tags=["Student"])


@router.get("/attendance/my")
def get_my_attendance(
    current_user=Depends(require_role("student")),
    db: Session = Depends(get_db),
):

    student = db.query(models.Student).filter(
        models.Student.user_id == current_user.id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student record not found",
        )

    return {
        "student_id": student.id,
        "student_name": student.name,
        "attendance_percentage": student.attendance_percentage or 0.0,
    }


# Alias used by AI tools
@router.get("/tools/my-attendance")
def test_my_attendance(
    current_user=Depends(require_role("student")),
    db: Session = Depends(get_db),
):

    return get_my_attendance(current_user, db)
