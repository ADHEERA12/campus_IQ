from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import models
from auth import get_db, require_role


router = APIRouter(tags=["Principal"])


@router.get("/attendance/overall")
def get_overall_attendance(
    current_user=Depends(require_role("principal")),
    db: Session = Depends(get_db),
):

    students = db.query(models.Student).all()

    if not students:
        raise HTTPException(
            status_code=404,
            detail="No students found",
        )

    total = sum(
        float(student.__dict__.get("attendance_percentage") or 0.0)
        for student in students
    )

    average = total / len(students)

    return {
        "total_students": len(students),
        "overall_attendance_percentage": round(average, 2),
    }