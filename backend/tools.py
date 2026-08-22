from fastapi import HTTPException
from sqlalchemy.orm import Session

from database import models
from datetime import date

def get_my_attendance(
    current_user,
    db: Session
):
    """
    Get attendance for the currently logged-in student.

    The student ID is NOT accepted from the user.
    We identify the student using the JWT-authenticated user.
    """

    # Find student linked to the logged-in user
    student = db.query(models.Student).filter(
        models.Student.user_id == current_user.id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student record not found"
        )

    return {
        "student_id": student.id,
        "student_name": student.name,
        "attendance_percentage": student.attendance_percentage
    }
def get_child_attendance(
    current_user,
    db: Session
):
    """
    Get attendance of the child belonging
    to the currently logged-in parent.
    """

    student = db.query(models.Student).filter(
        models.Student.parent_id == current_user.id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Child record not found"
        )

    return {
        "student_id": student.id,
        "student_name": student.name,
        "attendance_percentage": student.attendance_percentage
    }
mark_attendance_tool = {
    "name": "mark_attendance",
    "description": (
        "Mark a student's attendance as present or absent. "
        "Use this when a teacher wants to mark attendance "
        "for a student."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "student_name": {
                "type": "string",
                "description": "The name of the student."
            },
            "status": {
                "type": "string",
                "description": "Attendance status.",
                "enum": ["present", "absent"]
            }
        },
        "required": ["student_name", "status"]
    }
}
def mark_attendance(
    current_user,
    db: Session,
    student_name: str,
    status: str
):
    """
    Mark attendance for a student.

    Only the teacher assigned to that student
    can mark the attendance.
    """

    # Validate status
    if status not in ["present", "absent"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be 'present' or 'absent'"
        )

    # Find student
    student = db.query(models.Student).filter(
        models.Student.name == student_name
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    # Verify teacher owns this student
    if student.teacher_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail=(
                "You are not authorized to mark "
                "attendance for this student"
            )
        )

    # Create attendance record
    attendance = models.Attendance(
        student_id=student.id,
        date=date.today(),
        status=status
    )

    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return {
        "attendance_id": attendance.id,
        "student_id": student.id,
        "student_name": student.name,
        "date": str(attendance.date),
        "status": attendance.status
    }